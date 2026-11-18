// Agent mode — an EasyTax user acting as an HMRC-registered agent for their
// clients, through HMRC's Agent Authorisation API (2.0).
//
// Flow:
//   1. The agent saves their Agent Reference Number (ARN) and signs in to HMRC
//      with their *agent* Government Gateway (scopes below). That token is
//      stored in agent_connections, separately from the user's own taxpayer
//      connection in hmrc_connections.
//   2. For each client the agent creates an authorisation request
//      (POST /agents/{arn}/invitations) using the client's NINO + postcode
//      (Income Tax) or VRN + VAT registration date (VAT). HMRC returns a link
//      the client opens to accept, signed in with their own Government Gateway.
//   3. EasyTax polls the request; once accepted it confirms the relationship
//      (POST /agents/{arn}/relationships → 204).
//   4. The agent then files for the client with the same MTD APIs a taxpayer
//      uses, called with the agent's token and the client's NINO / VRN.
//
// HMRC granted production access to Agent Authorisation 2.0 on 2026-11-18
// (SDST ref 2026-CRJ844). Sandbox-only helpers (test users, simulating the
// client's answer) stay behind SANDBOX_CLIENT_SIMULATION.

import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { fraudHeaders } from '@/lib/hmrc';
import { HMRC_API_BASE as BASE, IS_HMRC_PRODUCTION } from '@/lib/hmrc-env';

export const AGENT_MODE_AVAILABLE = true;

// Agent Authorisation API scopes, plus the MTD scopes the agent files with.
export const AGENT_SCOPES = [
  'read:sent-invitations',
  'write:sent-invitations',
  'write:cancel-invitations',
  'read:check-relationship',
  'write:relationships',
  'read:self-assessment',
  'write:self-assessment',
  'read:vat',
  'write:vat',
];

export const ARN_PATTERN = /^[A-Z]ARN\d{7}$/;
export const NINO_PATTERN = /^[ABCEGHJKLMNOPRSTWXYZ][ABCEGHJKLMNPRSTWXYZ]\d{6}[A-D]$/;
export const POSTCODE_PATTERN = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$|^BFPO\s?[0-9]{1,5}$/;
export const VRN_PATTERN = /^\d{9}$/;

import type { AuthStatus } from '@/lib/agent-types';
export type { AuthStatus };

export type AgentClient = {
  id: string;
  agent_user_id: string;
  display_name: string;
  client_type: 'personal' | 'business';
  nino: string | null;
  postcode: string | null;
  business_id: string | null;
  itsa_agent_type: 'main' | 'supporting';
  itsa_status: AuthStatus;
  itsa_invitation_id: string | null;
  itsa_client_action_url: string | null;
  itsa_expires_on: string | null;
  vrn: string | null;
  vat_reg_date: string | null;
  vat_status: AuthStatus;
  vat_invitation_id: string | null;
  vat_client_action_url: string | null;
  vat_expires_on: string | null;
  last_checked_at: string | null;
};

export class AgentError extends Error {
  constructor(public code: string, public status: number, message?: string) {
    super(message ?? code);
  }
}

// ─── Token ───────────────────────────────────────────────────────────────────

export async function getAgentConnection(userId: string) {
  const { data } = await supabase
    .from('agent_connections')
    .select('arn, access_token, refresh_token, token_expires_at, connected_at')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

export async function getValidAgentToken(userId: string): Promise<{ token: string; arn: string }> {
  const conn = await getAgentConnection(userId);
  if (!conn) throw new AgentError('AGENT_NOT_SET_UP', 404, 'Agent mode is not set up.');
  if (!conn.access_token) throw new AgentError('AGENT_NOT_CONNECTED', 401, 'Sign in to HMRC with your agent Government Gateway first.');

  const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at).getTime() : 0;
  if (expiresAt - Date.now() > 5 * 60 * 1000 || !conn.refresh_token) {
    return { token: conn.access_token, arn: conn.arn };
  }

  const res = await fetch(`${BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     (process.env.HMRC_CLIENT_ID ?? '').trim(),
      client_secret: (process.env.HMRC_CLIENT_SECRET ?? '').trim(),
      refresh_token: conn.refresh_token,
    }),
  });
  if (!res.ok) throw new AgentError('AGENT_TOKEN_EXPIRED', 401, 'Your HMRC agent sign-in has expired. Sign in again.');
  const data = await res.json();
  await supabase.from('agent_connections').update({
    access_token:     data.access_token,
    refresh_token:    data.refresh_token ?? conn.refresh_token,
    token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  }).eq('user_id', userId);
  return { token: data.access_token as string, arn: conn.arn };
}

// ─── Agent Authorisation API ─────────────────────────────────────────────────

const ACCEPT = 'application/vnd.hmrc.2.0+json';

// The Agent Authorisation API endpoint a call is, by HMRC's names.
function endpointName(method: string, path: string): string {
  const p = path.replace(/^\/agents\/[^/]+/, '');
  if (method === 'POST' && p === '/invitations') return 'Create a new authorisation';
  if (method === 'GET' && (p === '/invitations' || p.startsWith('/invitations?'))) return 'Get all authorisation requests for the last 30 days';
  if (method === 'GET' && p.startsWith('/invitations/')) return 'Get an invitation by id';
  if (method === 'DELETE' && p.startsWith('/invitations/')) return 'Cancel an invitation by id';
  if (method === 'POST' && p === '/relationships') return 'Get status of a relationship';
  if (method === 'PUT' && p === '/deauthorise-client') return 'De-authorise an existing client relationship';
  return `${method} ${p}`;
}

async function logCall(path: string, method: string, status: number | null, correlationId: string | null) {
  try {
    await supabase.from('agent_api_log').insert({
      arn: path.match(/^\/agents\/([^/?]+)/)?.[1] ?? null,
      method, endpoint: endpointName(method, path), path, http_status: status, correlation_id: correlationId,
    });
  } catch { /* logging must never break a filing */ }
}

async function agentApi(path: string, token: string, init: RequestInit = {}) {
  const method = (init.method ?? 'GET').toUpperCase();
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: ACCEPT,
      'Content-Type': 'application/json',
      ...(await fraudHeaders()),
      ...(init.headers as Record<string, string> ?? {}),
    },
  });
  } catch (err) {
    await logCall(path, method, null, null);
    throw err;
  }
  await logCall(path, method, res.status, res.headers.get('x-correlation-id'));
  const text = await res.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: res.status, ok: res.ok, body, location: res.headers.get('location') };
}

function hmrcError(r: { status: number; body: unknown }): AgentError {
  const b = r.body as { code?: string; message?: string } | null;
  return new AgentError(b?.code ?? `HMRC_${r.status}`, r.status >= 500 ? 502 : r.status, b?.message ?? `HMRC returned ${r.status}`);
}

export type Service = 'itsa' | 'vat';

function invitationBody(client: AgentClient, service: Service) {
  if (service === 'itsa') {
    return {
      service: ['MTD-IT'], clientType: 'personal', clientIdType: 'ni',
      clientId: client.nino, knownFact: client.postcode, agentType: client.itsa_agent_type,
    };
  }
  return {
    service: ['MTD-VAT'], clientType: client.client_type, clientIdType: 'vrn',
    clientId: client.vrn, knownFact: client.vat_reg_date,
  };
}

export type Invitation = {
  status: string;               // Pending | Accepted | Rejected | Expired | Cancelled | …
  clientActionUrl?: string;
  expiresOn?: string;
  agentType?: string;
};

export async function createInvitation(arn: string, token: string, client: AgentClient, service: Service) {
  const r = await agentApi(`/agents/${arn}/invitations`, token, { method: 'POST', body: JSON.stringify(invitationBody(client, service)) });
  if (r.status !== 204 && r.status !== 201) throw hmrcError(r);
  const invitationId = r.location?.split('/').pop() ?? null;
  if (!invitationId) throw new AgentError('NO_INVITATION_ID', 502, 'HMRC did not return the authorisation request id.');
  return invitationId;
}

export async function getInvitation(arn: string, token: string, invitationId: string): Promise<Invitation> {
  const r = await agentApi(`/agents/${arn}/invitations/${encodeURIComponent(invitationId)}`, token);
  if (!r.ok) throw hmrcError(r);
  return r.body as Invitation;
}

export type SentInvitation = { invitationId: string; status: string; service?: string; clientActionUrl?: string; expiresOn?: string; created?: string };

// Authorisation requests the agent has sent in the last 30 days (HMRC's
// default window).
export async function listInvitations(arn: string, token: string): Promise<SentInvitation[]> {
  const r = await agentApi(`/agents/${arn}/invitations`, token);
  if (r.status === 404) return [];  // HMRC: no requests in the period
  if (!r.ok) throw hmrcError(r);
  const raw = Array.isArray(r.body) ? r.body : ((r.body as { invitations?: unknown[] } | null)?.invitations ?? []);
  return (raw as Record<string, unknown>[]).map(i => {
    const href = (i._links as { self?: { href?: string } } | undefined)?.self?.href ?? '';
    const service = Array.isArray(i.service) ? String(i.service[0]) : (i.service as string | undefined);
    return {
      invitationId: String(i.invitationId ?? i.id ?? href.split('/').pop() ?? ''),
      status: String(i.status ?? ''),
      service, clientActionUrl: i.clientActionUrl as string | undefined,
      expiresOn: i.expiresOn as string | undefined, created: i.created as string | undefined,
    };
  }).filter(i => i.invitationId);
}

// Sandbox only: answer an authorisation request as the client would, using
// HMRC's Agent Authorisation Test Support API. The sandbox has no page where
// a test client can accept, so this stands in for it. Never in production.
export const SANDBOX_CLIENT_SIMULATION = !IS_HMRC_PRODUCTION;
export async function sandboxRespondAsClient(invitationId: string, accept: boolean) {
  if (!SANDBOX_CLIENT_SIMULATION) throw new AgentError('NOT_AVAILABLE', 403, 'Only available in the HMRC sandbox.');
  const path = `/agent-authorisation-test-support/invitations/${encodeURIComponent(invitationId)}`;
  const method = accept ? 'PUT' : 'DELETE';
  const res = await fetch(`${BASE}${path}`, { method, headers: { Accept: 'application/vnd.hmrc.1.0+json', 'Content-Length': '0' } });
  try {
    await supabase.from('agent_api_log').insert({
      method, endpoint: accept ? 'Test support: accept invitation' : 'Test support: reject invitation',
      path, http_status: res.status, correlation_id: res.headers.get('x-correlation-id'),
    });
  } catch { /* logging must never break the call */ }
  if (res.status !== 204) {
    const body = await res.json().catch(() => null) as { code?: string; message?: string } | null;
    throw new AgentError(body?.code ?? `HMRC_${res.status}`, res.status >= 500 ? 502 : 400, body?.message ?? `HMRC returned ${res.status}`);
  }
}

export async function cancelInvitation(arn: string, token: string, invitationId: string) {
  const r = await agentApi(`/agents/${arn}/invitations/${encodeURIComponent(invitationId)}`, token, { method: 'DELETE' });
  if (r.status !== 204) throw hmrcError(r);
}

/** true = authorised, false = no active relationship. */
export async function checkRelationship(arn: string, token: string, client: AgentClient, service: Service): Promise<boolean> {
  const { clientType: _ct, ...body } = invitationBody(client, service);
  void _ct;
  const r = await agentApi(`/agents/${arn}/relationships`, token, { method: 'POST', body: JSON.stringify(body) });
  if (r.status === 204) return true;
  if (r.status === 404) return false;
  throw hmrcError(r);
}

export async function deauthoriseClient(arn: string, token: string, client: AgentClient, service: Service) {
  const { knownFact: _kf, ...body } = invitationBody(client, service);
  void _kf;
  const r = await agentApi(`/agents/${arn}/deauthorise-client`, token, { method: 'PUT', body: JSON.stringify(body) });
  if (r.status !== 204 && !(r.status === 403 && (r.body as { code?: string })?.code === 'NO_RELATIONSHIP')) throw hmrcError(r);
}

export function mapInvitationStatus(status: string): AuthStatus {
  switch (status.toLowerCase()) {
    case 'accepted':     return 'authorised';
    case 'rejected':     return 'rejected';
    case 'expired':      return 'expired';
    case 'cancelled':    return 'cancelled';
    case 'deauthorised': return 'deauthorised';
    default:             return 'pending';
  }
}

// ─── Client access ───────────────────────────────────────────────────────────

const CLIENT_COLUMNS = 'id, agent_user_id, display_name, client_type, nino, postcode, business_id, itsa_agent_type, itsa_status, itsa_invitation_id, itsa_client_action_url, itsa_expires_on, vrn, vat_reg_date, vat_status, vat_invitation_id, vat_client_action_url, vat_expires_on, last_checked_at';

export async function getClient(agentUserId: string, clientId: string): Promise<AgentClient> {
  if (!/^[0-9a-f-]{36}$/i.test(clientId)) throw new AgentError('CLIENT_NOT_FOUND', 404);
  const { data } = await supabase.from('agent_clients').select(CLIENT_COLUMNS)
    .eq('agent_user_id', agentUserId).eq('id', clientId).maybeSingle();
  if (!data) throw new AgentError('CLIENT_NOT_FOUND', 404, 'Client not found.');
  return data as AgentClient;
}

export async function listClients(agentUserId: string): Promise<AgentClient[]> {
  const { data } = await supabase.from('agent_clients').select(CLIENT_COLUMNS)
    .eq('agent_user_id', agentUserId).order('display_name');
  return (data ?? []) as AgentClient[];
}

/**
 * Everything a filing route needs to act for a client: the agent's token and
 * the client's identifiers. Refuses unless HMRC has authorised the agent for
 * that tax.
 */
export async function clientFilingContext(agentUserId: string, clientId: string, service: Service) {
  if (!AGENT_MODE_AVAILABLE) throw new AgentError('AGENT_MODE_NOT_AVAILABLE', 403, 'Agent mode is not available yet.');
  const client = await getClient(agentUserId, clientId);
  const status = service === 'itsa' ? client.itsa_status : client.vat_status;
  if (status !== 'authorised') {
    throw new AgentError('CLIENT_NOT_AUTHORISED', 403, `${client.display_name} has not authorised you for ${service === 'itsa' ? 'Income Tax' : 'VAT'} yet.`);
  }
  const { token } = await getValidAgentToken(agentUserId);
  return { client, token };
}

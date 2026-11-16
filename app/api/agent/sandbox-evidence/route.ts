import { NextRequest, NextResponse } from 'next/server';
import { HMRC_SANDBOX_BASE as SANDBOX } from '@/lib/hmrc-env';
import { AGENT_MODE_AVAILABLE, AgentError, agentApi, getValidAgentToken, invitationBody } from '@/lib/agent';
import { agentUserId, errorResponse } from '../_shared';

// Sandbox evidence for SDST's Agent Authorisation 2.0 production request.
//
// SDST (Patrick Gordon, 2026-11) asked for a timestamp against each of six
// endpoints. HMRC checks those against its own sandbox logs, so what matters
// is that each call really reaches the sandbox with the agent's token and
// fraud prevention headers, and that we record when. Every call is recorded
// with its UTC time and HTTP status, failures included — a 404 on "Get
// Status of a Relationship" before the client has accepted is still a
// correctly made call.
//
// Two phases, because one step cannot be automated: the client has to open
// HMRC's link and accept, signed in as the client.
//
//   invitations   create a sandbox individual (the client), then:
//                 Create a new authorisation        POST   /agents/{arn}/invitations
//                 Get all authorisation requests    GET    /agents/{arn}/invitations
//                 Get an invitation by id           GET    /agents/{arn}/invitations/{id}
//                 (a second request, to cancel)     POST   /agents/{arn}/invitations
//                 Cancel an invitation by id        DELETE /agents/{arn}/invitations/{id}
//
//   relationship  for the client from phase 1 (ideally after they accept):
//                 Get Status of a Relationship      POST   /agents/{arn}/relationships
//                 De-authorise a client relationship PUT   /agents/{arn}/deauthorise-client

export const maxDuration = 60;

type Row = {
  endpoint: string;      // SDST's wording, so the table can be pasted back as is
  method: string;
  path: string;
  timestamp: string;     // ISO 8601, UTC, taken immediately before the request
  status: number | null;
  ok: boolean;
  detail?: string;
};

async function appToken() {
  const res = await fetch(`${SANDBOX}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: (process.env.HMRC_CLIENT_ID ?? '').trim(),
      client_secret: (process.env.HMRC_CLIENT_SECRET ?? '').trim(),
    }),
  });
  if (!res.ok) throw new Error(`App token failed (${res.status})`);
  return (await res.json()).access_token as string;
}

async function createTestIndividual() {
  const res = await fetch(`${SANDBOX}/create-test-user/individuals`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await appToken()}`, Accept: 'application/vnd.hmrc.1.0+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ serviceNames: ['national-insurance', 'self-assessment', 'mtd-income-tax'] }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(`Creating the sandbox client failed (HMRC ${res.status})`);
  return {
    userId: d.userId as string,
    password: d.password as string,
    nino: d.nino as string,
    postcode: (d.individualDetails?.address?.postcode ?? '') as string,
  };
}

function errorText(body: unknown) {
  const b = body as { code?: string; message?: string } | null;
  return b?.code ? `${b.code}${b.message ? ` — ${b.message}` : ''}` : undefined;
}

export async function POST(req: NextRequest) {
  const uid = await agentUserId();
  if (!uid) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  if (!AGENT_MODE_AVAILABLE) return NextResponse.json({ error: 'AGENT_MODE_NOT_AVAILABLE' }, { status: 403 });

  const input = await req.json().catch(() => ({}));
  const phase = input.phase as 'invitations' | 'relationship';

  try {
    const { token, arn } = await getValidAgentToken(uid);
    const rows: Row[] = [];

    async function record(endpoint: string, method: string, path: string, init: RequestInit = {}) {
      const timestamp = new Date().toISOString();
      try {
        const r = await agentApi(path, token, { ...init, method });
        rows.push({ endpoint, method, path, timestamp, status: r.status, ok: r.ok, detail: r.ok ? undefined : errorText(r.body) });
        return r;
      } catch (err) {
        rows.push({ endpoint, method, path, timestamp, status: null, ok: false, detail: err instanceof Error ? err.message : String(err) });
        return null;
      }
    }

    if (phase === 'invitations') {
      const client = await createTestIndividual();
      const body = JSON.stringify(invitationBody(
        { nino: client.nino, postcode: client.postcode, itsa_agent_type: 'main', vrn: null, vat_reg_date: null, client_type: 'personal' },
        'itsa',
      ));
      const idFrom = (r: { location: string | null } | null) => r?.location?.split('/').pop() ?? null;

      const created = await record('Create a new authorisation', 'POST', `/agents/${arn}/invitations`, { body });
      const invitationId = idFrom(created);

      await record('Get all authorisation requests for the last 30 days', 'GET', `/agents/${arn}/invitations`);

      let clientActionUrl: string | null = null;
      if (invitationId) {
        const got = await record('Get an invitation by id', 'GET', `/agents/${arn}/invitations/${encodeURIComponent(invitationId)}`);
        clientActionUrl = (got?.body as { clientActionUrl?: string } | null)?.clientActionUrl ?? null;
      }

      // Cancelling the request the client is meant to accept would leave
      // nothing to accept, so cancel a second one.
      const second = await record('Create a new authorisation (second request, to cancel)', 'POST', `/agents/${arn}/invitations`, { body });
      const secondId = idFrom(second);
      if (secondId) {
        await record('Cancel an invitation by id', 'DELETE', `/agents/${arn}/invitations/${encodeURIComponent(secondId)}`);
      }

      return NextResponse.json({ arn, rows, client: { ...client, invitationId, clientActionUrl } });
    }

    if (phase === 'relationship') {
      const nino = String(input.nino ?? '').toUpperCase().replace(/\s/g, '');
      const postcode = String(input.postcode ?? '').toUpperCase().trim();
      if (!nino || !postcode) return NextResponse.json({ error: 'NINO and postcode of the phase 1 client are required.' }, { status: 400 });

      const full = invitationBody({ nino, postcode, itsa_agent_type: 'main', vrn: null, vat_reg_date: null, client_type: 'personal' }, 'itsa');
      const { clientType: _ct, ...relBody } = full;   void _ct;
      const { knownFact: _kf, ...deauthBody } = full; void _kf;

      await record('Get Status of a Relationship', 'POST', `/agents/${arn}/relationships`, { body: JSON.stringify(relBody) });
      await record('De-authorise an existing client relationship', 'PUT', `/agents/${arn}/deauthorise-client`, { body: JSON.stringify(deauthBody) });

      return NextResponse.json({ arn, rows });
    }

    return NextResponse.json({ error: 'phase must be "invitations" or "relationship"' }, { status: 400 });
  } catch (err) {
    // Sandbox-only page: say what failed (e.g. creating the test client)
    // rather than errorResponse's generic message for non-agent errors.
    if (err instanceof AgentError) return errorResponse(err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import {
  AGENT_MODE_AVAILABLE, getClient, getValidAgentToken, getInvitation, cancelInvitation,
  checkRelationship, deauthoriseClient, mapInvitationStatus, sandboxRespondAsClient,
  type AgentClient, type AuthStatus, type Service,
} from '@/lib/agent';
import { agentUserId, errorResponse } from '../../_shared';
import { sendInvitation } from '@/lib/agent-invitations';

// GET    one client
// PATCH  { action: 'refresh' }                    re-check both authorisations with HMRC
//        { action: 'invite' | 'cancel' | 'deauthorise', service: 'itsa'|'vat' }
//        { action: 'rename', displayName }
//        { action: 'sandbox-accept' | 'sandbox-reject', service }  sandbox only: answer as the client

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const uid = await agentUserId();
  if (!uid) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  try { return NextResponse.json({ client: await getClient(uid, (await params).id) }); }
  catch (err) { return errorResponse(err); }
}

async function refreshService(uid: string, client: AgentClient, service: Service): Promise<Partial<Record<string, unknown>>> {
  const p = service;
  const status = client[`${p}_status`] as AuthStatus;
  const invitationId = client[`${p}_invitation_id`] as string | null;
  const configured = service === 'itsa' ? !!client.nino : !!client.vrn;
  if (!configured || status === 'none') return {};
  const { token, arn } = await getValidAgentToken(uid);

  let next: AuthStatus = status;
  const update: Record<string, unknown> = {};
  if (invitationId && status === 'pending') {
    const inv = await getInvitation(arn, token, invitationId);
    next = mapInvitationStatus(inv.status);
    if (inv.clientActionUrl) update[`${p}_client_action_url`] = inv.clientActionUrl;
  }
  // Accepted requests, and relationships we think are live, are confirmed
  // against HMRC: the client can remove an agent at any time.
  if (next === 'authorised') {
    const wasPending = status === 'pending';
    try {
      next = (await checkRelationship(arn, token, client, service)) ? 'authorised' : 'deauthorised';
    } catch (err) {
      // HMRC has just told us the request was accepted. If the relationship
      // check itself fails (HMRC 5xx), trust that answer rather than failing
      // the whole check; the next check confirms the relationship.
      if (!wasPending) throw err;
    }
  }
  update[`${p}_status`] = next;
  return update;
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const uid = await agentUserId();
  if (!uid) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  if (!AGENT_MODE_AVAILABLE) return NextResponse.json({ error: 'AGENT_MODE_NOT_AVAILABLE' }, { status: 403 });
  const id = (await params).id;
  const body = await req.json().catch(() => ({}));
  const service: Service | null = body.service === 'itsa' || body.service === 'vat' ? body.service : null;

  try {
    const client = await getClient(uid, id);
    const save = async (update: Record<string, unknown>) => {
      if (Object.keys(update).length === 0) return;
      await supabase.from('agent_clients').update({ ...update, updated_at: new Date().toISOString() })
        .eq('id', id).eq('agent_user_id', uid);
    };

    switch (body.action) {
      case 'refresh': {
        const update = { ...(await refreshService(uid, client, 'itsa')), ...(await refreshService(uid, client, 'vat')), last_checked_at: new Date().toISOString() };
        await save(update);
        break;
      }
      case 'invite': {
        if (!service) return NextResponse.json({ error: 'INVALID_SERVICE' }, { status: 400 });
        if ((service === 'itsa' && !client.nino) || (service === 'vat' && !client.vrn)) {
          return NextResponse.json({ error: 'MISSING_IDENTIFIER', message: 'Add the client’s identifier for this tax first.' }, { status: 400 });
        }
        await sendInvitation(uid, client, service);
        break;
      }
      case 'cancel': {
        if (!service) return NextResponse.json({ error: 'INVALID_SERVICE' }, { status: 400 });
        const invitationId = client[`${service}_invitation_id`];
        if (!invitationId || client[`${service}_status`] !== 'pending') {
          return NextResponse.json({ error: 'NOT_PENDING', message: 'There is no pending request to cancel.' }, { status: 409 });
        }
        const { token, arn } = await getValidAgentToken(uid);
        await cancelInvitation(arn, token, invitationId);
        await save({ [`${service}_status`]: 'cancelled', [`${service}_client_action_url`]: null });
        break;
      }
      case 'deauthorise': {
        if (!service) return NextResponse.json({ error: 'INVALID_SERVICE' }, { status: 400 });
        const { token, arn } = await getValidAgentToken(uid);
        await deauthoriseClient(arn, token, client, service);
        await save({ [`${service}_status`]: 'deauthorised', [`${service}_client_action_url`]: null });
        break;
      }
      case 'sandbox-accept':
      case 'sandbox-reject': {
        if (!service) return NextResponse.json({ error: 'INVALID_SERVICE' }, { status: 400 });
        const invitationId = client[`${service}_invitation_id`];
        if (!invitationId || client[`${service}_status`] !== 'pending') {
          return NextResponse.json({ error: 'NOT_PENDING', message: 'There is no pending request to answer.' }, { status: 409 });
        }
        await sandboxRespondAsClient(invitationId, body.action === 'sandbox-accept');
        // Read the new state back from HMRC, as a real client's answer would be.
        await save({ ...(await refreshService(uid, client, service)), last_checked_at: new Date().toISOString() });
        break;
      }
      case 'rename': {
        const name = typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 120) : '';
        if (!name) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
        await save({ display_name: name });
        break;
      }
      default:
        return NextResponse.json({ error: 'INVALID_ACTION' }, { status: 400 });
    }
    return NextResponse.json({ client: await getClient(uid, id) });
  } catch (err) {
    return errorResponse(err);
  }
}

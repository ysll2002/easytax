import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getValidAgentToken, listInvitations, mapInvitationStatus } from '@/lib/agent';
import { agentUserId, errorResponse } from '../_shared';

// GET /api/agent/invitations
// The authorisation requests this agent sent in the last 30 days, read from
// HMRC in one call. Clients whose request is still pending here are updated
// with HMRC's status (accepted requests are confirmed per client afterwards
// with the relationship check).
export async function GET() {
  const uid = await agentUserId();
  if (!uid) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  try {
    const { token, arn } = await getValidAgentToken(uid);
    const invitations = await listInvitations(arn, token);
    const byId = new Map(invitations.map(i => [i.invitationId, i]));

    const { data: clients } = await supabase.from('agent_clients')
      .select('id, itsa_status, itsa_invitation_id, vat_status, vat_invitation_id')
      .eq('agent_user_id', uid);
    let updated = 0;
    for (const c of clients ?? []) {
      const update: Record<string, unknown> = {};
      for (const p of ['itsa', 'vat'] as const) {
        const inv = c[`${p}_invitation_id`] ? byId.get(c[`${p}_invitation_id`] as string) : undefined;
        if (!inv || c[`${p}_status`] !== 'pending') continue;
        const next = mapInvitationStatus(inv.status);
        if (next !== 'pending') update[`${p}_status`] = next;
        if (inv.clientActionUrl) update[`${p}_client_action_url`] = inv.clientActionUrl;
      }
      if (Object.keys(update).length) {
        await supabase.from('agent_clients').update({ ...update, updated_at: new Date().toISOString() }).eq('id', c.id).eq('agent_user_id', uid);
        updated++;
      }
    }
    return NextResponse.json({ count: invitations.length, updated, invitations });
  } catch (err) {
    return errorResponse(err);
  }
}

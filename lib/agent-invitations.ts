import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import {
  getValidAgentToken, createInvitation, getInvitation, mapInvitationStatus,
  type AgentClient, type Service,
} from '@/lib/agent';

// HMRC's examples show both "2019-02-11T00:00:00.000" and "…00:00:000".
function parseHmrcDate(s?: string): string | null {
  if (!s) return null;
  const d = new Date(s.replace(/:(\d{3})$/, '.$1'));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Send an authorisation request and record it on the client row. */
export async function sendInvitation(uid: string, client: AgentClient, service: Service) {
  const { token, arn } = await getValidAgentToken(uid);
  const invitationId = await createInvitation(arn, token, client, service);
  let url: string | null = null;
  let expires: string | null = null;
  let status = 'pending';
  try {
    const inv = await getInvitation(arn, token, invitationId);
    url = inv.clientActionUrl ?? null;
    expires = parseHmrcDate(inv.expiresOn);
    status = mapInvitationStatus(inv.status);
  } catch { /* the request exists; its link can be fetched on the next refresh */ }
  const p = service === 'itsa' ? 'itsa' : 'vat';
  await supabase.from('agent_clients').update({
    [`${p}_status`]: status,
    [`${p}_invitation_id`]: invitationId,
    [`${p}_client_action_url`]: url,
    [`${p}_expires_on`]: expires,
    updated_at: new Date().toISOString(),
  }).eq('id', client.id).eq('agent_user_id', uid);
}


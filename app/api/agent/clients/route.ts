import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import {
  AGENT_MODE_AVAILABLE, NINO_PATTERN, POSTCODE_PATTERN, VRN_PATTERN, AgentError,
  listClients, getClient, type Service,
} from '@/lib/agent';
import { sendInvitation } from '@/lib/agent-invitations';
import { agentUserId, errorResponse } from '../_shared';

// GET   the agent's clients
// POST  add a client and send HMRC authorisation request(s)
//       { displayName, clientType, services: ['itsa'|'vat'], nino, postcode, agentType, vrn, vatRegDate }
export async function GET() {
  const uid = await agentUserId();
  if (!uid) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  return NextResponse.json({ clients: await listClients(uid) });
}

export async function POST(req: NextRequest) {
  const uid = await agentUserId();
  if (!uid) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  if (!AGENT_MODE_AVAILABLE) return NextResponse.json({ error: 'AGENT_MODE_NOT_AVAILABLE' }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const displayName = typeof b.displayName === 'string' ? b.displayName.trim().slice(0, 120) : '';
  const clientType = b.clientType === 'business' ? 'business' : 'personal';
  const services: Service[] = Array.isArray(b.services) ? b.services.filter((s: unknown): s is Service => s === 'itsa' || s === 'vat') : [];
  const nino = typeof b.nino === 'string' ? b.nino.replace(/\s/g, '').toUpperCase() : '';
  const postcode = typeof b.postcode === 'string' ? b.postcode.trim().toUpperCase().replace(/\s+/g, ' ') : '';
  const agentType = b.agentType === 'supporting' ? 'supporting' : 'main';
  const vrn = typeof b.vrn === 'string' ? b.vrn.replace(/\D/g, '') : '';
  const vatRegDate = typeof b.vatRegDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.vatRegDate) ? b.vatRegDate : '';

  const bad = (message: string) => NextResponse.json({ error: 'INVALID_INPUT', message }, { status: 400 });
  if (!displayName) return bad('Enter the client’s name.');
  if (services.length === 0) return bad('Choose Income Tax, VAT or both.');
  if (services.includes('itsa')) {
    if (clientType !== 'personal') return bad('Income Tax authorisation is for individuals and sole traders.');
    if (!NINO_PATTERN.test(nino)) return bad('Enter a valid National Insurance number, like QQ123456C.');
    if (!POSTCODE_PATTERN.test(postcode)) return bad('Enter the client’s postcode as HMRC holds it, like SW1A 1AA.');
  }
  if (services.includes('vat')) {
    if (!VRN_PATTERN.test(vrn)) return bad('Enter a 9-digit VAT registration number.');
    if (!vatRegDate) return bad('Enter the client’s VAT registration date.');
  }

  const { data: row, error } = await supabase.from('agent_clients').insert({
    agent_user_id: uid,
    display_name: displayName,
    client_type: clientType,
    nino: services.includes('itsa') ? nino : null,
    postcode: services.includes('itsa') ? postcode : null,
    itsa_agent_type: agentType,
    vrn: services.includes('vat') ? vrn : null,
    vat_reg_date: services.includes('vat') ? vatRegDate : null,
  }).select('id').single();
  if (error) {
    if (error.code === '23505') return bad('You already have a client with that National Insurance number or VRN.');
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  const results: Record<string, string> = {};
  for (const service of services) {
    try {
      await sendInvitation(uid, await getClient(uid, row.id), service);
      results[service] = 'sent';
    } catch (err) {
      results[service] = err instanceof AgentError ? `${err.code}: ${err.message}` : 'failed';
    }
  }
  try {
    return NextResponse.json({ id: row.id, results, client: await getClient(uid, row.id) });
  } catch (err) {
    return errorResponse(err);
  }
}

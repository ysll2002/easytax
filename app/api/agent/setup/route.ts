import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { AGENT_MODE_AVAILABLE, ARN_PATTERN, getAgentConnection } from '@/lib/agent';
import { agentUserId } from '../_shared';

// GET  agent mode status for the signed-in user
// POST { arn }       save (or change) the Agent Reference Number
// POST { firmName }  save the accounting firm's name (agents who signed up
//                    with Google were not asked for it at sign-up)
export async function GET() {
  const uid = await agentUserId();
  if (!uid) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const [conn, { data: profile }] = await Promise.all([
    getAgentConnection(uid),
    supabase.from('profiles').select('firm_name').eq('id', uid).maybeSingle(),
  ]);
  return NextResponse.json({
    firmName: profile?.firm_name ?? null,
    available: AGENT_MODE_AVAILABLE,
    arn: conn?.arn ?? null,
    connected: !!conn?.access_token,
    connectedAt: conn?.connected_at ?? null,
  });
}

export async function POST(req: NextRequest) {
  const uid = await agentUserId();
  if (!uid) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  if (!AGENT_MODE_AVAILABLE) return NextResponse.json({ error: 'AGENT_MODE_NOT_AVAILABLE' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (body.firmName !== undefined) {
    const firmName = typeof body.firmName === 'string' ? body.firmName.trim().replace(/\s+/g, ' ') : '';
    if (firmName.length < 2 || firmName.length > 120) {
      return NextResponse.json({ error: 'INVALID_FIRM_NAME', message: 'Enter your accounting firm\'s name.' }, { status: 400 });
    }
    const { error } = await supabase.from('profiles').update({ firm_name: firmName }).eq('id', uid);
    if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 });
    return NextResponse.json({ ok: true, firmName });
  }
  const arn = typeof body.arn === 'string' ? body.arn.replace(/[\s-]/g, '').toUpperCase() : '';
  if (!ARN_PATTERN.test(arn)) {
    return NextResponse.json({ error: 'INVALID_ARN', message: 'An Agent Reference Number looks like XARN1234567.' }, { status: 400 });
  }
  const existing = await getAgentConnection(uid);
  // A different ARN is a different agency: drop the old sign-in.
  const reset = existing && existing.arn !== arn
    ? { access_token: null, refresh_token: null, token_expires_at: null, connected_at: null }
    : {};
  const { error } = await supabase.from('agent_connections').upsert({ user_id: uid, arn, ...reset }, { onConflict: 'user_id' });
  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 });
  return NextResponse.json({ ok: true, arn });
}

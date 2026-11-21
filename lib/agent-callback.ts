import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { HMRC_API_BASE as BASE } from '@/lib/hmrc-env';
import { AGENT_MODE_AVAILABLE } from '@/lib/agent';

// The second half of /api/agent/hmrc/connect: exchange the code and store
// the agent's token in agent_connections (never in hmrc_connections, which
// holds the user's own taxpayer connection).
export async function handleAgentCallback(req: NextRequest, code: string | null, error: string | null, state: string) {
  const back = (q: string) => NextResponse.redirect(new URL(`/dashboard/agent?${q}`, req.url));

  const jar = await cookies();
  const expected = jar.get('hmrc_agent_oauth_state')?.value;
  jar.delete('hmrc_agent_oauth_state');
  if (!expected || expected !== state) return back('error=state_mismatch');
  if (error || !code) return back('error=access_denied');
  if (!AGENT_MODE_AVAILABLE) return back('error=not_available');

  const session = await auth();
  if (!session?.user?.profileId) return NextResponse.redirect(new URL('/agent/login', req.url));
  if (session.user.accountType !== 'agent') return NextResponse.redirect(new URL('/dashboard', req.url));

  const tokenRes = await fetch(`${BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     (process.env.HMRC_CLIENT_ID ?? '').trim(),
      client_secret: (process.env.HMRC_CLIENT_SECRET ?? '').trim(),
      code,
      redirect_uri:  (process.env.HMRC_REDIRECT_URI ?? '').trim(),
    }),
  });
  if (!tokenRes.ok) return back(`error=token_exchange&status=${tokenRes.status}`);
  const tokens = await tokenRes.json();

  const { error: dbError } = await supabase.from('agent_connections').update({
    access_token:     tokens.access_token,
    refresh_token:    tokens.refresh_token ?? null,
    token_expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
    connected_at:     new Date().toISOString(),
  }).eq('user_id', session.user.profileId);
  if (dbError) return back('error=db');

  return back('connected=1');
}

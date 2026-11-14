import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { auth } from '@/auth';
import { HMRC_API_BASE } from '@/lib/hmrc-env';
import { AGENT_MODE_AVAILABLE, AGENT_SCOPES, getAgentConnection } from '@/lib/agent';

// Starts the HMRC sign-in for agent mode. The agent signs in with their
// *agent* Government Gateway (the one linked to their Agent Services
// Account). HMRC sends them back to the app's single registered callback,
// /api/auth/callback/hmrc, which tells this flow apart by the `state` value
// and checks it against the cookie set here.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.profileId) return NextResponse.redirect(new URL('/login', req.url));
  if (!AGENT_MODE_AVAILABLE) return NextResponse.redirect(new URL('/dashboard/agent', req.url));

  const conn = await getAgentConnection(session.user.profileId);
  if (!conn?.arn) return NextResponse.redirect(new URL('/dashboard/agent?error=arn_missing', req.url));

  const state = `agent.${randomBytes(16).toString('hex')}`;
  const url = new URL(`${HMRC_API_BASE}/oauth/authorize`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', (process.env.HMRC_CLIENT_ID ?? '').trim());
  url.searchParams.set('scope', AGENT_SCOPES.join(' '));
  url.searchParams.set('redirect_uri', (process.env.HMRC_REDIRECT_URI ?? '').trim());
  url.searchParams.set('state', state);

  const res = NextResponse.redirect(url);
  // Lax, not Strict: the browser must send it on the top-level redirect back
  // from HMRC's domain.
  res.cookies.set('hmrc_agent_oauth_state', state, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 600,
  });
  return res;
}

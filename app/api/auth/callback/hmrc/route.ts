import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/dashboard/tax/hmrc?error=access_denied', req.url));
  }

  // Exchange code for token
  const tokenRes = await fetch('https://test-api.service.hmrc.gov.uk/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     process.env.HMRC_CLIENT_ID!,
      client_secret: process.env.HMRC_CLIENT_SECRET!,
      code,
      redirect_uri:  process.env.HMRC_REDIRECT_URI!,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/dashboard/tax/hmrc?error=token_exchange', req.url));
  }

  const tokens = await tokenRes.json();

  // Fetch Self Assessment obligations to get NINO / UTR
  let nino: string | null = null;
  let utr:  string | null = null;

  try {
    const meRes = await fetch('https://test-api.service.hmrc.gov.uk/oauth/token/verify', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (meRes.ok) {
      const me = await meRes.json();
      nino = me.nino ?? null;
    }
  } catch { /* non-blocking */ }

  const session = await auth();
  if (!session) return NextResponse.redirect(new URL('/login', req.url));

  const profileId = session.user.profileId;

  await supabase.from('hmrc_connections').upsert({
    user_id:       profileId,
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    token_expires_at: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
    nino,
    utr,
    connected_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  return NextResponse.redirect(new URL('/dashboard/tax/tasks', req.url));
}

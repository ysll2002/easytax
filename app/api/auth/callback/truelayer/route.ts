import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/dashboard/tax/banking?error=access_denied', req.url));
  }

  const authBase = process.env.TRUELAYER_AUTH_URL ?? 'https://auth.truelayer-sandbox.com';

  const tokenRes = await fetch(`${authBase}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     process.env.TRUELAYER_CLIENT_ID!,
      client_secret: process.env.TRUELAYER_CLIENT_SECRET!,
      code,
      redirect_uri:  process.env.TRUELAYER_REDIRECT_URI!,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/dashboard/tax/banking?error=token_exchange', req.url));
  }

  const tokens = await tokenRes.json();

  // Fetch accounts
  const dataBase = process.env.TRUELAYER_DATA_URL ?? 'https://api.truelayer-sandbox.com/data/v1';
  let accountName = 'Business Account';
  let accountId   = '';

  try {
    const acctRes = await fetch(`${dataBase}/accounts`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (acctRes.ok) {
      const { results } = await acctRes.json();
      if (results?.[0]) {
        accountName = results[0].display_name ?? results[0].account_type ?? 'Business Account';
        accountId   = results[0].account_id ?? '';
      }
    }
  } catch { /* non-blocking */ }

  const session = await auth();
  if (!session) return NextResponse.redirect(new URL('/login', req.url));

  const profileId = session.user.profileId;

  await supabase.from('bank_connections').upsert({
    user_id:       profileId,
    provider:      'truelayer',
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    account_id:    accountId,
    account_name:  accountName,
    token_expires_at: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
    connected_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  return NextResponse.redirect(new URL('/dashboard/tax', req.url));
}

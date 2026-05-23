import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';

const AUTH_BASE = process.env.TRUELAYER_AUTH_URL ?? 'https://auth.truelayer-sandbox.com';
const DATA_BASE = process.env.TRUELAYER_DATA_URL ?? 'https://api.truelayer-sandbox.com/data/v1';

async function refreshAccessToken(userId: string, refreshToken: string): Promise<string | null> {
  const res = await fetch(`${AUTH_BASE}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     process.env.TRUELAYER_CLIENT_ID!,
      client_secret: process.env.TRUELAYER_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) return null;

  const tokens = await res.json();

  await supabase.from('bank_connections').update({
    access_token:     tokens.access_token,
    refresh_token:    tokens.refresh_token ?? refreshToken,
    token_expires_at: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
  }).eq('user_id', userId);

  return tokens.access_token;
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = session.user.profileId;

  const { data: bank } = await supabase
    .from('bank_connections')
    .select('access_token, refresh_token, account_id, token_expires_at')
    .eq('user_id', profileId)
    .single();

  if (!bank) return NextResponse.json({ error: 'no_bank' }, { status: 404 });

  let accessToken: string = bank.access_token;

  // Refresh if expired (or expiring within 60s)
  const expiresAt = bank.token_expires_at ? new Date(bank.token_expires_at).getTime() : 0;
  if (expiresAt && Date.now() > expiresAt - 60_000) {
    if (!bank.refresh_token) {
      return NextResponse.json({ error: 'token_expired' }, { status: 401 });
    }
    const newToken = await refreshAccessToken(profileId, bank.refresh_token);
    if (!newToken) return NextResponse.json({ error: 'token_refresh_failed' }, { status: 401 });
    accessToken = newToken;
  }

  // Fetch last 90 days of transactions
  const to   = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 90);

  const url = `${DATA_BASE}/accounts/${bank.account_id}/transactions` +
    `?from=${from.toISOString()}&to=${to.toISOString()}`;

  const txRes = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!txRes.ok) {
    const body = await txRes.text();
    console.error('TrueLayer transactions error:', txRes.status, body);
    return NextResponse.json({ error: 'fetch_failed' }, { status: 502 });
  }

  const { results } = await txRes.json();

  const transactions = (results ?? []).map((tx: Record<string, unknown>) => ({
    transaction_id: tx.transaction_id,
    timestamp:      tx.timestamp,
    description:    tx.description ?? tx.merchant_name ?? 'Unknown',
    amount:         tx.amount,
    currency:       tx.currency ?? 'GBP',
  }));

  return NextResponse.json({ transactions });
}

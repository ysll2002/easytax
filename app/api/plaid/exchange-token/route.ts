import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { plaidClient } from '@/lib/plaid';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = session.user.profileId;
  const { public_token, institution } = await req.json().catch(() => ({}));
  if (!public_token) return NextResponse.json({ error: 'missing_public_token' }, { status: 400 });

  try {
    // Exchange public_token for a permanent access_token
    const exchange = await plaidClient.itemPublicTokenExchange({ public_token });
    const accessToken = exchange.data.access_token;
    const itemId      = exchange.data.item_id;

    // Pull the first account so we know what to show in the UI
    let accountId   = '';
    let accountName = institution?.name ?? 'Business Account';
    try {
      const accts = await plaidClient.accountsGet({ access_token: accessToken });
      const first = accts.data.accounts?.[0];
      if (first) {
        accountId   = first.account_id;
        accountName = first.name ?? accountName;
      }
    } catch { /* non-blocking */ }

    await supabase.from('bank_connections').upsert({
      user_id:          profileId,
      provider:         'plaid',
      access_token:     accessToken,
      refresh_token:    null,                          // Plaid access tokens don't expire
      account_id:       accountId,
      account_name:     accountName,
      item_id:          itemId,
      token_expires_at: null,
      connected_at:     new Date().toISOString(),
    }, { onConflict: 'user_id' });

    return NextResponse.json({ ok: true, account_name: accountName });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[plaid] exchange failed:', msg);
    return NextResponse.json({ error: 'exchange_failed' }, { status: 502 });
  }
}

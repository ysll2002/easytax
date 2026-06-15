import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { plaidClient, PLAID_COUNTRY_CODES, PLAID_LANGUAGE, PLAID_PRODUCTS } from '@/lib/plaid';

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const res = await plaidClient.linkTokenCreate({
      user:          { client_user_id: String(session.user.profileId) },
      client_name:   'EasyTax',
      products:      PLAID_PRODUCTS,
      country_codes: PLAID_COUNTRY_CODES,
      language:      PLAID_LANGUAGE,
    });
    return NextResponse.json({ link_token: res.data.link_token, expiration: res.data.expiration });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[plaid] linkTokenCreate failed:', msg);
    return NextResponse.json({ error: 'link_token_failed' }, { status: 502 });
  }
}

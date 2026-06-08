import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { plaidClient } from '@/lib/plaid';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = session.user.profileId;

  const { data: bank } = await supabase
    .from('bank_connections')
    .select('access_token, account_id, provider')
    .eq('user_id', profileId)
    .single();

  if (!bank) return NextResponse.json({ error: 'no_bank' }, { status: 404 });
  if (!bank.access_token) return NextResponse.json({ error: 'token_missing' }, { status: 401 });

  // Last 90 days
  const to   = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 90);
  const startDate = from.toISOString().slice(0, 10);
  const endDate   = to.toISOString().slice(0, 10);

  try {
    const res = await plaidClient.transactionsGet({
      access_token: bank.access_token,
      start_date:   startDate,
      end_date:     endDate,
      options: bank.account_id ? { account_ids: [bank.account_id], count: 250 } : { count: 250 },
    });

    const transactions = (res.data.transactions ?? []).map(tx => ({
      transaction_id: tx.transaction_id,
      timestamp:      tx.date,
      description:    tx.merchant_name ?? tx.name ?? 'Unknown',
      // Plaid: +amount = outflow / debit. Flip to "+ = income, – = expense" to match downstream consumers.
      amount:         -tx.amount,
      currency:       tx.iso_currency_code ?? tx.unofficial_currency_code ?? 'GBP',
    }));

    return NextResponse.json({ transactions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[plaid] transactionsGet failed:', msg);
    return NextResponse.json({ error: 'fetch_failed', detail: msg }, { status: 502 });
  }
}

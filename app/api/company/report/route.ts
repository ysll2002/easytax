import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { plaidClient } from '@/lib/plaid';

// ── Expense sub-account keyword rules ────────────────────────────────────────
const EXPENSE_RULES: { account: string; keywords: string[] }[] = [
  { account: 'Travel & Subsistence',      keywords: ['uber', 'taxi', 'train', 'rail', 'tfl', 'bus', 'fuel', 'petrol', 'parking', 'hotel', 'airbnb', 'flight', 'easyjet', 'ryanair', 'ba.com', 'heathrow'] },
  { account: 'IT & Software',             keywords: ['amazon', 'apple', 'microsoft', 'google', 'adobe', 'github', 'netlify', 'vercel', 'aws', 'digitalocean', 'cloudflare', 'software', 'saas', 'hosting', 'domain', 'openai', 'anthropic', 'slack', 'notion', 'figma', 'zapier', 'subscription'] },
  { account: 'Professional Services',     keywords: ['solicitor', 'accountant', 'legal', 'barrister', 'consulting', 'advisor', 'bookkeep'] },
  { account: 'Office & Admin',            keywords: ['rent', 'office', 'stationery', 'postage', 'printer', 'utilities', 'electricity', 'broadband', 'phone', 'vodafone', 'o2', 'three', 'bt ', 'virgin media'] },
  { account: 'Marketing & Advertising',   keywords: ['facebook', 'instagram', 'meta ', 'linkedin', 'twitter', 'google ads', 'advertising', 'marketing', 'mailchimp', 'klaviyo', 'pr ', 'branding'] },
  { account: 'Bank & Finance Charges',    keywords: ['bank charge', 'stripe', 'paypal', 'interest', 'transfer fee', 'service charge', 'overdraft', 'wise', 'revolut fee', 'monzo fee'] },
];

function classifyExpense(description: string): string {
  const lower = description.toLowerCase();
  for (const rule of EXPENSE_RULES) {
    if (rule.keywords.some(k => lower.includes(k))) return rule.account;
  }
  return 'Other Expenses';
}

function toDate(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fromIso = searchParams.get('from') ?? new Date(new Date().getFullYear(), 3, 6).toISOString();
  const toIso   = searchParams.get('to')   ?? new Date().toISOString();
  const startDate = toDate(fromIso);
  const endDate   = toDate(toIso);

  const { data: bank } = await supabase
    .from('bank_connections')
    .select('access_token, account_id, provider')
    .eq('user_id', session.user.profileId)
    .single();

  if (!bank) return NextResponse.json({ error: 'no_bank' }, { status: 404 });
  if (!bank.access_token) return NextResponse.json({ error: 'token_missing' }, { status: 401 });

  let rawTx: { description: string; amount: number }[] = [];
  let bankBalance: number | null = null;

  try {
    // Fetch across all accounts on the Plaid item. Previously we filtered by a
    // stored account_id, but that id can go stale (INVALID_FIELD) after
    // reconnects. Simpler + more robust to let Plaid return the whole item.
    const txRes = await plaidClient.transactionsGet({
      access_token: bank.access_token,
      start_date:   startDate,
      end_date:     endDate,
      options:      { count: 500 },
    });
    rawTx = (txRes.data.transactions ?? []).map(tx => ({
      description: tx.merchant_name ?? tx.name ?? 'Unknown',
      // Plaid: +amount = outflow / debit. Flip so we use the intuitive "+ = income, – = expense" convention.
      amount:      -tx.amount,
    }));

    try {
      const balRes = await plaidClient.accountsBalanceGet({ access_token: bank.access_token });
      // Sum across all current balances on the item.
      bankBalance = (balRes.data.accounts ?? []).reduce((s, a) => s + (a.balances?.current ?? 0), 0) || null;
    } catch { /* non-blocking */ }
  } catch (err: unknown) {
    // Plaid errors come through axios; the useful body is in err.response.data,
    // not err.message (which is a generic "Request failed with status code N").
    const axiosErr = err as { response?: { data?: { error_code?: string; error_message?: string; display_message?: string } }; message?: string };
    const plaidBody = axiosErr.response?.data;
    const detail = plaidBody?.error_code
      ? `${plaidBody.error_code}: ${plaidBody.error_message ?? plaidBody.display_message ?? ''}`
      : (err instanceof Error ? err.message : String(err));
    console.error('[plaid] report fetch failed:', detail, plaidBody);
    return NextResponse.json({ error: 'fetch_failed', detail }, { status: 502 });
  }

  // Compute P&L
  type ExpenseEntry = { account: string; amount: number; count: number };
  const incomeLines: { description: string; amount: number }[] = [];
  const expenseMap = new Map<string, ExpenseEntry>();
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const tx of rawTx) {
    if (tx.amount > 0) {
      incomeLines.push({ description: tx.description, amount: tx.amount });
      totalIncome += tx.amount;
    } else if (tx.amount < 0) {
      const account = classifyExpense(tx.description);
      const abs = Math.abs(tx.amount);
      const existing = expenseMap.get(account);
      if (existing) { existing.amount += abs; existing.count += 1; }
      else expenseMap.set(account, { account, amount: abs, count: 1 });
      totalExpenses += abs;
    }
  }

  const expenseLines = [...expenseMap.values()].sort((a, b) => b.amount - a.amount);
  const netProfit = totalIncome - totalExpenses;
  const corpTaxEstimate = netProfit > 0 ? +(netProfit * 0.25).toFixed(2) : 0;

  return NextResponse.json({
    period: { from: fromIso, to: toIso },
    pl: { totalIncome, totalExpenses, netProfit, corpTaxEstimate, incomeLines, expenseLines },
    balance: { bankBalance },
  });
}

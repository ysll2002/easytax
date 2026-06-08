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
    const txRes = await plaidClient.transactionsGet({
      access_token: bank.access_token,
      start_date:   startDate,
      end_date:     endDate,
      options:      bank.account_id ? { account_ids: [bank.account_id], count: 500 } : { count: 500 },
    });
    rawTx = (txRes.data.transactions ?? []).map(tx => ({
      description: tx.merchant_name ?? tx.name ?? 'Unknown',
      // Plaid: +amount = outflow / debit. Flip so we use the intuitive "+ = income, – = expense" convention.
      amount:      -tx.amount,
    }));

    try {
      const balRes = await plaidClient.accountsBalanceGet({
        access_token: bank.access_token,
        options:      bank.account_id ? { account_ids: [bank.account_id] } : undefined,
      });
      bankBalance = balRes.data.accounts?.[0]?.balances?.current ?? null;
    } catch { /* non-blocking */ }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[plaid] report fetch failed:', msg);
    return NextResponse.json({ error: 'fetch_failed', detail: msg }, { status: 502 });
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

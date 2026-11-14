import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

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

  // Source: the customer's business records (Records page). Only records
  // marked as business income or expense are counted.
  const { data: records, error } = await supabase
    .from('business_records')
    .select('description, amount, category')
    .eq('user_id', session.user.profileId)
    .in('category', ['business_income', 'business_expense'])
    .gte('txn_date', startDate)
    .lte('txn_date', endDate);
  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 });
  if (!records || records.length === 0) return NextResponse.json({ error: 'no_records' }, { status: 404 });

  // Cash at bank is not known without a bank feed.
  const bankBalance: number | null = null;

  // Compute P&L
  type ExpenseEntry = { account: string; amount: number; count: number };
  const incomeLines: { description: string; amount: number }[] = [];
  const expenseMap = new Map<string, ExpenseEntry>();
  let totalIncome = 0;
  let totalExpenses = 0;

  // Category decides income vs expense, not the sign: a refund marked as an
  // expense (positive amount) reduces expenses.
  for (const r of records) {
    const description = r.description as string;
    const amount = Number(r.amount);
    if (r.category === 'business_income') {
      incomeLines.push({ description, amount });
      totalIncome += amount;
    } else {
      const account = classifyExpense(description);
      const cost = -amount;
      const existing = expenseMap.get(account);
      if (existing) { existing.amount += cost; existing.count += 1; }
      else expenseMap.set(account, { account, amount: cost, count: 1 });
      totalExpenses += cost;
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

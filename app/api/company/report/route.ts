import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';

const AUTH_BASE = process.env.TRUELAYER_AUTH_URL ?? 'https://auth.truelayer-sandbox.com';
const DATA_BASE = process.env.TRUELAYER_DATA_URL ?? 'https://api.truelayer-sandbox.com/data/v1';

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

async function getAccessToken(profileId: string) {
  const { data: bank } = await supabase
    .from('bank_connections')
    .select('access_token, refresh_token, account_id, token_expires_at')
    .eq('user_id', profileId)
    .single();

  if (!bank) return { error: 'no_bank' as const };

  let accessToken: string = bank.access_token;
  const expiresAt = bank.token_expires_at ? new Date(bank.token_expires_at).getTime() : 0;

  if (expiresAt && Date.now() > expiresAt - 60_000) {
    if (!bank.refresh_token) return { error: 'token_expired' as const };
    const res = await fetch(`${AUTH_BASE}/connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token', client_id: process.env.TRUELAYER_CLIENT_ID!,
        client_secret: process.env.TRUELAYER_CLIENT_SECRET!, refresh_token: bank.refresh_token,
      }),
    });
    if (!res.ok) return { error: 'token_refresh_failed' as const };
    const tokens = await res.json();
    accessToken = tokens.access_token;
    await supabase.from('bank_connections').update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? bank.refresh_token,
      token_expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
    }).eq('user_id', profileId);
  }

  return { accessToken, accountId: bank.account_id };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') ?? new Date(new Date().getFullYear(), 3, 6).toISOString(); // 6 Apr current year
  const to   = searchParams.get('to')   ?? new Date().toISOString();

  const tokenResult = await getAccessToken(session.user.profileId);
  if ('error' in tokenResult) return NextResponse.json({ error: tokenResult.error }, { status: 404 });
  const { accessToken, accountId } = tokenResult;

  // Fetch transactions
  const txUrl = `${DATA_BASE}/accounts/${accountId}/transactions?from=${from}&to=${to}`;
  const txRes = await fetch(txUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!txRes.ok) return NextResponse.json({ error: 'fetch_failed' }, { status: 502 });
  const { results: rawTx = [] } = await txRes.json();

  // Fetch bank balance
  let bankBalance: number | null = null;
  try {
    const balRes = await fetch(`${DATA_BASE}/accounts/${accountId}/balance`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (balRes.ok) {
      const { results: balResults } = await balRes.json();
      bankBalance = balResults?.[0]?.current ?? null;
    }
  } catch { /* non-blocking */ }

  // Compute P&L
  type ExpenseEntry = { account: string; amount: number; count: number };
  const incomeLines: { description: string; amount: number }[] = [];
  const expenseMap = new Map<string, ExpenseEntry>();
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const tx of rawTx) {
    const amount: number = tx.amount ?? 0;
    const desc: string = tx.description ?? tx.merchant_name ?? 'Unknown';
    if (amount > 0) {
      incomeLines.push({ description: desc, amount });
      totalIncome += amount;
    } else if (amount < 0) {
      const account = classifyExpense(desc);
      const abs = Math.abs(amount);
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
    period: { from, to },
    pl: { totalIncome, totalExpenses, netProfit, corpTaxEstimate, incomeLines, expenseLines },
    balance: { bankBalance },
  });
}

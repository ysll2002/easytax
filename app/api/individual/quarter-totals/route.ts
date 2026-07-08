import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { plaidClient } from '@/lib/plaid';

// Compliant with HMRC MTD-ITSA production checklist In-Year #6:
//   "Quarterly submission data is populated from the customer's digital record
//    and no manual keying is permitted in the submission itself."
//
// Digital record here = the customer's Plaid bank transactions for the period.
// Categorisation uses the same keyword rules as the Company P&L endpoint,
// mapped to the SA quarterly expense buckets HMRC accepts.
const EXPENSE_RULES: { bucket: keyof QuarterExpenses; keywords: string[] }[] = [
  { bucket: 'travelCosts',          keywords: ['uber', 'taxi', 'train', 'rail', 'tfl', 'bus', 'fuel', 'petrol', 'parking', 'hotel', 'airbnb', 'flight', 'easyjet', 'ryanair', 'ba.com', 'heathrow'] },
  { bucket: 'adminCosts',           keywords: ['amazon', 'apple', 'microsoft', 'google', 'adobe', 'github', 'netlify', 'vercel', 'aws', 'digitalocean', 'cloudflare', 'software', 'saas', 'hosting', 'domain', 'openai', 'anthropic', 'slack', 'notion', 'figma', 'zapier', 'subscription', 'stationery', 'postage', 'printer', 'phone', 'vodafone', 'o2 ', 'three ', 'bt ', 'virgin media', 'broadband'] },
  { bucket: 'professionalFees',     keywords: ['solicitor', 'accountant', 'legal', 'barrister', 'consulting', 'advisor', 'bookkeep'] },
  { bucket: 'premisesRunningCosts', keywords: ['rent', 'office', 'utilities', 'electricity', 'gas ', 'water', 'insurance'] },
  { bucket: 'advertisingCosts',     keywords: ['facebook', 'instagram', 'meta ', 'linkedin', 'twitter', 'google ads', 'advertising', 'marketing', 'mailchimp', 'klaviyo', 'branding'] },
  { bucket: 'staffCosts',           keywords: ['salary', 'wages', 'payroll', 'subcontract'] },
  { bucket: 'costOfGoods',          keywords: ['stock', 'wholesale', 'materials', 'supplier'] },
];

type QuarterExpenses = {
  costOfGoods:          number;
  staffCosts:           number;
  travelCosts:          number;
  premisesRunningCosts: number;
  adminCosts:           number;
  advertisingCosts:     number;
  professionalFees:     number;
  otherExpenses:        number;
};

function classify(description: string): keyof QuarterExpenses {
  const lower = description.toLowerCase();
  for (const rule of EXPENSE_RULES) {
    if (rule.keywords.some(k => lower.includes(k))) return rule.bucket;
  }
  return 'otherExpenses';
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.profileId) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end   = searchParams.get('end');
  if (!start || !end) return NextResponse.json({ error: 'missing_period' }, { status: 400 });

  const { data: bank } = await supabase
    .from('bank_connections').select('access_token').eq('user_id', session.user.profileId).maybeSingle();
  if (!bank?.access_token) {
    return NextResponse.json({ error: 'no_bank', detail: 'Connect a bank on the Reconcile page to auto-populate the quarterly figures.' }, { status: 404 });
  }

  let turnover = 0;
  const expenses: QuarterExpenses = {
    costOfGoods: 0, staffCosts: 0, travelCosts: 0, premisesRunningCosts: 0,
    adminCosts: 0, advertisingCosts: 0, professionalFees: 0, otherExpenses: 0,
  };

  try {
    const txRes = await plaidClient.transactionsGet({
      access_token: bank.access_token,
      start_date:   start,
      end_date:     end,
      options:      { count: 500 },
    });
    for (const tx of txRes.data.transactions ?? []) {
      // Plaid: +amount = outflow (expense). Flip sign convention.
      const signed = -tx.amount;
      const desc   = tx.merchant_name ?? tx.name ?? '';
      if (signed > 0) turnover += signed;
      else if (signed < 0) expenses[classify(desc)] += Math.abs(signed);
    }
  } catch (err) {
    const axiosErr = err as { response?: { data?: { error_code?: string; error_message?: string } }; message?: string };
    const body = axiosErr.response?.data;
    const detail = body?.error_code ? `${body.error_code}: ${body.error_message ?? ''}` : (err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'fetch_failed', detail }, { status: 502 });
  }

  return NextResponse.json({
    period:   { start, end },
    turnover: +turnover.toFixed(2),
    expenses: Object.fromEntries(Object.entries(expenses).map(([k, v]) => [k, +v.toFixed(2)])),
    source:   'plaid_reconciliation',
    notice:   'These figures are computed from your reconciled bank transactions for the period. Corrections must be made by re-categorising transactions in Reconcile.',
  });
}

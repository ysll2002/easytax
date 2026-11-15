import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { AgentError } from '@/lib/agent';
import { recordsOwner, ownerFilter } from '@/lib/records-owner';
import { EXPENSE_BUCKETS, EXPENSE_BUCKET_KEYS, type ExpenseBucket } from '@/lib/records';

// POST /api/records/ai-classify?clientId=   { ids: string[] }
//
// Sorts the given unreviewed records with AI: business income, business
// expense (with its HMRC expense category) or personal. Records the model is
// not sure about stay unreviewed. Sorted records are flagged ai_categorised
// so the customer can see and check them; nothing is filed to HMRC from here.
// Only records still unreviewed are touched, so a change the customer made
// in the meantime is never overwritten.

export const maxDuration = 60;

const MAX_AI_BATCH = 100;
const MODELS = ['claude-haiku-5-5', 'claude-haiku-4-5-20251001'];

const anthropic = new Anthropic();

type Row = { id: string; txn_date: string; description: string; amount: number };
type Verdict = { n: number; category: 'business_income' | 'business_expense' | 'personal' | 'unsure'; bucket?: ExpenseBucket };

const tool: Anthropic.Tool = {
  name: 'record_classifications',
  description: 'Record the category of every transaction in the list.',
  input_schema: {
    type: 'object' as const,
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            n: { type: 'integer', description: 'The transaction number from the list' },
            category: { type: 'string', enum: ['business_income', 'business_expense', 'personal', 'unsure'] },
            bucket: { type: 'string', enum: EXPENSE_BUCKET_KEYS, description: 'Only for business_expense: the HMRC expense category' },
          },
          required: ['n', 'category'],
        },
      },
    },
    required: ['items'],
  },
};

const SYSTEM = `You sort a UK sole trader's bank statement lines for their Making Tax Digital Income Tax records.

For every numbered line, choose one category:
- business_income: money received for the person's work, goods or services (customer payments, invoices, platform payouts such as Stripe, PayPal, Etsy, Upwork, Deliveroo/Uber driver earnings).
- business_expense: a cost of running the business that is allowable for tax. Also choose the HMRC expense category (bucket):
${EXPENSE_BUCKETS.map(b => `  - ${b.key}: ${b.label}`).join('\n')}
- personal: anything that is not business income or an allowable business expense. This includes transfers between the person's own accounts, cash withdrawals, savings, salary from an employer (PAYE), benefits, refunds of personal purchases, loan or credit card repayments, tax payments to HMRC, and everyday personal spending such as groceries, restaurants, clothes, streaming, gyms and personal shopping.
- unsure: you cannot tell from the description and amount. Prefer unsure over a guess; the person will sort these themselves.

Positive amounts are money in, negative amounts are money out. Money in is rarely an expense; money out is never income.
Classify every line exactly once by calling record_classifications.`;

async function classify(rows: Row[]): Promise<Verdict[]> {
  const list = rows.map((r, i) => `${i + 1}. ${r.txn_date} | ${r.description.slice(0, 140)} | ${r.amount >= 0 ? '+' : '-'}£${Math.abs(r.amount).toFixed(2)}`).join('\n');
  let lastErr: unknown;
  for (const model of MODELS) {
    try {
      const res = await anthropic.messages.create({
        model,
        max_tokens: 8000,
        system: SYSTEM,
        tools: [tool],
        tool_choice: { type: 'tool', name: tool.name },
        messages: [{ role: 'user', content: `Transactions:\n${list}` }],
      });
      const use = res.content.find(b => b.type === 'tool_use');
      const items = (use && use.type === 'tool_use' ? (use.input as { items?: Verdict[] }).items : null) ?? [];
      return items;
    } catch (err) {
      lastErr = err;
      // Try the next model only if this one is not available to the key.
      if (!(err instanceof Anthropic.NotFoundError)) throw err;
    }
  }
  throw lastErr;
}

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  const session = await auth();
  const uid = session?.user?.profileId;
  if (!uid) return bad('unauthorised', 401);
  let clientId: string | null;
  try {
    clientId = await recordsOwner(uid, req.nextUrl.searchParams.get('clientId'));
  } catch (err) {
    if (err instanceof AgentError) return bad(err.code, err.status);
    throw err;
  }

  const body = await req.json().catch(() => null) as { ids?: unknown } | null;
  const ids = body?.ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_AI_BATCH
    || !ids.every(i => typeof i === 'string' && /^[0-9a-f-]{36}$/i.test(i))) return bad('invalid_ids');

  const { data, error } = await ownerFilter(
    supabase.from('business_records').select('id, txn_date, description, amount').eq('user_id', uid), clientId,
  ).eq('category', 'unreviewed').in('id', ids);
  if (error) return bad('db_error', 500);
  const rows = (data ?? []) as Row[];
  if (rows.length === 0) return NextResponse.json({ sorted: 0, unsure: 0 });

  let verdicts: Verdict[];
  try {
    verdicts = await classify(rows);
  } catch (err) {
    console.error('[records/ai-classify] model call failed', { message: (err as Error).message });
    return bad('ai_unavailable', 502);
  }

  // Group by what is being set so each group is one update.
  const groups = new Map<string, string[]>();
  const seen = new Set<number>();
  for (const v of verdicts) {
    const row = rows[v.n - 1];
    if (!row || seen.has(v.n)) continue;
    seen.add(v.n);
    let cat = v.category;
    // Guard against sign mistakes: money in is not an expense, money out is not income.
    if ((cat === 'business_expense' && row.amount > 0) || (cat === 'business_income' && row.amount < 0)) cat = 'unsure';
    if (cat === 'unsure') continue;
    const bucket = cat === 'business_expense' && v.bucket && EXPENSE_BUCKET_KEYS.includes(v.bucket) ? v.bucket : cat === 'business_expense' ? 'otherExpenses' : null;
    const key = `${cat}|${bucket ?? ''}`;
    groups.set(key, [...(groups.get(key) ?? []), row.id]);
  }

  let sorted = 0;
  const now = new Date().toISOString();
  for (const [key, groupIds] of groups) {
    const [category, bucket] = key.split('|');
    const { error: upErr } = await ownerFilter(
      supabase.from('business_records')
        .update({ category, expense_bucket: bucket || null, ai_categorised: true, updated_at: now })
        .eq('user_id', uid),
      clientId,
    ).eq('category', 'unreviewed').in('id', groupIds);
    if (upErr) return bad('db_error', 500);
    sorted += groupIds.length;
  }
  return NextResponse.json({ sorted, unsure: rows.length - sorted });
}

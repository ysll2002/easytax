import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import {
  RECORD_CATEGORIES, EXPENSE_BUCKET_KEYS, ISO_DATE,
  type RecordCategory, type ExpenseBucket,
} from '@/lib/records';

// The customer's business records (see lib/records.ts).
//   GET    ?start=YYYY-MM-DD&end=YYYY-MM-DD   list records in a period
//   POST   { records: [...], source }         add records (manual or CSV import)
//   PATCH  { ids, category?, expenseBucket? } re-categorise
//   DELETE { ids }                            delete

const MAX_BATCH = 2000;
// ids go into the PostgREST query string, so keep each call well under URL limits.
const MAX_IDS = 200;
const COLUMNS = 'id, txn_date, description, amount, category, expense_bucket, source';

async function userId() {
  const session = await auth();
  return session?.user?.profileId ?? null;
}

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

function validIds(ids: unknown): ids is string[] {
  return Array.isArray(ids) && ids.length > 0 && ids.length <= MAX_IDS
    && ids.every(i => typeof i === 'string' && /^[0-9a-f-]{36}$/i.test(i));
}

export async function GET(req: NextRequest) {
  const uid = await userId();
  if (!uid) return bad('unauthorised', 401);
  const sp = req.nextUrl.searchParams;
  const start = sp.get('start');
  const end = sp.get('end');
  if ((start && !ISO_DATE.test(start)) || (end && !ISO_DATE.test(end))) return bad('invalid_period');

  let q = supabase.from('business_records').select(COLUMNS).eq('user_id', uid);
  if (start) q = q.gte('txn_date', start);
  if (end) q = q.lte('txn_date', end);
  const { data, error } = await q.order('txn_date', { ascending: false }).order('created_at', { ascending: false }).limit(5000);
  if (error) return bad('db_error', 500);
  return NextResponse.json({ records: (data ?? []).map(r => ({ ...r, amount: Number(r.amount) })) });
}

type Incoming = { date?: unknown; description?: unknown; amount?: unknown; category?: unknown; expenseBucket?: unknown };

export async function POST(req: NextRequest) {
  const uid = await userId();
  if (!uid) return bad('unauthorised', 401);
  const body = await req.json().catch(() => null) as { records?: Incoming[]; source?: unknown } | null;
  const source = body?.source === 'csv' ? 'csv' : 'manual';
  const input = body?.records;
  if (!Array.isArray(input) || input.length === 0) return bad('no_records');
  if (input.length > MAX_BATCH) return bad('too_many_records');

  const seen = new Map<string, number>();
  const rows = [];
  for (const r of input) {
    const date = typeof r.date === 'string' && ISO_DATE.test(r.date) ? r.date : null;
    const description = typeof r.description === 'string' ? r.description.trim().slice(0, 200) : '';
    const amount = typeof r.amount === 'number' && Number.isFinite(r.amount) ? Math.round(r.amount * 100) / 100 : null;
    if (!date || !description || amount == null || amount === 0 || Math.abs(amount) >= 1e12) return bad('invalid_record');
    const category: RecordCategory = RECORD_CATEGORIES.includes(r.category as RecordCategory) ? r.category as RecordCategory : 'unreviewed';
    const expense_bucket = EXPENSE_BUCKET_KEYS.includes(r.expenseBucket as ExpenseBucket) ? r.expenseBucket as ExpenseBucket : null;

    let import_hash: string | null = null;
    if (source === 'csv') {
      // Two identical lines on one statement (two £3.20 coffees on the same
      // day) are both real, so the occurrence number is part of the key.
      // Importing the same statement again then adds nothing.
      const key = `${date}|${amount.toFixed(2)}|${description.toLowerCase()}`;
      const n = (seen.get(key) ?? 0) + 1;
      seen.set(key, n);
      import_hash = createHash('sha256').update(`${key}|${n}`).digest('hex');
    }
    rows.push({ user_id: uid, txn_date: date, description, amount, category, expense_bucket, source, import_hash });
  }

  let toInsert = rows;
  if (source === 'csv') {
    const hashes = rows.map(r => r.import_hash as string);
    const existing = new Set<string>();
    for (let i = 0; i < hashes.length; i += 500) {
      const { data, error } = await supabase.from('business_records')
        .select('import_hash').eq('user_id', uid).in('import_hash', hashes.slice(i, i + 500));
      if (error) return bad('db_error', 500);
      for (const d of data ?? []) existing.add(d.import_hash as string);
    }
    toInsert = rows.filter(r => !existing.has(r.import_hash as string));
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from('business_records').insert(toInsert);
    if (error) {
      console.error('[records] insert failed', { code: error.code, message: error.message });
      return bad('db_error', 500);
    }
  }
  return NextResponse.json({ added: toInsert.length, duplicates: rows.length - toInsert.length });
}

export async function PATCH(req: NextRequest) {
  const uid = await userId();
  if (!uid) return bad('unauthorised', 401);
  const body = await req.json().catch(() => null) as { ids?: unknown; category?: unknown; expenseBucket?: unknown } | null;
  if (!validIds(body?.ids)) return bad('invalid_ids');

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.category !== undefined) {
    if (!RECORD_CATEGORIES.includes(body.category as RecordCategory)) return bad('invalid_category');
    update.category = body.category;
  }
  if (body.expenseBucket !== undefined) {
    if (body.expenseBucket !== null && !EXPENSE_BUCKET_KEYS.includes(body.expenseBucket as ExpenseBucket)) return bad('invalid_bucket');
    update.expense_bucket = body.expenseBucket;
  }
  if (Object.keys(update).length === 1) return bad('nothing_to_update');

  const { error } = await supabase.from('business_records').update(update).eq('user_id', uid).in('id', body.ids);
  if (error) return bad('db_error', 500);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const uid = await userId();
  if (!uid) return bad('unauthorised', 401);
  const body = await req.json().catch(() => null) as { ids?: unknown } | null;
  if (!validIds(body?.ids)) return bad('invalid_ids');
  const { error } = await supabase.from('business_records').delete().eq('user_id', uid).in('id', body.ids);
  if (error) return bad('db_error', 500);
  return NextResponse.json({ ok: true });
}

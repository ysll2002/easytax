import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { AgentError } from '@/lib/agent';
import { recordsOwner, ownerFilter } from '@/lib/records-owner';
import { filedPeriods, inFiledPeriod } from '@/lib/records-lock';
import {
  RECORD_CATEGORIES, EXPENSE_BUCKET_KEYS, ISO_DATE, INCOME_SOURCE_KEYS, PROPERTY_BUCKET_KEYS,
  type RecordCategory, type ExpenseBucket, type IncomeSource, type PropertyBucket,
} from '@/lib/records';

// The customer's business records (see lib/records.ts).
//   GET    ?start=YYYY-MM-DD&end=YYYY-MM-DD   list records in a period
//   POST   { records: [...], source }         add records (manual or CSV import)
//   PATCH  { ids, category?, expenseBucket?, incomeSource?, propertyBucket?, propertyId? }  re-categorise
//   DELETE { ids }                            delete
// Records dated in a quarter already filed with HMRC are locked (see
// lib/records-lock.ts): they come back with locked: true, cannot be changed
// or deleted, and new records cannot be dated in that quarter.
// Every method takes ?clientId= to work on an agent client's records instead
// of the user's own.

const MAX_BATCH = 2000;
// ids go into the PostgREST query string, so keep each call well under URL limits.
const MAX_IDS = 200;
const COLUMNS = 'id, txn_date, description, amount, category, expense_bucket, income_source, property_bucket, property_id, source, ai_categorised';
// Foreign property: HMRC's propertyId (2026-27 on) or the country code (ISO
// 3166 alpha-3) for earlier years.
const PROPERTY_ID = /^([0-9a-f-]{36}|[A-Z]{3})$/i;

async function userId() {
  const session = await auth();
  return session?.user?.profileId ?? null;
}

// The signed-in user and whose records they are working on, or an error
// response.
async function owner(req: NextRequest): Promise<{ uid: string; clientId: string | null } | NextResponse> {
  const uid = await userId();
  if (!uid) return bad('unauthorised', 401);
  try {
    return { uid, clientId: await recordsOwner(uid, req.nextUrl.searchParams.get('clientId')) };
  } catch (err) {
    if (err instanceof AgentError) return bad(err.code, err.status);
    throw err;
  }
}

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

function validIds(ids: unknown): ids is string[] {
  return Array.isArray(ids) && ids.length > 0 && ids.length <= MAX_IDS
    && ids.every(i => typeof i === 'string' && /^[0-9a-f-]{36}$/i.test(i));
}

export async function GET(req: NextRequest) {
  const o = await owner(req);
  if (o instanceof NextResponse) return o;
  const { uid, clientId } = o;
  const sp = req.nextUrl.searchParams;
  const start = sp.get('start');
  const end = sp.get('end');
  if ((start && !ISO_DATE.test(start)) || (end && !ISO_DATE.test(end))) return bad('invalid_period');

  let q = ownerFilter(supabase.from('business_records').select(COLUMNS).eq('user_id', uid), clientId);
  if (start) q = q.gte('txn_date', start);
  if (end) q = q.lte('txn_date', end);
  const [{ data, error }, periods] = await Promise.all([
    q.order('txn_date', { ascending: false }).order('created_at', { ascending: false }).limit(5000),
    filedPeriods(uid, clientId),
  ]);
  if (error) return bad('db_error', 500);
  return NextResponse.json({
    records: (data ?? []).map(r => ({ ...r, amount: Number(r.amount), locked: inFiledPeriod(String(r.txn_date), periods, r.income_source) })),
  });
}

type Incoming = { date?: unknown; description?: unknown; amount?: unknown; category?: unknown; expenseBucket?: unknown; incomeSource?: unknown; propertyBucket?: unknown; propertyId?: unknown };

export async function POST(req: NextRequest) {
  const o = await owner(req);
  if (o instanceof NextResponse) return o;
  const { uid, clientId } = o;
  const body = await req.json().catch(() => null) as { records?: Incoming[]; source?: unknown; incomeSource?: unknown } | null;
  const source = body?.source === 'csv' ? 'csv' : 'manual';
  // A CSV statement can be imported straight into one income source.
  const batchSource = INCOME_SOURCE_KEYS.includes(body?.incomeSource as IncomeSource) ? body?.incomeSource as IncomeSource : 'self-employment';
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
    const income_source: IncomeSource = INCOME_SOURCE_KEYS.includes(r.incomeSource as IncomeSource) ? r.incomeSource as IncomeSource : batchSource;
    const property_bucket = income_source !== 'self-employment' && PROPERTY_BUCKET_KEYS.includes(r.propertyBucket as PropertyBucket) ? r.propertyBucket as PropertyBucket : null;
    const property_id = income_source === 'foreign-property' && typeof r.propertyId === 'string' && PROPERTY_ID.test(r.propertyId) ? r.propertyId : null;

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
    rows.push({ user_id: uid, client_id: clientId, txn_date: date, description, amount, category, expense_bucket, income_source, property_bucket, property_id, source, import_hash });
  }

  // Nothing new can be dated in a quarter already filed with HMRC. A line
  // typed by hand is refused with a reason; statement lines for a filed
  // quarter are skipped and counted.
  const periods = await filedPeriods(uid, clientId);
  const inFiled = rows.filter(r => inFiledPeriod(r.txn_date, periods, r.income_source));
  if (source === 'manual' && inFiled.length > 0) return bad('period_filed', 409);
  const open = rows.filter(r => !inFiledPeriod(r.txn_date, periods, r.income_source));

  let toInsert = open;
  if (source === 'csv' && open.length > 0) {
    // Fetch the fingerprints already stored for this owner over the
    // statement's date range in one query. (Sending every fingerprint in the
    // filter made the request URL too long for statements of a few hundred
    // lines, and the import failed with a 500.)
    const dates = open.map(r => r.txn_date).sort();
    const existing = new Set<string>();
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await ownerFilter(supabase.from('business_records')
        .select('import_hash').eq('user_id', uid), clientId)
        .not('import_hash', 'is', null)
        .gte('txn_date', dates[0]).lte('txn_date', dates[dates.length - 1])
        .order('id')
        .range(from, from + PAGE - 1);
      if (error) {
        console.error('[records] duplicate check failed', { code: error.code, message: error.message });
        return bad('db_error', 500);
      }
      for (const d of data ?? []) existing.add(d.import_hash as string);
      if (!data || data.length < PAGE) break;
    }
    toInsert = open.filter(r => !existing.has(r.import_hash as string));
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from('business_records').insert(toInsert);
    if (error) {
      console.error('[records] insert failed', { code: error.code, message: error.message });
      return bad('db_error', 500);
    }
  }
  return NextResponse.json({ added: toInsert.length, duplicates: open.length - toInsert.length, filed: inFiled.length });
}

// Refuses a change to any record dated in a quarter already filed with HMRC.
// Moving a record to another income source counts as a change to both: it
// must not leave a filed quarter, nor enter one.
async function lockedAmong(uid: string, clientId: string | null, ids: string[], newSource?: string): Promise<boolean | null> {
  const [{ data, error }, periods] = await Promise.all([
    ownerFilter(supabase.from('business_records').select('txn_date, income_source').eq('user_id', uid), clientId).in('id', ids),
    filedPeriods(uid, clientId),
  ]);
  if (error) return null;
  return (data ?? []).some(r => inFiledPeriod(String(r.txn_date), periods, r.income_source)
    || (newSource !== undefined && inFiledPeriod(String(r.txn_date), periods, newSource)));
}

export async function PATCH(req: NextRequest) {
  const o = await owner(req);
  if (o instanceof NextResponse) return o;
  const { uid, clientId } = o;
  const body = await req.json().catch(() => null) as {
    ids?: unknown; category?: unknown; expenseBucket?: unknown; incomeSource?: unknown; propertyBucket?: unknown; propertyId?: unknown;
  } | null;
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
  if (body.incomeSource !== undefined) {
    if (!INCOME_SOURCE_KEYS.includes(body.incomeSource as IncomeSource)) return bad('invalid_income_source');
    update.income_source = body.incomeSource;
    if (body.incomeSource === 'self-employment') { update.property_bucket = null; update.property_id = null; }
    if (body.incomeSource === 'uk-property') update.property_id = null;
  }
  if (body.propertyBucket !== undefined) {
    if (body.propertyBucket !== null && !PROPERTY_BUCKET_KEYS.includes(body.propertyBucket as PropertyBucket)) return bad('invalid_bucket');
    update.property_bucket = body.propertyBucket;
  }
  if (body.propertyId !== undefined) {
    if (body.propertyId !== null && !(typeof body.propertyId === 'string' && PROPERTY_ID.test(body.propertyId))) return bad('invalid_property_id');
    update.property_id = body.propertyId;
  }
  if (Object.keys(update).length === 1) return bad('nothing_to_update');
  // The customer has now decided this record themselves.
  update.ai_categorised = false;

  const locked = await lockedAmong(uid, clientId, body.ids, typeof update.income_source === 'string' ? update.income_source : undefined);
  if (locked === null) return bad('db_error', 500);
  if (locked) return bad('records_locked', 409);

  const { error } = await ownerFilter(supabase.from('business_records').update(update).eq('user_id', uid), clientId).in('id', body.ids);
  if (error) return bad('db_error', 500);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const o = await owner(req);
  if (o instanceof NextResponse) return o;
  const { uid, clientId } = o;
  const body = await req.json().catch(() => null) as { ids?: unknown } | null;
  if (!validIds(body?.ids)) return bad('invalid_ids');
  const locked = await lockedAmong(uid, clientId, body.ids);
  if (locked === null) return bad('db_error', 500);
  if (locked) return bad('records_locked', 409);
  const { error } = await ownerFilter(supabase.from('business_records').delete().eq('user_id', uid), clientId).in('id', body.ids);
  if (error) return bad('db_error', 500);
  return NextResponse.json({ ok: true });
}

import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { summarise, EXPENSE_BUCKET_KEYS, ISO_DATE } from '@/lib/records';
import { ownerFilter } from '@/lib/records-owner';
import { CUMULATIVE_FROM_TAX_YEAR } from '@/lib/hmrc-cumulative';

// HMRC MTD-ITSA In-Year #6: what is submitted must come from the customer's
// digital record. Before a quarterly update is sent, the figures are checked
// against what the records for the period add up to. Changes the customer
// makes on the submission page are saved to the records as adjustments first,
// so a genuine submission always matches.
export async function figuresMatchRecords(
  userId: string,
  clientId: string | null,
  body: { periodStartDate?: string; periodEndDate?: string; turnover?: number; expenses?: Record<string, number | undefined> },
): Promise<{ ok: true; recordIds: string[] } | { ok: false; reason: string }> {
  const start = body.periodStartDate, end = body.periodEndDate;
  if (!start || !end || !ISO_DATE.test(start) || !ISO_DATE.test(end)) return { ok: false, reason: 'Missing period dates.' };

  const { data, error } = await ownerFilter(
    supabase.from('business_records').select('id, description, amount, category, expense_bucket, income_source').eq('user_id', userId),
    clientId,
  ).gte('txn_date', start).lte('txn_date', end);
  if (error) return { ok: false, reason: 'Could not read your records.' };

  const totals = summarise(data ?? []);
  const close = (a: number, b: number) => Math.abs(a - b) < 0.005;
  if (!close(Number(body.turnover ?? 0), totals.turnover)) {
    return { ok: false, reason: 'The turnover does not match your records for this period.' };
  }
  for (const k of EXPENSE_BUCKET_KEYS) {
    if (!close(Number(body.expenses?.[k] ?? 0), totals.expenses[k])) {
      return { ok: false, reason: 'The expenses do not match your records for this period.' };
    }
  }
  // The records this update is built from, kept with the filing.
  return { ok: true, recordIds: (data ?? []).filter(r => (r.income_source ?? 'self-employment') === 'self-employment').map(r => r.id as string) };
}

/** "2026-07-05" → "2026-27": the tax year a date falls in (6 April to 5 April). */
export function taxYearOfDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const start = m > 4 || (m === 4 && d >= 6) ? y : y - 1;
  return `${start}-${String(start + 1).slice(2)}`;
}

/**
 * What a quarterly update sends to HMRC, built from the records.
 *
 * Up to 2024-25 that is the quarter's own figures. From 2025-26 HMRC takes a
 * cumulative summary, so it is the self-employment records from 6 April to
 * the end of the quarter, added up. Earlier quarters are locked once filed
 * (records-lock.ts) and corrections are dated in the current quarter, so the
 * year-to-date totals are what was filed before plus this quarter.
 */
export async function quarterlyFigures(
  userId: string,
  clientId: string | null,
  periodStartDate: string,
  periodEndDate: string,
): Promise<{ ok: true; taxYear: string; cumulative: boolean; send: { periodStartDate: string; periodEndDate: string; turnover: number; expenses: Record<string, number> } } | { ok: false; reason: string }> {
  if (!ISO_DATE.test(periodStartDate) || !ISO_DATE.test(periodEndDate)) return { ok: false, reason: 'Missing period dates.' };
  const taxYear = taxYearOfDate(periodEndDate);
  const cumulative = taxYear >= CUMULATIVE_FROM_TAX_YEAR;
  const from = cumulative ? `${taxYear.slice(0, 4)}-04-06` : periodStartDate;

  const { data, error } = await ownerFilter(
    supabase.from('business_records').select('description, amount, category, expense_bucket, income_source').eq('user_id', userId),
    clientId,
  ).gte('txn_date', from).lte('txn_date', periodEndDate);
  if (error) return { ok: false, reason: 'Could not read your records.' };

  const totals = summarise(data ?? []);
  return {
    ok: true, taxYear, cumulative,
    send: { periodStartDate: from, periodEndDate, turnover: totals.turnover, expenses: totals.expenses },
  };
}

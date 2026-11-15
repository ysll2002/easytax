import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { summarise, EXPENSE_BUCKET_KEYS, ISO_DATE } from '@/lib/records';
import { ownerFilter } from '@/lib/records-owner';

// HMRC MTD-ITSA In-Year #6: what is submitted must come from the customer's
// digital record. Before a quarterly update is sent, the figures are checked
// against what the records for the period add up to. Changes the customer
// makes on the submission page are saved to the records as adjustments first,
// so a genuine submission always matches.
export async function figuresMatchRecords(
  userId: string,
  clientId: string | null,
  body: { periodStartDate?: string; periodEndDate?: string; turnover?: number; expenses?: Record<string, number | undefined> },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const start = body.periodStartDate, end = body.periodEndDate;
  if (!start || !end || !ISO_DATE.test(start) || !ISO_DATE.test(end)) return { ok: false, reason: 'Missing period dates.' };

  const { data, error } = await ownerFilter(
    supabase.from('business_records').select('description, amount, category, expense_bucket').eq('user_id', userId),
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
  return { ok: true };
}

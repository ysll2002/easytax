import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// Quarters already filed with HMRC, for one records owner (the user, or one
// of their agent clients). Records dated inside one are locked: the filing's
// digital link to them must not break. The database enforces the same rule
// (migration 20261121_lock_filed_records); checking here first lets the API
// explain it instead of failing.
export type FiledPeriod = { start: string; end: string };

export async function filedPeriods(userId: string, clientId: string | null): Promise<FiledPeriod[]> {
  let q = supabase.from('sa_filings').select('period_start, period_end')
    .eq('user_id', userId).eq('filing_type', 'quarterly');
  q = clientId ? q.eq('client_id', clientId) : q.is('client_id', null);
  const { data, error } = await q;
  if (error) throw new Error('Could not read your filings.');
  return (data ?? [])
    .filter(f => f.period_start && f.period_end)
    .map(f => ({ start: String(f.period_start), end: String(f.period_end) }));
}

export function inFiledPeriod(date: string, periods: FiledPeriod[]): boolean {
  return periods.some(p => date >= p.start && date <= p.end);
}

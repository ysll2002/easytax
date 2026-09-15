// What the article pipeline did this morning, written where the next run reads it.
//
// The gap this closes. `/api/cron/daily-article` already reports itself in
// detail — which assignment it took, whether the quality gate passed, why a
// headline was refused, how coverage stands — and every word of it goes into
// the HTTP response to Vercel's cron runner, which nobody has ever read. The
// only durable trace a run leaves is a row in `tax_articles`, and that exists
// solely when the run *succeeded*.
//
// So the days that matter leave nothing at all. Between 2026-09-07 and
// 2026-09-15 the archive gained no public page. Reconstructing why, on
// 2026-09-15, took reading the drafts table, noticing that 09-09, 09-10, 09-12
// and 09-14 produced nothing, and then deriving from the code what those runs
// must have done. A run that writes nothing is precisely the run whose reasons
// need keeping.
//
// Stored on the day's `growth_snapshots` row rather than in a table of its own
// because that row already exists, is already what the daily review reads, and
// needs no migration to carry one more key — and a fix that waits on a
// migration being applied is a fix that waits.

import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

export type ArticleRunRecord = {
  ran_at: string;
  /** What the run set out to do: 'new', 'upgrade', or 'none' when it had no
   *  assignment at all. */
  mode: string;
  /** Rows that actually reached the database. The number that matters. */
  written: number;
  /** One line per assignment saying what became of it — written, refused as a
   *  duplicate, refused as off-target, failed to insert. */
  outcomes: string[];
  /** Target-query coverage as it stood at the start of the run. */
  coverage: { covered: number; total: number; next_up: string[] };
  /** Set when the handler threw. The case with no other trace. */
  error?: string;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function payloadFor(takenOn: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from('growth_snapshots')
    .select('payload')
    .eq('taken_on', takenOn)
    .maybeSingle();
  if (error || !data) return null;
  return (data.payload ?? null) as Record<string, unknown> | null;
}

/**
 * Records the run on today's snapshot row.
 *
 * Never throws. This is bookkeeping about a cron; it must not be the reason a
 * cron fails, and a lost record is a smaller loss than a lost run.
 */
export async function recordArticleRun(record: ArticleRunRecord): Promise<boolean> {
  try {
    const takenOn = today();
    const existing = await payloadFor(takenOn);
    const { error } = await supabase
      .from('growth_snapshots')
      .upsert(
        { taken_on: takenOn, label: 'daily', payload: { ...(existing ?? {}), editorial_run: record } },
        { onConflict: 'taken_on' },
      );
    if (error) {
      console.warn('[editorial-run] could not record the run:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[editorial-run] could not record the run', err);
    return false;
  }
}

/**
 * The run record already on a day's row, if there is one.
 *
 * `/api/cron/daily` calls this before it upserts the day's metrics. The
 * article cron runs at 08:00 and this one at 08:30 against the same row, so
 * without the read-then-merge the later write would silently erase the
 * earlier — which would have made this whole module a slower way of storing
 * nothing.
 */
export async function existingArticleRun(takenOn = today()): Promise<ArticleRunRecord | null> {
  const payload = await payloadFor(takenOn);
  return (payload?.editorial_run as ArticleRunRecord | undefined) ?? null;
}

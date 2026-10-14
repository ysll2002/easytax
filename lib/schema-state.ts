// Which migrations have actually been run against the database the site is
// talking to.
//
// Why this exists. On 2026-09-16 a round shipped F47 — articles that state the
// search they were commissioned to answer — together with
// `supabase/migrations/20260916_article_target_query.sql`, and the deploy note
// said, in bold, that the migration needed running. It was not run. The code
// went live, `insertDraft` hit the missing column, retried without it exactly
// as designed, logged a warning nobody reads, and the feature did nothing at
// all for a day. It was found the following morning by accident, because a
// query asking for `target_query` came back `42703`.
//
// Nothing was broken by that, which is the point: every reader of this schema
// is deliberately fail-soft, so a missing column degrades silently by
// construction. Silent degradation with no counter is how a shipped feature
// stays inert. This is the sixth time in eleven rounds that a control existed
// and the number that would have shown it misfiring did not exist — the review
// gate with no `days_since_last_publish`, the deploy that could not say what
// was live, the SEO audit with no caller, the crawl pointed at a login page,
// the agent breakdown that called every client `Mozilla`, and now a migration
// that shipped and never ran.
//
// So: probe the sentinel each migration adds, and report it. This reads and
// never writes — it cannot apply a migration, and should not. Applying DDL is
// the one operation in this project where an agent guessing wrong is not
// cheaply reversible, and PostgREST offers no path to it anyway.

import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { hasSupabaseEnv } from '@/app/tax-tips/_lib/articles';

/** Postgres `undefined_column` / `undefined_table`, and the shapes PostgREST
 *  reports them as when its schema cache rejects the request first. Same set
 *  the review gate and the queue reconcile match on. */
const MISSING = new Set(['42703', '42P01', 'PGRST204', 'PGRST205', 'PGRST100']);

/**
 * One probe per migration file: the thing that exists only once it has run.
 *
 * A sentinel is deliberately a single column (or the table itself), not every
 * object the migration creates. A migration is applied as one transaction, so
 * one object is sufficient evidence for all of them, and a probe per column
 * would mean a dozen round trips on every metrics request to learn one bit.
 *
 * Keeping this list current is a manual step, and the honest cost of the
 * approach: a new migration needs a line here or it is invisible to the very
 * report that exists to make it visible. That is a smaller and much louder
 * failure than the one it replaces — a missing entry shows up as a migration
 * file on disk with no row in the report, which is exactly what somebody
 * reading this block is looking at.
 */
const SENTINELS: readonly { migration: string; table: string; column: string }[] = [
  { migration: '20260903_growth_instrumentation', table: 'analytics_events',  column: 'id' },
  { migration: '20260904_email_compliance',       table: 'email_sends',       column: 'id' },
  { migration: '20260906_editorial_and_scorecard', table: 'tax_articles',     column: 'review_status' },
  { migration: '20260909_article_upgrades',       table: 'tax_articles',      column: 'pending_title' },
  { migration: '20260916_article_target_query',   table: 'tax_articles',      column: 'target_query' },
];

export type MigrationState = {
  migration: string;
  applied: boolean;
  /** What the probe asked for, so a reader can repeat it by hand. */
  probe: string;
  /** Set when the probe failed for a reason that is not a missing object —
   *  a network error or a permissions problem. `applied` is then not a claim
   *  about the schema, and is reported as such rather than as `false`. */
  inconclusive?: string;
};

export type SchemaState = {
  note: string;
  /** Migration files that have not run. Empty is the healthy state. */
  pending: string[];
  migrations: MigrationState[];
};

/**
 * Probes every migration's sentinel.
 *
 * Deliberately a normal `select … limit(1)` and **not** `head: true`, which is
 * the obvious way to write this and is wrong. A HEAD request has no response
 * body by definition, so when PostgREST rejects the column it puts
 * `error=42703` in a `proxy-status` header and returns nothing for the client
 * to parse; supabase-js then hands back an error with an empty message and no
 * `code` at all. The first version of this function used `head: true` and
 * reported the one genuinely missing migration as `inconclusive: ""` — a probe
 * built to make a silent failure visible, failing silently. Asking for one row
 * costs a few bytes and gets the error code.
 */
export async function schemaState(): Promise<SchemaState> {
  const note =
    'Probes the one object each migration in supabase/migrations/ adds. ' +
    'A pending migration means the code that needs it is deployed and silently ' +
    'degrading — every reader of this schema falls back rather than failing, so ' +
    'nothing here will show up as an error anywhere else.';

  if (!hasSupabaseEnv()) {
    return {
      note,
      pending: [],
      migrations: SENTINELS.map(s => ({
        migration: s.migration,
        applied: false,
        probe: `${s.table}.${s.column}`,
        inconclusive: 'No Supabase credentials in this environment.',
      })),
    };
  }

  const migrations = await Promise.all(
    SENTINELS.map(async (s): Promise<MigrationState> => {
      const probe = `${s.table}.${s.column}`;
      try {
        const { error } = await supabase.from(s.table).select(s.column).limit(1);

        if (!error) return { migration: s.migration, applied: true, probe };
        if (MISSING.has(error.code ?? '')) {
          return { migration: s.migration, applied: false, probe };
        }
        return {
          migration: s.migration,
          applied: false,
          probe,
          // Never an empty string: `inconclusive` is read as a reason, and a
          // blank reason reads as "no reason given" while still suppressing
          // this row from `pending`. An error we cannot describe is still an
          // error we must name.
          inconclusive: error.message || `Unrecognised error (code ${error.code ?? 'none'}).`,
        };
      } catch (e) {
        return {
          migration: s.migration,
          applied: false,
          probe,
          inconclusive: e instanceof Error ? e.message : String(e),
        };
      }
    }),
  );

  return {
    note,
    // An inconclusive probe is not reported as pending: telling somebody to run
    // a migration that may already be applied, because the network blipped, is
    // how a report stops being believed.
    pending: migrations.filter(m => !m.applied && !m.inconclusive).map(m => m.migration),
    migrations,
  };
}

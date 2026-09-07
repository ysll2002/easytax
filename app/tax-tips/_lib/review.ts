// The review gate for the Tax Tips archive.
//
// Every article in `tax_articles` was written by a model and published by a
// cron with nothing in between. For 140 pages of UK tax guidance that is both
// an editorial problem and, almost certainly, a ranking one. The gate is the
// fix: new articles land as 'draft' and are invisible to readers, to the
// sitemap and to the topic hubs until a person marks them published.
//
// Everything here is fail-soft in one specific direction. If
// `tax_articles.review_status` does not exist yet — the code deployed before
// supabase/migrations/20260906_editorial_and_scorecard.sql was run — the
// filtered query fails, and we re-run it unfiltered rather than serving an
// empty archive. Losing the gate for a few minutes is recoverable; silently
// unpublishing 140 indexed pages is not.

/** Postgres `undefined_column`, and the two shapes PostgREST reports it as
 *  when the schema cache or the query parser rejects the filter first. */
const MISSING_COLUMN = new Set(['42703', 'PGRST204', 'PGRST100']);

type SupabaseResult = { error: { code?: string | null } | null };

/** Cached across requests within a warm lambda: `null` until we have tried
 *  once, then `true`/`false`. Only ever set from an observed query result, so
 *  a deploy that lands before the migration heals itself on the first request
 *  after the migration is run — the flag never latches to `false` for the
 *  life of the process once the column appears. */
let gateAvailable: boolean | null = null;

/**
 * Runs a Supabase query with the published-only filter applied, falling back to
 * the unfiltered query if the column is not there yet.
 *
 * The caller supplies a factory rather than a query, because a Supabase query
 * builder cannot be re-executed once awaited — the fallback needs to build a
 * fresh one.
 *
 * @param run Builds and executes the query. `gated` is true when the caller
 *            should apply `.eq('review_status', 'published')`.
 */
export async function selectPublished<R extends SupabaseResult>(
  run: (gated: boolean) => PromiseLike<R>,
): Promise<R> {
  if (gateAvailable === false) return run(false);

  const result = await run(true);

  if (result.error && MISSING_COLUMN.has(result.error.code ?? '')) {
    gateAvailable = false;
    console.warn(
      '[tax-tips] tax_articles.review_status is missing — run ' +
        'supabase/migrations/20260906_editorial_and_scorecard.sql. ' +
        'Serving the archive unfiltered until it exists.',
    );
    return run(false);
  }

  if (!result.error) gateAvailable = true;
  return result;
}

/** Test seam: forget what we learned about the column. */
export function resetReviewGateCache(): void {
  gateAvailable = null;
}

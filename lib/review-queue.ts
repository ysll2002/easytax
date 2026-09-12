// The state of the editorial pipeline, in one query.
//
// Why this is its own module. On 2026-09-06 the review gate was added: the
// daily cron stopped publishing straight to the site and started writing
// `review_status: 'draft'` instead, to be released by a person. That was the
// right call for 113 pages of model-drafted tax guidance.
//
// What nobody built was the other half. The release action exists only as a
// POST to /api/admin/article-review, which means it exists only as a curl
// command with a secret in it, and nothing anywhere reported that the queue
// was filling up. So it filled up: the last article to reach the public
// archive was published on 2026-09-07, the cron has been writing drafts since,
// and by 2026-09-12 the only part of the site that earns organic traffic had
// been frozen for five days without a single number moving to say so. Two
// daily agent runs read the metrics in that window and neither noticed,
// because the metrics did not carry it.
//
// This module is the number that would have caught it. It is read by
// /admin/review, which is the missing UI, and by /api/admin/daily-metrics, so
// that "the archive has not published in N days" is a figure the daily review
// steers by rather than something somebody has to think to check.

import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { hasSupabaseEnv } from '@/app/tax-tips/_lib/articles';

/** Postgres `undefined_column`, and the shapes PostgREST reports it as. Same
 *  set as the review gate: a deploy that lands before the 20260906 migration
 *  must degrade to "cannot tell" rather than to a 500. */
const MISSING_COLUMN = new Set(['42703', 'PGRST204', 'PGRST100']);

export type DraftRow = {
  title: string;
  slug: string;
  excerpt: string;
  published_at: string;
  content?: string;
  sources?: unknown;
};

export type UpgradeRow = {
  title: string;
  slug: string;
  pending_title: string | null;
  pending_generated_at: string | null;
};

export type QueueState = {
  /** Null when the review_status column is not there yet — which is different
   *  from zero, and must not be reported as zero. */
  drafts: DraftRow[] | null;
  /** Null when the 20260909 migration has not run. */
  upgrades: UpgradeRow[] | null;
  publishedCount: number | null;
  /** ISO date of the newest published article, or null if there are none. */
  lastPublishedAt: string | null;
  /** Whole days since the archive last gained a page. Null when unknown. */
  daysSinceLastPublish: number | null;
  /** Age in hours of the draft that has waited longest. Null when none wait. */
  oldestDraftAgeHours: number | null;
  /** Set when something could not be read, for the caller to surface rather
   *  than swallow. */
  note?: string;
};

function hoursSince(iso: string): number {
  return Math.max(0, (Date.now() - new Date(iso).getTime()) / 3_600_000);
}

/**
 * Reads the queue.
 *
 * Every branch degrades rather than throws: this is called from a page render
 * and from the metrics endpoint, and neither should fail because a migration
 * is one deploy behind. A field that cannot be read comes back `null` and the
 * reason travels in `note` — the same rule the rest of this project follows,
 * that a number you cannot compute is never reported as zero.
 */
export async function readQueue(withContent = false): Promise<QueueState> {
  const empty: QueueState = {
    drafts: null,
    upgrades: null,
    publishedCount: null,
    lastPublishedAt: null,
    daysSinceLastPublish: null,
    oldestDraftAgeHours: null,
  };

  if (!hasSupabaseEnv()) {
    return { ...empty, note: 'No Supabase credentials in this environment.' };
  }

  const columns = withContent
    ? 'title, slug, excerpt, published_at, content, sources'
    : 'title, slug, excerpt, published_at';

  const [draftRes, publishedRes, upgradeRes] = await Promise.all([
    supabase
      .from('tax_articles')
      .select(columns)
      .eq('review_status', 'draft')
      // Oldest first: the queue is a backlog, and the thing that has waited
      // longest is the thing most likely to be going stale.
      .order('published_at', { ascending: true })
      .limit(50),
    supabase
      .from('tax_articles')
      .select('published_at', { count: 'exact' })
      .eq('review_status', 'published')
      .order('published_at', { ascending: false })
      .limit(1),
    supabase
      .from('tax_articles')
      .select('title, slug, pending_title, pending_generated_at')
      .not('pending_generated_at', 'is', null)
      .order('pending_generated_at', { ascending: true })
      .limit(50),
  ]);

  const gateMissing = !!draftRes.error && MISSING_COLUMN.has(draftRes.error.code ?? '');
  const drafts = gateMissing || draftRes.error
    ? null
    : ((draftRes.data ?? []) as unknown as DraftRow[]);

  const upgradesMissing = !!upgradeRes.error && MISSING_COLUMN.has(upgradeRes.error.code ?? '');
  const upgrades = upgradesMissing || upgradeRes.error
    ? null
    : ((upgradeRes.data ?? []) as unknown as UpgradeRow[]);

  const lastPublishedAt =
    !publishedRes.error && publishedRes.data?.[0]
      ? ((publishedRes.data[0] as { published_at: string }).published_at ?? null)
      : null;

  const notes: string[] = [];
  if (gateMissing) {
    notes.push(
      'tax_articles.review_status is missing — run supabase/migrations/20260906_editorial_and_scorecard.sql.',
    );
  } else if (draftRes.error) {
    notes.push(`Draft queue unreadable: ${draftRes.error.message}`);
  }
  if (upgradesMissing) {
    notes.push('Staged rewrites unavailable — run supabase/migrations/20260909_article_upgrades.sql.');
  }

  return {
    drafts,
    upgrades,
    publishedCount: publishedRes.error ? null : (publishedRes.count ?? null),
    lastPublishedAt,
    daysSinceLastPublish: lastPublishedAt
      ? Math.floor(hoursSince(lastPublishedAt) / 24)
      : null,
    oldestDraftAgeHours:
      drafts && drafts.length > 0 ? Math.round(hoursSince(drafts[0].published_at)) : null,
    note: notes.length ? notes.join(' ') : undefined,
  };
}

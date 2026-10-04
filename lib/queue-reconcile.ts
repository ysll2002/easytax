// The review queue, cleaned before anybody is asked to look at it.
//
// Why this exists. On 2026-09-16 the archive had been frozen for nine days
// behind a review gate, with three drafts waiting. Two of the three were
// byte-identical in title:
//
//   draft 2026-09-13  HMRC signed you up for Making Tax Digital — what happens now
//   draft 2026-09-11  HMRC signed you up for Making Tax Digital — what happens now
//   draft 2026-09-08  VAT Threshold Planning: Register Early or Wait for £90,000?
//
// and the title both of them claim is already a live hand-built landing page
// at /hmrc-signed-me-up-for-mtd. So of the three decisions the queue was
// asking for, one was a decision, and two were the same piece of busywork
// about a page that already exists.
//
// The cause was F44's: `nextQuery` commissioned the highest-priority uncovered
// query, the model answered with a headline for a *different* query, the
// commissioned query stayed uncovered, and it came up again two days later.
// F44 closed that loop for everything written from now on. It did nothing
// about the drafts already sitting in the queue, because nothing in this
// project ever reconciled the queue against itself — the collision check
// (F38) runs at insert time only, so it cannot see a pair that was already
// there when it shipped.
//
// Two reasons that is worth its own module rather than a one-off cleanup.
//
// First, the queue is the thing a person has to want to open. A reviewer who
// opens a backlog and finds most of it is the same page twice learns that the
// backlog is not worth opening, and the next nine days look like the last
// nine. Handing someone three decisions when there is one real decision is a
// cost paid every morning the alarm fires.
//
// Second, a rejection here is the cheapest safe action available. It changes
// nothing a reader can see: the row keeps its content, moves to
// `review_status: 'rejected'`, and the public archive is identical before and
// after. That is what makes it an agent's call to make, where publishing
// model-drafted tax guidance is not. The asymmetry is deliberate and it is the
// line this module stays on: **this never publishes anything and never deletes
// anything.** It only declines to ask a person about work that duplicates
// something they already have.
//
// What it will not touch: a draft that merely covers a similar theme, a draft
// whose stem is short enough to be generic, or the oldest member of any
// colliding set. When two drafts collide the *older* one survives, because it
// has waited longer and because keeping the newer one would let a run that
// re-commissions the same query repeatedly keep resetting the clock.

import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { hasSupabaseEnv } from '@/app/tax-tips/_lib/articles';
import { findTitleCollision, type TitleCollision } from '@/lib/article-quality';

/** Columns that vanish when the 20260906 migration has not run. Same set as
 *  the review gate: one deploy ahead of a migration degrades, never 500s. */
const MISSING_COLUMN = new Set(['42703', 'PGRST204', 'PGRST100']);

export type RejectedDraft = {
  slug: string;
  title: string;
  /** Whether it duplicated a live page or an older draft, and which one. */
  collision: TitleCollision;
  against: 'published' | 'draft';
};

export type ReconcileResult = {
  /** Drafts moved to `rejected`. Empty is the healthy steady state. */
  rejected: RejectedDraft[];
  /** Drafts still waiting after the pass — the real size of the ask. */
  remaining: number;
  /** Set when the queue could not be read or written. Never reported as a
   *  clean run, for the same reason the crawl's wall is not reported as zero
   *  defects: a pass that did nothing because it failed must not look like a
   *  pass that did nothing because there was nothing to do. */
  error?: string;
};

/**
 * Rejects drafts whose headline is already claimed, newest-first.
 *
 * Order matters and is the one subtle thing here. Drafts are read oldest-first
 * and each is tested against the published archive *and* against the drafts
 * already kept in this same pass. So in a set of three identical drafts the
 * oldest survives and the two newer ones are rejected, rather than all three
 * being rejected against each other or the newest arbitrarily winning.
 *
 * `dryRun` returns exactly what a real pass would reject without writing, so
 * the behaviour can be checked against the live queue before it is trusted
 * with it.
 */
export async function reconcileQueue(dryRun = false): Promise<ReconcileResult> {
  if (!hasSupabaseEnv()) {
    return { rejected: [], remaining: 0, error: 'No Supabase credentials in this environment.' };
  }

  const [draftRes, publishedRes] = await Promise.all([
    supabase
      .from('tax_articles')
      .select('slug, title, published_at')
      .eq('review_status', 'draft')
      .order('published_at', { ascending: true })
      .limit(50),
    supabase
      .from('tax_articles')
      .select('title')
      .eq('review_status', 'published')
      .limit(1000),
  ]);

  if (draftRes.error) {
    const missing = MISSING_COLUMN.has(draftRes.error.code ?? '');
    return {
      rejected: [],
      remaining: 0,
      error: missing
        ? 'tax_articles.review_status is missing — run supabase/migrations/20260906_editorial_and_scorecard.sql.'
        : `Draft queue unreadable: ${draftRes.error.message}`,
    };
  }
  if (publishedRes.error) {
    return { rejected: [], remaining: 0, error: `Archive unreadable: ${publishedRes.error.message}` };
  }

  const drafts = (draftRes.data ?? []) as { slug: string; title: string }[];
  const publishedTitles = ((publishedRes.data ?? []) as { title: string }[]).map(a => a.title);

  // Hand-built landing pages are part of the archive a search engine sees, and
  // the two drafts that prompted this module both duplicated one. They are not
  // rows in `tax_articles`, so the published list alone cannot catch them.
  const landingTitles = LANDING_PAGE_TITLES;

  const rejected: RejectedDraft[] = [];
  const kept: string[] = [];

  for (const draft of drafts) {
    const againstLive = findTitleCollision(draft.title, [...publishedTitles, ...landingTitles]);
    if (againstLive) {
      rejected.push({ slug: draft.slug, title: draft.title, collision: againstLive, against: 'published' });
      continue;
    }
    const againstKept = findTitleCollision(draft.title, kept);
    if (againstKept) {
      rejected.push({ slug: draft.slug, title: draft.title, collision: againstKept, against: 'draft' });
      continue;
    }
    kept.push(draft.title);
  }

  if (!dryRun && rejected.length > 0) {
    // One statement, not one per row: a partial pass that rejected two of three
    // and then failed would leave the queue in a state no reader of this
    // result could reconstruct.
    const { error } = await supabase
      .from('tax_articles')
      .update({ review_status: 'rejected', reviewed_by: RECONCILE_REVIEWER, reviewed_at: new Date().toISOString() })
      .in('slug', rejected.map(r => r.slug));

    if (error) {
      return {
        rejected: [],
        remaining: drafts.length,
        error: `Could not reject ${rejected.length} duplicate draft(s): ${error.message}`,
      };
    }
  }

  return { rejected, remaining: kept.length };
}

/** Stamped as the reviewer so a person reading the row later can tell this was
 *  a mechanical de-duplication and not somebody's editorial judgement. The
 *  article page's "reviewed by" notice draws on the same column, which is
 *  precisely why this must never be used on a publish. */
export const RECONCILE_REVIEWER = 'automated: duplicate of an existing page';

/**
 * Titles of the hand-built pages that are part of the public archive but not
 * rows in `tax_articles`.
 *
 * Kept here rather than derived from the route files because a title now comes
 * from `pageTitle()` at render time, and reading it would mean rendering every
 * route inside a cron step that has 300 seconds for the whole day's work. The
 * cost of the duplication is that a new landing page needs a line here; the
 * cost of not having it is the queue this module was written for.
 */
const LANDING_PAGE_TITLES = [
  'HMRC signed you up for Making Tax Digital — what happens now',
  'MTD quarterly update deadlines',
  'MTD deadline checker',
  'Self Assessment penalty calculator',
  'Payments on account calculator',
];

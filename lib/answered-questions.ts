// Which of the questions we set out to answer are actually answered, and where.
//
// The homepage already lists the three most recent articles. That is ordering
// the archive by the date a cron happened to write something, which is the one
// property of an article no reader cares about. lib/search-queries.ts has
// carried a demand model since 2026-09-08 — 30-odd queries as a worried person
// would type them, each with a priority and the page it should feed — and
// nothing has ever read it outside the article cron.
//
// This joins the two: the highest-priority questions the archive can genuinely
// answer, labelled with the words someone would search rather than the title a
// tax adviser would write. "hmrc signed me up for making tax digital
// automatically" is a thing a person types at midnight; "MTD ITSA: Automatic
// Enrolment and the Qualifying Income Threshold" is not.
//
// Why it matters here specifically. Over the 24 hours to 2026-09-12 in which
// bot labelling was live, five page views were classified as human and all
// five were on `/`. Not one reached an article, a tool or a topic hub. That is
// too small a sample to call a routing failure — five people who were never
// going to read anything looks identical — but the homepage is the only
// surface any human currently touches, so it is the only place a change can be
// tested at all.

import { TARGET_QUERIES, coversQuery, type TargetQuery } from '@/lib/search-queries';
import { hasSupabaseEnv } from '@/app/tax-tips/_lib/articles';
import { selectPublished } from '@/app/tax-tips/_lib/review';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

export type AnsweredQuestion = {
  /** The query as somebody would type it — this is the link text. */
  question: string;
  /** Where the answer lives. */
  href: string;
  /** The article's own headline, shown underneath as the supporting line. */
  title: string;
  cluster: string;
};

/** Sentence case for a query typed in lower case. Only the first letter and
 *  the acronyms we know about — a naive title-case would render "hmrc" as
 *  "Hmrc", which looks like a typo on the page it is meant to make credible. */
const ACRONYMS: Record<string, string> = {
  hmrc: 'HMRC',
  mtd: 'MTD',
  vat: 'VAT',
  itsa: 'ITSA',
  ni: 'NI',
  uk: 'UK',
  paye: 'PAYE',
  sa: 'SA',
};

export function presentQuery(q: string): string {
  const words = q.split(/\s+/).map(w => {
    const bare = w.replace(/[^a-z]/gi, '').toLowerCase();
    return ACRONYMS[bare] ? w.replace(new RegExp(bare, 'i'), ACRONYMS[bare]) : w;
  });
  const s = words.join(' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * The top `limit` answered questions, highest priority first.
 *
 * Only queries an article genuinely covers are returned — `coversQuery` is the
 * same test the cron uses to decide what to write next, so a question shown
 * here is one the pipeline considers done. Showing an unanswered question and
 * linking it to the nearest article would be the worst outcome: a visitor who
 * clicks a question and does not find it answered trusts the next one less.
 *
 * Returns empty rather than throwing when Supabase is absent, so a preview
 * build still renders a homepage.
 */
export async function answeredQuestions(limit = 6): Promise<AnsweredQuestion[]> {
  if (!hasSupabaseEnv()) return [];

  const { data, error } = await selectPublished(gated => {
    const q = supabase.from('tax_articles').select('title, slug');
    return (gated ? q.eq('review_status', 'published') : q)
      .order('published_at', { ascending: false })
      .limit(300);
  });

  if (error || !data) return [];

  const articles = data as unknown as { title: string; slug: string }[];

  // Priority order, stable within a band — same rule as coverage(): the list
  // order is the editorial order and reshuffling it daily would make the page
  // change for no reason a reader could perceive.
  const ranked = [...TARGET_QUERIES].sort((a, b) => a.priority - b.priority);

  const out: AnsweredQuestion[] = [];
  const usedSlugs = new Set<string>();

  for (const query of ranked) {
    if (out.length >= limit) break;
    const match = articles.find(a => coversQuery(a.title, query));
    if (!match) continue;
    // One link per article. Two near-identical queries answered by the same
    // page would otherwise take two of six slots and send both clicks to the
    // same place.
    if (usedSlugs.has(match.slug)) continue;
    usedSlugs.add(match.slug);

    out.push({
      question: presentQuery(query.q),
      href: `/tax-tips/${match.slug}`,
      title: match.title,
      cluster: (query as TargetQuery).cluster,
    });
  }

  return out;
}

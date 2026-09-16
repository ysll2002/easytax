// The question an article was written to answer, put back on the page.
//
// Every article since 2026-09-08 has been commissioned against one specific
// search — `lib/search-queries.ts` holds them as a worried person would type
// them, and `/api/cron/daily-article` hands the chosen one to the model as the
// exact question the piece must answer. F44 went further and made the headline
// fail quality review if it does not cover that query.
//
// And then the query was thrown away. It was never a column, never rendered,
// and reached nothing except a line in the run record. So the pipeline knew
// precisely which question each of 113 pages answers, and each of those pages
// went out without stating it.
//
// Why that is worth a module. Every search referral this site has ever
// received — all of them — landed on a `/tax-tips/*` article from a long-tail
// question query, and the largest single reader of this archive is not a
// person but `meta-externalagent`, at 32 fetches in the last seven days
// against 23 human page views. Both audiences reward the same thing and
// neither can infer it: the exact question, asked in the words people use,
// with a short direct answer next to it and structured data saying that is
// what it is. `Article` markup says "this is prose". `FAQPage` says "this is
// the answer to that question", which is the claim we are actually able to
// make and the one an answer engine can act on.
//
// Two deliberate limits.
//
// Nothing here invents a question. A page gets a Q&A block when we know what
// it was commissioned for — from the stored column, or from a confident match
// against the curated list using `coversQuery`, the same test that decides
// coverage everywhere else in this project. An article that matches nothing
// renders exactly as it does today. Guessing a question from a headline is how
// you end up telling a search engine the page answers something it does not,
// which is worse than saying nothing.
//
// And the answer is the article's own excerpt, never new text. The excerpt is
// already written by the same run, already reviewed by the same person, and
// already the meta description. Generating a fresh "short answer" would be
// putting unreviewed tax guidance on the page through a side door, which is
// the gate's whole purpose defeated for a snippet.

import { TARGET_QUERIES, coversQuery, type TargetQuery } from '@/lib/search-queries';

export type ArticleQuestion = {
  /** The search, as a person types it, rendered as a question. */
  question: string;
  /** The article's own excerpt. Never generated here. */
  answer: string;
  /** Where the question came from, so a reader of the data can tell a stored
   *  assignment from an inferred one. */
  source: 'stored' | 'matched';
};

/** Sentence case, with a question mark, from a lowercase search string.
 *  `hmrc` and other initialisms would look like typos in a heading, so the few
 *  that occur in the curated list are restored explicitly. */
const INITIALISMS: Record<string, string> = {
  hmrc: 'HMRC', mtd: 'MTD', vat: 'VAT', ni: 'NI', itsa: 'ITSA',
  uk: 'UK', paye: 'PAYE', ir35: 'IR35', aia: 'AIA', sa: 'SA',
};

export function asQuestion(query: string): string {
  const words = query.trim().split(/\s+/).map(w => {
    const bare = w.replace(/[^a-z0-9]/gi, '').toLowerCase();
    // The queries are written as people type them, which means lowercase "i".
    // Left alone it renders as "Can i appeal a HMRC late filing penalty" — in a
    // heading and, worse, in the FAQPage name a search engine may quote back.
    if (bare === 'i') return w.replace(/i/i, 'I');
    return INITIALISMS[bare] ? w.replace(new RegExp(bare, 'i'), INITIALISMS[bare]) : w;
  });
  if (words.length === 0) return '';
  let s = words.join(' ');
  s = s.charAt(0).toUpperCase() + s.slice(1);
  return /[?.!]$/.test(s) ? s : `${s}?`;
}

/** The curated entry an article answers, or null. Prefers the stored
 *  assignment; falls back to the same coverage test used everywhere else. */
export function targetForArticle(article: {
  title: string;
  target_query?: string | null;
}): TargetQuery | null {
  const stored = article.target_query?.trim();
  if (stored) {
    const exact = TARGET_QUERIES.find(t => t.q === stored);
    if (exact) return exact;
  }
  // Unstored, or stored as a query that has since been edited out of the list.
  // Matching is deliberately the strict `coversQuery`, not a loose similarity:
  // a wrong question in FAQPage markup is a false claim about the page.
  for (const t of TARGET_QUERIES) {
    if (coversQuery(article.title, t)) return t;
  }
  return null;
}

/**
 * The Q&A block for an article, or null when we do not know its question.
 *
 * `answer` is trimmed to whole sentences. An excerpt cut mid-clause reads as
 * broken in a featured snippet, and a snippet is exactly where this lands.
 */
export function articleQuestion(article: {
  title: string;
  excerpt?: string | null;
  target_query?: string | null;
}): ArticleQuestion | null {
  const target = targetForArticle(article);
  if (!target) return null;

  const answer = (article.excerpt ?? '').trim();
  // No excerpt means no answer we are allowed to give. Claiming a FAQPage with
  // an empty acceptedAnswer is a structured-data error, not a neutral no-op.
  if (answer.length < 40) return null;

  return {
    question: asQuestion(target.q),
    answer,
    source: article.target_query?.trim() ? 'stored' : 'matched',
  };
}

/**
 * Folds the commissioned question into the article's existing FAQPage node.
 *
 * `lib/article-structure.ts` already builds one from the H2 questions in the
 * body, and it is emitted whenever the body carries enough of them. A second
 * `FAQPage` on the same URL would be two nodes claiming to be the FAQ of one
 * document, which is a structured-data defect rather than twice the coverage —
 * so this prepends a question to the node that exists instead of adding one.
 *
 * It goes first because it is the only one of them phrased the way a person
 * actually searches; the H2s are editorial. Where the body has too few pairs
 * for a node to exist at all, one is created carrying just this question, which
 * is the case the 3 currently-matching articles are most likely to be in.
 *
 * Idempotent on the question text: a body whose H2 already asks this is not
 * given it twice.
 */
export function withCommissionedQuestion(
  existing: Record<string, unknown> | null,
  q: ArticleQuestion,
  pageUrl: string,
): Record<string, unknown> {
  const entry = {
    '@type': 'Question',
    name: q.question,
    acceptedAnswer: { '@type': 'Answer', text: q.answer },
  };

  if (!existing) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      inLanguage: 'en-GB',
      mainEntity: [entry],
    };
  }

  const current = Array.isArray(existing.mainEntity) ? existing.mainEntity : [];
  const already = current.some(
    (e: unknown) =>
      typeof e === 'object' && e !== null &&
      normalise(String((e as { name?: unknown }).name ?? '')) === normalise(q.question),
  );

  return already ? existing : { ...existing, mainEntity: [entry, ...current] };
}

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

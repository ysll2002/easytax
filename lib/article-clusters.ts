// The archive, de-duplicated against itself.
//
// Why this exists. On 2026-09-17 the site had 113 published articles and was
// drawing six search visitors a week. A `site:` search returned exactly one
// page — the homepage. Nothing in the archive surfaced at all.
//
// Thirty-three of those 113 articles turned out to be near-duplicates of
// another one. The pipeline had written the trading allowance five times,
// capital allowances on plant and machinery five times, home office expenses
// five times, and VAT partial exemption three times — twice under a
// byte-identical headline:
//
//   2026-09-02  VAT Partial Exemption: How to Calculate Your Recoverable Input Tax
//   2026-07-19  VAT Partial Exemption: How to Calculate Your Recoverable Input Tax
//   2026-06-25  VAT Partial Exemption: Calculate Your Recoverable Input Tax Correctly
//
// Five pages on one low-authority domain all answering "trading allowance vs
// actual expenses" is not five chances to rank. It is one chance, split five
// ways, on a domain that has to spend its authority choosing between its own
// pages before it can spend any of it competing with anybody else's.
//
// This was a known defect on the *creation* side and an unexamined one on the
// publication side. `findTitleCollision` (F38, F44) has refused to commission a
// colliding headline since 2026-09-14, and `reconcileQueue` (F46) clears
// duplicates out of the review queue. Both operate on drafts. Neither has ever
// looked at the 113 rows already published, because nothing in this project
// ever did — the archive accumulated its duplicates before the checks existed
// and no check was ever pointed backwards at it.
//
// **What this module does not do.** It does not delete, unpublish, rewrite or
// reject anything. Every URL that resolved before still resolves and still
// renders its full article, because somebody may hold the link. The only
// change is which of a set of near-identical pages is offered to a machine as
// the one to index: the secondaries get a canonical tag pointing at the
// primary and drop out of the sitemap, the feeds and llms.txt. That is the
// standard, reversible way to consolidate duplicate content, and it is
// reversible precisely because the pages are all still there. Deleting them
// would not be.

/** Words that carry no topic signal in a UK tax headline. `tax`, `hmrc` and
 *  `uk` are in here for the same reason `the` is: they appear in most titles
 *  in this archive, so counting them as agreement would make every pair look
 *  more alike than it is and drag unrelated pages into a cluster. */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'for', 'to', 'of', 'in', 'on', 'your', 'you',
  'what', 'how', 'why', 'it', 'is', 'are', 'can', 'with', 'vs', 'not', 'do',
  'does', 'my', 'me', 'when', 'from', 'before', 'after', 'which', 'more',
  'all', 'be', 'get', 'if', 'at', 'as', 'that', 'this', 'their', 'they',
  'should', 'than', 'but', 'by', 'out', 'up', 'into', 'about', 'own', 'any',
  'has', 'have', 'had', 'were', 'was', 'uk', 'hmrc', 'tax',
]);

/**
 * The content words of a headline, as a set.
 *
 * Tokens of two characters or fewer are dropped along with the stopwords: they
 * are initials and stray letters left behind by the punctuation strip (`&`
 * becomes `and` first, so the conjunction survives as a stopword rather than
 * as noise), and none of them distinguishes one page from another.
 */
export function titleTokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOPWORDS.has(w)),
  );
}

/**
 * How alike two headlines are, 0 to 1 — the Jaccard index of their content
 * words: shared words over total distinct words.
 *
 * Jaccard rather than a substring or edit-distance measure because the
 * duplicates in this archive are not typos of each other, they are the same
 * subject rephrased. "Home Office Expenses for Sole Traders: Flat Rate vs
 * Actual Costs" and "…: Fixed Rate vs Actual Costs" are one word apart and
 * would score well on any measure; "Home Working Expenses: Flat Rate vs Actual
 * Costs for Sole Traders" is the same article with the clauses swapped, and
 * only a set measure sees that it is the same page. Word order carries no
 * information here, so a measure that ignores it is the correct one.
 */
export function titleSimilarity(a: string, b: string): number {
  const A = titleTokens(a);
  const B = titleTokens(b);
  if (A.size === 0 || B.size === 0) return 0;

  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return shared / (A.size + B.size - shared);
}

/**
 * At or above this, two pages are treated as the same page and consolidated
 * without anybody looking at them.
 *
 * Calibrated against the live archive rather than picked. At 0.7 the six
 * clusters it finds are the six every reading of the list agrees on — three
 * VAT partial exemption pages, three home office pages, two identical trading
 * allowance pages, and so on. Every one of them is a page that was written
 * twice. Lowering it to 0.65 pulls in pairs like "Subsistence Costs for Sole
 * Traders" against "Meals and Entertainment: What Sole Traders Can Actually
 * Claim", which overlap but are arguably two angles somebody chose; those are
 * a judgement, and a judgement is not this module's to make silently. They are
 * reported instead — see `reviewCandidates`.
 */
export const DUPLICATE_THRESHOLD = 0.7;

/** Below `DUPLICATE_THRESHOLD` but above this, a pair is worth a person's
 *  attention and gets none of this module's behaviour applied to it. */
export const REVIEW_THRESHOLD = 0.5;

export type ClusterableArticle = {
  slug: string;
  title: string;
  published_at?: string | null;
};

export type ArticleCluster<T extends ClusterableArticle = ClusterableArticle> = {
  /** The page that keeps its place in the index. */
  primary: T;
  /** Same subject, canonicalised to `primary`. Never empty. */
  secondaries: T[];
};

/**
 * Groups articles that are the same page written more than once.
 *
 * Grouping is transitive (union-find), which is what makes the three VAT
 * partial exemption pages one cluster of three rather than two overlapping
 * pairs — and it is safe here only because the threshold is high. At 0.7 a
 * chain has to be built out of links that are each already a near-identity,
 * so it cannot drift from one subject to an unrelated one the way a chain of
 * weak links would.
 *
 * **Which page survives: the most recently published one.** Two reasons, and
 * one cost worth stating. UK tax guidance goes stale — rates, thresholds and
 * MTD dates all move — so the newest page is the one whose facts are most
 * likely to still be right, and it is the one a reader landing from search
 * should get. It is also the version the pipeline most recently judged worth
 * writing. The cost is that the older page may have been indexed longer and
 * may carry whatever authority it accumulated; that is a real trade and it is
 * being made deliberately, on the grounds that with six search visitors a week
 * there is no accumulated authority to protect, and correctness for a reader
 * outranks it if there were. Ties break on slug so that two articles published
 * the same day — which is how the two "Allowable Expenses" pages were written
 * — always elect the same primary rather than depending on row order.
 */
export function clusterArticles<T extends ClusterableArticle>(
  articles: T[],
  threshold = DUPLICATE_THRESHOLD,
): ArticleCluster<T>[] {
  const tokens = articles.map(a => titleTokens(a.title));

  const parent = articles.map((_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const union = (a: number, b: number) => {
    parent[find(a)] = find(b);
  };

  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const A = tokens[i];
      const B = tokens[j];
      if (A.size === 0 || B.size === 0) continue;
      let shared = 0;
      for (const w of A) if (B.has(w)) shared++;
      if (shared / (A.size + B.size - shared) >= threshold) union(i, j);
    }
  }

  const groups = new Map<number, T[]>();
  articles.forEach((a, i) => {
    const root = find(i);
    const g = groups.get(root);
    if (g) g.push(a);
    else groups.set(root, [a]);
  });

  const clusters: ArticleCluster<T>[] = [];
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    const ordered = [...members].sort(
      (x, y) =>
        (y.published_at ?? '').localeCompare(x.published_at ?? '') ||
        x.slug.localeCompare(y.slug),
    );
    clusters.push({ primary: ordered[0], secondaries: ordered.slice(1) });
  }

  // Deterministic order so two callers reporting the same archive agree.
  clusters.sort((a, b) => a.primary.slug.localeCompare(b.primary.slug));
  return clusters;
}

/**
 * Slug of the page each duplicate should point at, for every duplicate in the
 * archive. Primaries are deliberately absent rather than mapped to themselves,
 * so a caller can ask `map.get(slug)` and read "undefined" as "this page is
 * the canonical one" without a second comparison.
 */
export function canonicalSlugMap(
  articles: ClusterableArticle[],
  threshold = DUPLICATE_THRESHOLD,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const { primary, secondaries } of clusterArticles(articles, threshold)) {
    for (const s of secondaries) map.set(s.slug, primary.slug);
  }
  return map;
}

/**
 * Pairs that look alike but are below the bar for acting on automatically —
 * the ones a person should decide about.
 *
 * Reported rather than acted on, and reported at all because the failure this
 * project keeps repeating is the other way round: a control exists and the
 * number that would show what it is leaving on the table does not. Pairs
 * already consolidated are excluded, so this is strictly the undecided
 * remainder.
 */
export function reviewCandidates<T extends ClusterableArticle>(
  articles: T[],
  low = REVIEW_THRESHOLD,
  high = DUPLICATE_THRESHOLD,
): { a: T; b: T; similarity: number }[] {
  const out: { a: T; b: T; similarity: number }[] = [];
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const s = titleSimilarity(articles[i].title, articles[j].title);
      if (s >= low && s < high) out.push({ a: articles[i], b: articles[j], similarity: +s.toFixed(2) });
    }
  }
  return out.sort((x, y) => y.similarity - x.similarity);
}

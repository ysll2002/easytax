// One place that decides what goes in a <title> and a <meta name="description">.
//
// Why this exists, in numbers. A crawl of all 158 URLs in our own sitemap on
// 2026-09-14 found:
//
//   - 119 pages whose title ended `| EasyTax | EasyTax`
//   - 150 of 158 titles longer than 60 characters (median 83, longest 105)
//   - 151 of 158 descriptions longer than 160 characters
//
// The doubling is a template collision. `app/layout.tsx` declares
// `title: { template: '%s | EasyTax' }`, so Next appends the brand to every
// page title on the site. Four routes — the article page, the Tax Tips index,
// its pagination, pricing and the landlord landing page — also appended it by
// hand. The article route alone is 113 of the 119, because every article in
// the archive renders through it.
//
// That has been true for the whole life of the site. Five growth rounds aimed
// at organic search never saw it, because nothing ever read the rendered HTML;
// `/api/admin/seo-audit` was built on 2026-09-09 to do exactly that and has
// never been run. The title is the single strongest on-page signal a search
// engine has, and ours said the brand name twice and then got cut off.
//
// The policy below is deliberately conservative about rewriting. It removes
// what is certainly wrong and reports what it cannot fix, rather than
// truncating a headline somebody has to stand behind:
//
//   1. The final string is built here and handed to Next as `{ absolute }`, so
//      the template never runs and the doubling cannot come back.
//   2. The brand suffix is kept only when it fits inside the budget. For a
//      domain nobody has heard of, `| EasyTax` earns nothing in a results page
//      and it is the most disposable ten characters in the tag.
//   3. A title still over budget is LEFT ALONE and reported by the audit as
//      over budget. Google truncates the display at ~60 characters either way;
//      a mid-word cut in the tag throws away ranking signal and reads as
//      broken, and a machine should not be silently rewriting the headline of
//      a page about somebody's tax liability.
//
// Rule 3 replaced a rule that shortened an over-budget title at its first
// clause boundary — a colon or a dash — keeping the leading half. It was
// measured before it was kept, and it made things worse. Across the real
// archive it collapsed 16 articles into 7 colliding titles, because the part
// after the colon is exactly the part that distinguishes them:
//
//     Capital Allowances on Plant & Machinery: AIA vs First-Year Allowances
//     Capital Allowances on Plant & Machinery: How to Claim the AIA
//     Capital Allowances on Plant & Machinery: Full Expensing vs FYAs
//     ...  → five URLs, one title
//
// Duplicate titles are the readable signal for two pages competing for one
// query, which is the single thing `/api/admin/seo-audit` was built to find.
// Trading 119 doubled titles for 16 colliding ones is not a fix. The hubs that
// genuinely carried boilerplate are handled at the call site instead, by
// passing the heading rather than the decorated string.

/** Google renders roughly 600px of title, which is ~60 characters at the
 *  weights it uses. Past that the display is truncated. */
export const TITLE_BUDGET = 60;

/** Descriptions are given ~160 characters before truncation. */
export const DESC_BUDGET = 160;

export const BRAND = 'EasyTax';
const BRAND_SUFFIX = ` | ${BRAND}`;

const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

/**
 * Strip a brand suffix a caller appended by hand, so passing
 * `"Pricing | EasyTax"` and `"Pricing"` produce the same tag. This is what
 * makes the 119-page defect unrepeatable rather than merely fixed once.
 */
function stripBrand(s: string): string {
  let out = squash(s);
  // Loop: the defect we are fixing is literally two of these.
  for (;;) {
    const next = out.replace(/\s*[|–—-]\s*EasyTax\s*$/i, '');
    if (next === out) return out;
    out = squash(next);
  }
}

export type TitleReport = {
  /** The exact string that will be rendered. */
  title: string;
  /** True when the brand suffix had to be dropped to fit. */
  brandDropped: boolean;
  /** True when the result is still longer than the budget — nothing safe was
   *  available. The audit counts these; they are visible, not hidden. */
  overBudget: boolean;
};

/**
 * Build the final title string and explain what happened to it.
 * `buildTitle` is the testable core; `pageTitle` is what routes call.
 */
export function buildTitle(headline: string): TitleReport {
  const head = stripBrand(headline);

  const withBrand = head + BRAND_SUFFIX;
  if (withBrand.length <= TITLE_BUDGET) {
    return { title: withBrand, brandDropped: false, overBudget: false };
  }

  if (head.length <= TITLE_BUDGET) {
    return { title: head, brandDropped: true, overBudget: false };
  }

  // Rule 3: leave it whole rather than mangle it, and let the audit say so.
  return { title: head, brandDropped: true, overBudget: true };
}

/**
 * What a route hands to Next's `metadata.title`.
 *
 * Always `{ absolute }`: the root template stays in place for anything that has
 * not been migrated, but every page that goes through here opts out of it, so
 * the brand is applied exactly once, by this function, or not at all.
 */
export function pageTitle(headline: string): { absolute: string } {
  return { absolute: buildTitle(headline).title };
}

/**
 * Trim a description to the budget without cutting a word in half.
 *
 * Prefers to end on a complete sentence when one finishes late enough to still
 * be a useful description — a clean two-sentence summary reads better in a
 * results page than a three-sentence one with a tail lopped off. Falls back to
 * a word boundary with an ellipsis, which is what the reader would otherwise
 * have seen Google do.
 */
export function metaDescription(text: string): string {
  const s = squash(text);
  if (s.length <= DESC_BUDGET) return s;

  // A sentence end inside the budget, but not so early that we throw the
  // description away to get one.
  const window = s.slice(0, DESC_BUDGET + 1);
  const sentence = Math.max(
    window.lastIndexOf('. '),
    window.lastIndexOf('? '),
    window.lastIndexOf('! '),
  );
  if (sentence >= DESC_BUDGET * 0.6) return s.slice(0, sentence + 1);

  const word = s.lastIndexOf(' ', DESC_BUDGET - 1);
  const cut = word > DESC_BUDGET * 0.5 ? word : DESC_BUDGET - 1;
  return s.slice(0, cut).replace(/[,;:—–-]$/, '').trimEnd() + '…';
}

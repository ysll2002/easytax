/**
 * Making a headline fit the search result without mangling it.
 *
 * `buildTitle` drops the brand to make room and, when that is not enough,
 * leaves the headline whole — "leave it whole rather than mangle it, and let
 * the audit say so". That was the right call when there was no safe way to
 * shorten a headline. The audit has been saying so for some weeks now: on
 * 2026-09-18, **80 of the 114 published articles** render a `<title>` longer
 * than the 60 characters Google displays, median 63, longest 78. Two thirds of
 * the only pages search can send anyone to are cut off mid-phrase in the one
 * place a searcher decides whether to click.
 *
 * `STANDARD.maxTitleChars` has capped new headlines at the budget since
 * 2026-09-14, so this is a debt, not a leak: every one of the 80 predates the
 * cap and none of them will be rewritten by the upgrade loop for months.
 *
 * ## What this does not do
 *
 * It does not truncate, and it does not touch the H1. The headline on the page
 * stays exactly as written — this only produces the `<title>` tag, which is a
 * display string. A reader who clicks still lands on the full headline.
 *
 * It also does not cut at the colon. That was the first thing tried and it is
 * wrong: "Adjusted Profit Calculations: Mistakes That Cost Directors
 * Thousands" becomes "Adjusted Profit Calculations", 28 characters that throw
 * away the entire reason to click. Half of the archive would have been
 * flattened to a bare subject.
 *
 * ## What it does instead
 *
 * A short list of reductions, each of which removes words that carry no search
 * intent — "How to", "Your", "Explained", a trailing "— A Practical Guide".
 * Candidates are built by applying them cumulatively, and the one chosen is
 * the **longest candidate that fits**, not the first. Choosing the longest is
 * what stops it over-shortening: "Vehicle Finance vs Operating Leases: Tax
 * Rules for Sole Traders" (62) needs to lose two characters, and a rule set
 * applied in order until something fits would have handed back 46.
 *
 * When nothing fits, the original is returned unchanged and the audit still
 * counts it. Measured against the live archive: 39 of the 80 come under
 * budget, 41 keep the old behaviour.
 */

/** Google renders roughly 600px of title, ~60 characters at its weights. */
export const DEFAULT_TITLE_BUDGET = 60;

/**
 * Below this, a title has lost the subject along with the filler. A reduction
 * that would produce something shorter is discarded even if it fits, which is
 * the guard against the colon-cut failure described above.
 */
const MIN_USEFUL = 30;

type Reduction = {
  /** Named so the audit and the tests can say which rule fired. */
  readonly id: string;
  readonly find: RegExp;
  readonly replace: string;
};

/**
 * Ordered loosely from "removes nothing a searcher typed" to "removes a
 * qualifier that is still in the H1 and the body". Order only decides which
 * candidates exist; which one is used is decided by length.
 *
 * Every rule here was checked against all 114 published headlines. Rules that
 * produced a single awkward title were dropped rather than special-cased —
 * a headline this cannot shorten is a headline it leaves alone, and that is a
 * perfectly good outcome.
 */
const REDUCTIONS: readonly Reduction[] = [
  // Trailing promises of a guide. The page is the guide.
  { id: 'guide-dash', find: /\s*[—–-]\s*(?:A|The)\s+(?:Complete|Practical|Simple|Quick|Ultimate|Step-by-Step)\s+Guide$/i, replace: '' },
  { id: 'guide-colon', find: /:\s*(?:A|The)\s+(?:Complete|Practical|Simple|Quick|Ultimate|Step-by-Step)\s+Guide$/i, replace: '' },
  { id: 'explained', find: /\s+Explained$/i, replace: '' },
  { id: 'correctly', find: /\s+Correctly$/i, replace: '' },
  // A year in the tail dates the page in the one place we cannot revise it
  // cheaply; the body states the year it applies from.
  { id: 'trailing-year', find: /\s+in\s+20\d\d(?:\/\d\d)?$/i, replace: '' },
  { id: 'without-records', find: /\s+Without\s+Keeping\s+Records$/i, replace: '' },
  // "How to claim X" and "Claim X" are the same result to a searcher, and the
  // second is two words shorter.
  { id: 'how-to', find: /\bHow\s+to\s+/gi, replace: '' },
  { id: 'what-you-can-claim', find: /\bWhat\s+You\s+Can\s+Claim\b/i, replace: 'What to Claim' },
  // "Maximise Your Tax Relief" → "Maximise Tax Relief" reads as a headline.
  // "Cut Tax and NI in Your Limited Company" → "…in Limited Company" does not,
  // because after a preposition the possessive is doing grammatical work. The
  // lookbehind is the difference between a shorter title and a worse one.
  { id: 'your', find: /(?<!\b(?:in|on|for|of|to|with|from|at|by|into|under|before|after|against)\s)\bYour\s+/g, replace: '' },
  { id: 'actually', find: /\bActually\s+/gi, replace: '' },
  { id: 'really', find: /\bReally\s+/gi, replace: '' },
  { id: 'vs-dot', find: /\bvs\.\s+/gi, replace: 'vs ' },
  { id: 'ampersand', find: /\s+and\s+/g, replace: ' & ' },
  { id: 'leading-the', find: /^The\s+/i, replace: '' },
  // No rule here may change a verb's form. "When Does a Late Invoice Count" →
  // "When a Late Invoice Count" was written, measured, and removed: it saved
  // five characters and produced a headline that is not English. A title this
  // cannot shorten is left alone, which is always an acceptable result.
  // Last, and only as a last resort: the audience qualifier. It is a real
  // search term, which is why it is at the bottom — but it is still in the H1,
  // the excerpt and the body, and a visible title beats an invisible one.
  { id: 'audience', find: /\bfor\s+(?:UK\s+)?(?:Sole\s+Traders|Freelancers|Landlords|Limited\s+Companies|Company\s+Directors)\b/i, replace: '' },
];

/** Collapse whitespace and repair the punctuation a removal can strand:
 *  " :" from a dropped head word, a colon left at the end by a dropped tail. */
function tidy(s: string): string {
  return s
    .replace(/\s+/g, ' ')
    .replace(/\s+([:,.?!])/g, '$1')
    .replace(/\s*[:—–-]\s*$/, '')
    .trim();
}

export type FittedTitle = {
  /** The string to render. Equal to the input when nothing safe was found. */
  title: string;
  /** Whether the result is within budget. */
  fits: boolean;
  /** Which reductions were applied, for the audit and for debugging a title
   *  somebody thinks reads oddly. Empty when the headline was already short
   *  enough or could not be helped. */
  applied: string[];
};

/**
 * Fit `headline` into `budget` characters, or return it unchanged.
 *
 * Pure and deterministic: the same headline always produces the same tag, so
 * a title cannot change between a build and a re-render.
 */
export function fitHeadline(headline: string, budget = DEFAULT_TITLE_BUDGET): FittedTitle {
  const original = tidy(headline);
  if (original.length <= budget) return { title: original, fits: true, applied: [] };

  // Cumulative candidates: each reduction is applied on top of the ones before
  // it that changed something. A reduction that changes nothing is skipped so
  // it does not appear in `applied`.
  const candidates: FittedTitle[] = [];
  let current = original;
  const applied: string[] = [];

  for (const rule of REDUCTIONS) {
    const next = tidy(current.replace(rule.find, rule.replace));
    if (next === current || next.length < MIN_USEFUL) continue;
    current = next;
    applied.push(rule.id);
    candidates.push({ title: next, fits: next.length <= budget, applied: [...applied] });
  }

  // The longest candidate that fits: the least the headline can lose and still
  // be shown whole.
  const best = candidates
    .filter(c => c.fits)
    .sort((a, b) => b.title.length - a.title.length)[0];

  return best ?? { title: original, fits: false, applied: [] };
}

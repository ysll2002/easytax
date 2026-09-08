// The queries the archive is trying to rank for.
//
// Why this exists: the daily article cron asked a model to "suggest ONE
// specific, practical article topic for a UK tax audience" and then wrote
// whatever came back. That produced 113 articles and, across the whole
// measured window, two visits from a search engine. The titles are perfectly
// good tax writing — "Goodwill amortisation: why it's not tax deductible in
// the UK" — and almost nobody types anything like them into Google.
//
// Nothing in the pipeline was anchored to demand. This file is that anchor: a
// list of things UK taxpayers actually search for, chosen by hand, each mapped
// to the page on this site that should benefit from the visit. The cron picks
// the highest-priority query the archive does not already answer, and the
// article is written to answer that question specifically.
//
// Two rules held while writing this list, both learned from the 113:
//
//   1. A query is a question a worried person types, not a topic a tax adviser
//      would name. "do i have to do a tax return if i earned under 1000" beats
//      "The trading allowance explained".
//   2. Timeliness is the one edge a small site has over an established one.
//      MTD ITSA commenced on 6 April 2026 and HMRC began auto-enrolling the
//      £50,000 cohort in September 2026. The people it is happening to are
//      searching right now, and the incumbent guides were written in 2024.
//
// This is a hypothesis, not a measurement — we have no keyword-volume data and
// no Search Console access. What makes it testable is that it is written down:
// `funnel.attribution.*.by_channel` and the coverage figure reported by the
// cron say whether anchoring the archive to it changed anything by 2026-10-08.

export type QueryIntent = 'informational' | 'commercial' | 'transactional';

export interface TargetQuery {
  /** The search as someone would type it. Used for coverage matching and given
   *  to the model as the exact question the article must answer. */
  q: string;
  /** The headline to publish under. Reads like a sentence, keeps the query's
   *  words, stays under 80 characters. */
  title: string;
  intent: QueryIntent;
  /** Grouping, for reporting coverage by theme. */
  cluster: string;
  /** The page on this site the article should send the reader to. Every
   *  article earns an internal link to somewhere that can convert. */
  link: string;
  /** 1 is highest. Reserved for queries that are both timely and close to the
   *  thing we sell. */
  priority: 1 | 2 | 3;
}

export const TARGET_QUERIES: TargetQuery[] = [
  // ── Cluster: the mandate is live, and it is happening to people now ──────
  {
    q: 'hmrc signed me up for making tax digital automatically',
    title: 'HMRC signed you up for Making Tax Digital — what happens now',
    intent: 'informational', cluster: 'mtd-live', link: '/mtd-deadline-checker', priority: 1,
  },
  {
    q: 'do i have to use making tax digital for income tax',
    title: 'Do you have to use Making Tax Digital for Income Tax?',
    intent: 'informational', cluster: 'mtd-live', link: '/mtd-deadline-checker', priority: 1,
  },
  {
    q: 'i missed my mtd quarterly update deadline what happens',
    title: 'You missed an MTD quarterly update deadline — what happens next',
    intent: 'informational', cluster: 'mtd-penalties', link: '/mtd-deadline-checker', priority: 1,
  },
  {
    q: 'what counts as qualifying income for making tax digital',
    title: 'What counts as qualifying income for Making Tax Digital?',
    intent: 'informational', cluster: 'mtd-live', link: '/mtd-deadline-checker', priority: 1,
  },
  {
    q: 'how to opt out of making tax digital income tax exemption',
    title: 'Can you opt out of Making Tax Digital? Exemptions explained',
    intent: 'informational', cluster: 'mtd-live', link: '/mtd-deadline-checker', priority: 1,
  },
  {
    q: 'making tax digital income tax deadlines 2026 27',
    title: 'Making Tax Digital deadlines for the 2026/27 tax year',
    intent: 'informational', cluster: 'mtd-live', link: '/timetable', priority: 1,
  },
  {
    q: 'do i still do a self assessment if i am on making tax digital',
    title: 'Do you still file a Self Assessment return under Making Tax Digital?',
    intent: 'informational', cluster: 'mtd-live', link: '/self-assessment-software', priority: 1,
  },
  {
    q: 'mtd income tax under 50000 do i need to sign up',
    title: 'Under £50,000? When Making Tax Digital starts applying to you',
    intent: 'informational', cluster: 'mtd-live', link: '/mtd-deadline-checker', priority: 2,
  },

  // ── Cluster: MTD mechanics — the how, once you are in it ─────────────────
  {
    q: 'what do i put in an mtd quarterly update',
    title: 'What goes in an MTD quarterly update?',
    intent: 'informational', cluster: 'mtd-mechanics', link: '/mtd-software', priority: 1,
  },
  {
    q: 'can i correct a mistake in an mtd quarterly update',
    title: 'How to correct a mistake in an MTD quarterly update',
    intent: 'informational', cluster: 'mtd-mechanics', link: '/mtd-software', priority: 2,
  },
  {
    q: 'mtd digital records what do i actually have to keep',
    title: 'MTD digital record keeping: what you actually have to keep',
    intent: 'informational', cluster: 'mtd-mechanics', link: '/mtd-software', priority: 2,
  },
  {
    q: 'can i still use a spreadsheet for making tax digital',
    title: 'Can you still use a spreadsheet for Making Tax Digital?',
    intent: 'informational', cluster: 'mtd-mechanics', link: '/mtd-software', priority: 2,
  },
  {
    q: 'mtd for two businesses sole trader and rental property',
    title: 'MTD with two income sources: sole trader plus rental property',
    intent: 'informational', cluster: 'mtd-mechanics', link: '/landlord-tax-software', priority: 2,
  },
  {
    q: 'what is the final declaration making tax digital',
    title: 'What is the MTD final declaration, and when is it due?',
    intent: 'informational', cluster: 'mtd-mechanics', link: '/timetable', priority: 2,
  },

  // ── Cluster: penalties, which is what people search when frightened ──────
  {
    q: 'making tax digital penalty points how do they work',
    title: 'MTD penalty points: how the new system actually works',
    intent: 'informational', cluster: 'mtd-penalties', link: '/mtd-deadline-checker', priority: 1,
  },
  {
    q: 'how much is the fine for filing self assessment late',
    title: 'How much is the fine for filing your tax return late?',
    intent: 'informational', cluster: 'sa-penalties', link: '/self-assessment-penalty-calculator', priority: 1,
  },
  {
    q: 'hmrc late payment interest rate 2026',
    title: 'HMRC late payment interest in 2026: the rate and what it costs you',
    intent: 'informational', cluster: 'sa-penalties', link: '/self-assessment-penalty-calculator', priority: 1,
  },
  {
    q: 'can i appeal a hmrc late filing penalty reasonable excuse',
    title: 'Appealing an HMRC late filing penalty: what counts as a reasonable excuse',
    intent: 'informational', cluster: 'sa-penalties', link: '/self-assessment-penalty-calculator', priority: 2,
  },
  {
    q: 'i cant afford my tax bill hmrc payment plan',
    title: 'Can’t afford your tax bill? How an HMRC Time to Pay plan works',
    intent: 'informational', cluster: 'sa-penalties', link: '/self-assessment-penalty-calculator', priority: 2,
  },

  // ── Cluster: Self Assessment, still live for 2025/26 ─────────────────────
  {
    q: 'self assessment deadline 2027 when is my tax return due',
    title: 'When is your 2025/26 Self Assessment return due?',
    intent: 'informational', cluster: 'self-assessment', link: '/timetable', priority: 1,
  },
  {
    q: 'what are payments on account and why do i have to pay them',
    title: 'What are payments on account, and why are you being asked for them?',
    intent: 'informational', cluster: 'self-assessment', link: '/payments-on-account-calculator', priority: 1,
  },
  {
    q: 'can i reduce my payments on account',
    title: 'How to reduce your payments on account (and when not to)',
    intent: 'informational', cluster: 'self-assessment', link: '/payments-on-account-calculator', priority: 1,
  },
  {
    q: 'do i need to do a tax return if i earned under 1000',
    title: 'Do you need to file a tax return if you earned under £1,000?',
    intent: 'informational', cluster: 'self-assessment', link: '/self-assessment-software', priority: 2,
  },
  {
    q: 'do i need to do a self assessment for a side hustle',
    title: 'Do you need to file a tax return for a side hustle?',
    intent: 'informational', cluster: 'self-assessment', link: '/self-assessment-software', priority: 2,
  },
  {
    q: 'first time self assessment what do i need utr',
    title: 'Filing your first Self Assessment: the UTR, the steps, the timings',
    intent: 'informational', cluster: 'self-assessment', link: '/self-assessment-software', priority: 2,
  },

  // ── Cluster: expenses, the perennial ─────────────────────────────────────
  {
    q: 'what can i claim as expenses self employed uk',
    title: 'What can you claim as expenses when you are self-employed?',
    intent: 'informational', cluster: 'expenses', link: '/tools', priority: 1,
  },
  {
    q: 'how much can i claim for working from home self employed',
    title: 'How much can you claim for working from home?',
    intent: 'informational', cluster: 'expenses', link: '/tools', priority: 1,
  },
  {
    q: 'can i claim my car as a business expense self employed',
    title: 'Claiming a car as a business expense: mileage vs actual costs',
    intent: 'informational', cluster: 'expenses', link: '/tools', priority: 2,
  },
  {
    q: 'can i claim my phone bill as a business expense',
    title: 'Can you claim your phone bill as a business expense?',
    intent: 'informational', cluster: 'expenses', link: '/tools', priority: 3,
  },
  {
    q: 'are clothes a business expense self employed uk',
    title: 'Are clothes ever a business expense? The UK rule, plainly',
    intent: 'informational', cluster: 'expenses', link: '/tools', priority: 3,
  },

  // ── Cluster: landlords ───────────────────────────────────────────────────
  {
    q: 'landlord tax return what expenses can i claim',
    title: 'Landlord tax return: which expenses you can actually claim',
    intent: 'informational', cluster: 'landlord', link: '/landlord-tax-software', priority: 1,
  },
  {
    q: 'section 24 mortgage interest relief landlords how it works',
    title: 'Section 24: how mortgage interest relief works for landlords now',
    intent: 'informational', cluster: 'landlord', link: '/landlord-tax-software', priority: 2,
  },
  {
    q: 'do landlords have to do making tax digital',
    title: 'Do landlords have to use Making Tax Digital?',
    intent: 'informational', cluster: 'landlord', link: '/landlord-tax-software', priority: 1,
  },

  // ── Cluster: VAT ─────────────────────────────────────────────────────────
  {
    q: 'when do i have to register for vat threshold uk',
    title: 'When do you have to register for VAT?',
    intent: 'informational', cluster: 'vat', link: '/mtd-software', priority: 2,
  },
  {
    q: 'flat rate vat scheme is it worth it',
    title: 'Is the VAT Flat Rate Scheme worth it for a small business?',
    intent: 'informational', cluster: 'vat', link: '/mtd-software', priority: 3,
  },

  // ── Cluster: limited companies ───────────────────────────────────────────
  {
    q: 'salary or dividends whats most tax efficient director',
    title: 'Salary or dividends: what is most tax-efficient for a director?',
    intent: 'informational', cluster: 'limited-company', link: '/pricing', priority: 2,
  },
  {
    q: 'when is my corporation tax return due ct600',
    title: 'When is your CT600 Corporation Tax return due?',
    intent: 'informational', cluster: 'limited-company', link: '/timetable', priority: 2,
  },
  {
    q: 'should i be a sole trader or limited company',
    title: 'Sole trader or limited company: which leaves you better off?',
    intent: 'commercial', cluster: 'limited-company', link: '/pricing', priority: 2,
  },

  // ── Cluster: software choice — closest to the sale ───────────────────────
  {
    q: 'cheapest mtd software for self assessment',
    title: 'The cheapest way to file MTD quarterly updates',
    intent: 'commercial', cluster: 'software', link: '/pricing', priority: 1,
  },
  {
    q: 'free mtd software for landlords hmrc approved',
    title: 'Is there free MTD software for landlords?',
    intent: 'commercial', cluster: 'software', link: '/landlord-tax-software', priority: 2,
  },
  {
    q: 'do i need an accountant for making tax digital',
    title: 'Do you need an accountant for Making Tax Digital?',
    intent: 'commercial', cluster: 'software', link: '/pricing', priority: 2,
  },
];

/**
 * Anchor text for each destination.
 *
 * Kept as a lookup rather than a field on every query so the wording of a link
 * to /pricing is decided once, in one place, for all the articles that point
 * there — and so adding a query is three lines rather than four.
 */
const LINK_LABELS: Record<string, string> = {
  '/mtd-deadline-checker': 'Check which MTD deadlines apply to you',
  '/self-assessment-penalty-calculator': 'Work out what a late return will cost you',
  '/payments-on-account-calculator': 'Work out your payments on account',
  '/timetable': 'See the full MTD and Self Assessment timetable',
  '/tools': 'Try our free tax calculators',
  '/mtd-software': 'See how EasyTax files your MTD updates',
  '/self-assessment-software': 'See how EasyTax handles Self Assessment',
  '/landlord-tax-software': 'See how EasyTax works for landlords',
  '/pricing': 'See EasyTax pricing',
};

/** Anchor text for a target's destination, with a safe generic fallback. */
export function linkLabelFor(path: string): string {
  return LINK_LABELS[path] ?? 'Read more on EasyTax';
}

/** Words too common to carry meaning when matching a query against a title. */
const STOP = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'do', 'does',
  'for', 'from', 'have', 'how', 'i', 'if', 'in', 'is', 'it', 'me', 'my', 'of',
  'on', 'or', 'so', 'still', 'the', 'to', 'up', 'was', 'what', 'when', 'why',
  'will', 'with', 'you', 'your', 'uk', 'much', 'need', 'get', 'got', 'am',
  'has', 'had', 'not', 'no', 'yes', 'they', 'them', 'their', 'there',
]);

function significantWords(s: string): string[] {
  return Array.from(
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !STOP.has(w)),
    ),
  );
}

/**
 * How many target queries each word appears in.
 *
 * "tax", "making" and "digital" are in a third of the list and therefore say
 * almost nothing about which query a title is about; "expenses", "qualifying"
 * and "appeal" are close to unique and say almost everything.
 */
const DOC_FREQ: Map<string, number> = (() => {
  const m = new Map<string, number>();
  for (const q of TARGET_QUERIES) {
    for (const w of significantWords(q.q)) m.set(w, (m.get(w) ?? 0) + 1);
  }
  return m;
})();

/** The rarest words in a query — the ones a title must contain to be about it. */
function distinctiveWords(query: TargetQuery): string[] {
  const ws = significantWords(query.q);
  if (ws.length === 0) return [];
  const rarest = Math.min(...ws.map(w => DOC_FREQ.get(w) ?? 1));
  return ws.filter(w => (DOC_FREQ.get(w) ?? 1) === rarest);
}

/**
 * Whether an existing title already answers a target query.
 *
 * Substring matching is useless here — the archive's titles are editorial, not
 * interrogative — so this compares significant words instead. Two conditions,
 * because word overlap alone was not enough:
 *
 *   1. The title carries at least 70% of the query's significant words, and
 *   2. it carries every one of the query's *distinctive* words.
 *
 * Overlap on its own produced two kinds of false positive against the real
 * 113-article archive. "Overlap relief: claim tax relief when going self
 * employed" scored 75% against "what can i claim as expenses self employed
 * uk" — three words shared, and the one that mattered, `expenses`, missing.
 * And a single generic title, "Making Tax Digital for Income Tax: your
 * pre-April 2026 checklist", cleared the bar for four unrelated MTD queries
 * at once, which would have suppressed a month of the highest-priority work
 * on the strength of one article that is now out of date anyway.
 *
 * Erring toward "not covered" is the right way round: a duplicate costs a day
 * of the pipeline and splits whatever ranking the original earned, but a
 * wrongly-skipped query costs the query entirely.
 */
export function coversQuery(title: string, query: TargetQuery): boolean {
  const want = significantWords(query.q);
  if (want.length === 0) return false;
  const have = new Set(significantWords(title));

  if (!distinctiveWords(query).every(w => have.has(w))) return false;

  const hits = want.filter(w => have.has(w)).length;
  return hits / want.length >= 0.7;
}

export interface QueryCoverage {
  total: number;
  covered: number;
  /** Uncovered queries, highest priority first. */
  pending: TargetQuery[];
}

/** Coverage of the target list by an existing set of article titles. */
export function coverage(titles: string[]): QueryCoverage {
  const pending = TARGET_QUERIES.filter(q => !titles.some(t => coversQuery(t, q)));
  // Stable within a priority band: the list order is the editorial order, and
  // reshuffling it daily would make the pipeline's choices unreproducible.
  pending.sort((a, b) => a.priority - b.priority);
  return {
    total: TARGET_QUERIES.length,
    covered: TARGET_QUERIES.length - pending.length,
    pending,
  };
}

/** The query the pipeline should write next, or null if the list is exhausted. */
export function nextQuery(titles: string[]): TargetQuery | null {
  return coverage(titles).pending[0] ?? null;
}

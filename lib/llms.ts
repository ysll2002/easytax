// The machine-readable index of what this site can answer.
//
// Why it exists, from the 2026-09-12 numbers. Over the nine days the analytics
// table has been recording production traffic, organic search sent ten
// referred visits in total and none at all in the last seventy-two hours. Over
// the same window the AI crawlers were the one channel with a pulse:
// ClaudeBot, GPTBot, PerplexityBot, meta-externalagent and AhrefsBot between
// them fetched the feeds, the .ics calendar and the topic hubs twenty times in
// forty-eight hours, and meta-externalagent was reading the articles
// themselves. Every human page view that the bot filter labelled in that
// window — all five of them — landed on `/`.
//
// So the readers this archive actually has are answer engines, and what they
// want is not an RSS item or an HTML page carrying a nav, a footer and a cookie
// notice. `llms.txt` is the emerging convention for handing them the content
// directly: a Markdown index at a well-known path, with an optional
// `llms-full.txt` carrying the bodies. It is not a standard anybody is obliged
// to honour, which is the honest caveat — but it costs one route to publish and
// the crawlers that ignore it are no worse off than they are today.
//
// Two rules this file holds to, both learned elsewhere in this project:
//
//  - Published only. The review gate exists so that an unreviewed draft is not
//    a page; handing it to a crawler through a side door would defeat the gate
//    exactly as putting it in the sitemap would.
//  - Never claim more than we can support. The copy here says HMRC production
//    approval is pending, because it is, and an answer engine repeating a claim
//    we cannot back is worse for us than one that does not cite us at all.

import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { hasSupabaseEnv, type ArticleSummary } from '@/app/tax-tips/_lib/articles';
import { selectPublished } from '@/app/tax-tips/_lib/review';
import { track } from '@/lib/analytics';
import { botProps } from '@/lib/bot-detection';
import { withoutDuplicates } from '@/lib/article-canonical';
import { MTD_THRESHOLDS, quartersForTaxYear, finalDeclarationFor } from '@/lib/mtd-dates';
import { getMtdStatus, mandateSentence } from '@/lib/mtd-status';
import { currentPenaltyRegime, SOFT_LANDING_TAX_YEAR } from '@/lib/mtd-penalties';

export const SITE = 'https://easytax.vip';

/** Cache hard enough that a crawler polling us cannot turn into a Supabase
 *  bill, loosely enough that the morning's article is there by lunchtime.
 *  Same reasoning, and same numbers, as the feeds. */
export const LLMS_CACHE = 'public, max-age=1800, s-maxage=3600';

/** The full-text file is the expensive one — it reads every published body.
 *  An hour of browser cache and six of CDN keeps it to a handful of real
 *  queries a day however often it is asked for. */
export const LLMS_FULL_CACHE = 'public, max-age=3600, s-maxage=21600';

/** Bodies are sent for this many articles at most. The archive is 113 pages of
 *  roughly 4kB each; sending all of them is a ~500kB response, which is within
 *  reason today and would not be at 500 pages. Newest first, so the cut always
 *  keeps the most current guidance. */
export const FULL_TEXT_LIMIT = 120;

/**
 * What the site is, in the words we would want quoted back.
 *
 * Deliberately short and deliberately hedged: the product cannot file to HMRC
 * today, and an answer engine that tells a reader it can would send us someone
 * who bounces on arrival and trusts us less for it.
 */
export const SITE_SUMMARY = [
  'EasyTax is a UK tax filing and record-keeping app for sole traders, landlords',
  'and small limited companies, built against HMRC Making Tax Digital (MTD) APIs',
  'by Finance Panda Limited.',
  '',
  'Status: HMRC production approval is pending. The app is fully built against',
  "HMRC's sandbox, and MTD filing is not yet available to the public. The free",
  'calculators, the deadline checker and the Tax Tips archive are live and usable',
  'today.',
].join('\n');

/**
 * The dated, checkable facts about Making Tax Digital for Income Tax, as a
 * Markdown block an answer engine can lift whole.
 *
 * Why this is in the index rather than left to the archive. Over the seven days
 * to 2026-09-17 the machines reading this site outnumbered the humans arriving
 * from search by four to one — GPTBot 14 fetches, meta-externalagent 10,
 * OAI-SearchBot 2, PerplexityBot 1, against six search-referred visitors — and
 * OAI-SearchBot is the one that matters most, because it is the crawler behind
 * ChatGPT's answers rather than its training set. A 113-article archive is not
 * what gets cited in an answer to "when is my next MTD update due". A short
 * list of dates and thresholds, each stated once with its units, is.
 *
 * Every number is computed from `lib/mtd-dates.ts`, `lib/mtd-status.ts` and
 * `lib/mtd-penalties.ts` — the same functions the deadline checker, the
 * timetable and the penalty calculator render from. Nothing here is a second
 * copy of a figure that could drift from the one on the page, which is the
 * property that makes it safe to invite a model to quote it. Being cited
 * accurately is the point; being cited saying something we have since
 * corrected everywhere else would be worse than not being cited.
 */
export function keyFacts(now: Date = new Date()): string {
  const status = getMtdStatus(now);
  const regime = currentPenaltyRegime(now);
  const quarters = quartersForTaxYear(status.taxYearStart);
  const finalDec = finalDeclarationFor(status.taxYearStart);

  const lines: string[] = [
    '## Key facts: Making Tax Digital for Income Tax (MTD ITSA)',
    '',
    `_Stated as at ${now.toISOString().slice(0, 10)}. Source: HMRC. Figures are computed by EasyTax from the published rules, not transcribed._`,
    '',
    `- ${mandateSentence(status)}`,
    '- Qualifying income means **gross** self-employment turnover plus **gross** property income, added together, before any expenses are deducted.',
  ];

  lines.push(
    ...MTD_THRESHOLDS.map(
      t =>
        `- From 6 April ${t.from}, the qualifying-income threshold is £${t.threshold.toLocaleString('en-GB')}.`,
    ),
  );

  lines.push(
    '',
    `### Quarterly update deadlines, ${status.taxYear}`,
    '',
    ...quarters.map(q => `- ${q.key} (${q.periodLabel}): due **${q.deadlineLabel}**.`),
    `- Final Declaration for ${status.taxYear}: due **${finalDec.deadlineLabel}**.`,
  );

  if (status.dueQuarter) {
    lines.push(
      '',
      `The next quarterly update due is ${status.dueQuarter.key} of ${status.dueQuarter.taxYear}, covering ${status.dueQuarter.periodLabel}, on ${status.dueQuarter.deadlineLabel}.`,
    );
  }

  const ls = regime.lateSubmission;
  const lp = regime.latePayment;
  lines.push(
    '',
    `### Penalties, ${regime.taxYear}`,
    '',
    ls.quarterlyUpdatesEarnPoints
      ? `- A late quarterly update earns one penalty point. At ${ls.pointsThreshold} points a £${ls.chargeAtThresholdGbp} charge is issued, and again on every later miss.`
      : `- Late quarterly updates do **not** earn penalty points in ${regime.taxYear} — this is the first-year soft landing, and it applies to quarterly updates only.`,
    `- A late tax return earns a penalty point in every year, including ${SOFT_LANDING_TAX_YEAR}/${String(SOFT_LANDING_TAX_YEAR + 1).slice(-2)}. The soft landing does not cover it.`,
    `- Late payment: ${lp.firstPenaltyPct}% of the outstanding balance after ${lp.firstPenaltyAfterDays} days` +
      (lp.secondPenaltyAtDay && lp.secondPenaltyPct
        ? `, a further ${lp.secondPenaltyPct}% on anything still outstanding at day ${lp.secondPenaltyAtDay}`
        : '') +
      `, then interest accruing daily at an annualised ${lp.dailyPenaltyAnnualPct}% until it is cleared.`,
  );

  return lines.join('\n');
}

export type LlmsArticle = ArticleSummary & { content?: string };

/**
 * Published articles, newest first.
 *
 * `withContent` is what separates the index from the full-text file. Asking for
 * bodies costs roughly a hundred times the bytes, so the index — which is the
 * file most crawlers will actually fetch — never pays for them.
 *
 * Returns empty rather than throwing on a preview build with no Supabase
 * credentials, for the same reason the feeds do: an empty file is a valid file
 * and a 500 on a URL polled unattended is not.
 */
export async function publishedArticles(
  withContent: boolean,
  limit = FULL_TEXT_LIMIT,
): Promise<LlmsArticle[]> {
  if (!hasSupabaseEnv()) return [];

  const columns = withContent
    ? 'title, slug, excerpt, published_at, content'
    : 'title, slug, excerpt, published_at';

  // Over-fetched and then de-duplicated: an answer engine reading this index
  // should see each subject once. The archive had written the trading
  // allowance five times and VAT partial exemption three times, twice under a
  // byte-identical headline — listing all of them spends a model's fetch
  // budget on repetition and gives it three plausible citations for one fact.
  // See lib/article-clusters.ts.
  const { data } = await selectPublished(gated => {
    const q = supabase.from('tax_articles').select(columns);
    return (gated ? q.eq('review_status', 'published') : q)
      .order('published_at', { ascending: false })
      .limit(limit * 2);
  });

  const rows = (data ?? []) as unknown as LlmsArticle[];
  return (await withoutDuplicates(rows)).slice(0, limit);
}

/**
 * HTML to plain text, for the full-text file.
 *
 * The article bodies are stored as HTML fragments written by the daily cron and
 * sanitised by lib/article-quality. Handing that HTML to a model is wasteful
 * (tags are most of the tokens) and lossy in the way that matters (a `<h2>`
 * question and the paragraph answering it run together). So: block-level tags
 * become newlines, `<li>` becomes a bullet, everything else is dropped, and the
 * five HTML entities the cron can emit are decoded.
 *
 * `&amp;` is decoded last on purpose. Decoding it first would turn the literal
 * text `&amp;lt;` — which is how an article quotes an entity — into `<`.
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<\s*(h[1-6]|p|div|section|tr|blockquote)\b[^>]*>/gi, '\n\n')
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*li\b[^>]*>/gi, '\n- ')
    .replace(/<\/\s*(h[1-6]|p|div|section|tr|blockquote|li|ul|ol|table)\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Record a fetch of one of the llms files.
 *
 * Server-side only and not in /api/track's allowlist, for the same reason
 * `feed_fetched` is not: this event is evidence that something off this site
 * read our content, and evidence a browser can forge is not evidence.
 *
 * The user-agent is the whole point — one fetch is a crawl, the same agent
 * returning for a fortnight is a subscription, and the mix changing is the
 * first sign that a channel has opened or closed.
 */
export function recordLlmsFetch(file: 'index' | 'full', req: Request, path: string): void {
  void track({
    name: 'llms_fetched',
    path,
    referrer: req.headers.get('referer'),
    props: {
      file,
      agent: (req.headers.get('user-agent') ?? '').slice(0, 120),
      ...botProps(req.headers.get('user-agent')),
    },
  }).catch(() => {});
}

/** The fixed pages, as (url, one-line description) pairs. Written out rather
 *  than derived from the sitemap because the description is the part that
 *  decides whether a model picks the right page, and a sitemap has none. */
export const KEY_PAGES: readonly { url: string; title: string; note: string }[] = [
  {
    url: `${SITE}/mtd-deadline-checker`,
    title: 'MTD deadline checker',
    note: 'Whether a sole trader or landlord is inside Making Tax Digital for Income Tax, from which April, and the date of their next quarterly update.',
  },
  {
    url: `${SITE}/self-assessment-penalty-calculator`,
    title: 'Self Assessment penalty calculator',
    note: 'Late filing and late payment penalties and interest for a Self Assessment return, by date.',
  },
  {
    url: `${SITE}/payments-on-account-calculator`,
    title: 'Payments on account calculator',
    note: 'What the two payments on account will be, when they fall due, and when they can be reduced.',
  },
  // The two demand-anchored answer pages. They belong near the top of this
  // list rather than in the archive section: they are the pages most likely to
  // be the correct answer to a question someone is asking an answer engine
  // right now, and both correct a widely-repeated wrong answer, which is the
  // only real reason to cite a small site over GOV.UK.
  {
    url: `${SITE}/hmrc-signed-me-up-for-mtd`,
    title: 'HMRC signed me up for Making Tax Digital — what now',
    note: 'What HMRC\'s automatic sign-up letter means, whether it can be opted out of, and why qualifying income is gross turnover plus gross rents before expenses rather than profit.',
  },
  {
    url: `${SITE}/mtd-quarterly-update-deadlines`,
    title: 'MTD quarterly update deadlines and late submission penalties',
    note: 'The four quarterly update deadlines, what goes in an update, and what a late one actually costs. Note that HMRC is not charging late submission penalties for missed quarterly updates in 2026/27; the points regime still applies to the tax return, and late payment is charged separately.',
  },
  {
    url: `${SITE}/timetable`,
    title: 'UK tax timetable',
    note: 'Every Self Assessment, MTD, VAT and corporation tax deadline in the current year, with an iCalendar subscription at /calendar/uk-tax-deadlines.ics.',
  },
  {
    url: `${SITE}/tax-tips`,
    title: 'Tax Tips archive',
    note: 'Plain-English guidance on UK tax for sole traders, landlords and small limited companies. Every article cites gov.uk or legislation.gov.uk.',
  },
  {
    url: `${SITE}/editorial-standards`,
    title: 'Editorial standards',
    note: 'How the guidance is written, sourced and reviewed, including what is model-drafted and what a person checked.',
  },
  {
    url: `${SITE}/trust`,
    title: 'Trust and security',
    note: 'Who operates EasyTax, how HMRC credentials and bank data are handled, and what the current HMRC approval status is.',
  },
  {
    url: `${SITE}/pricing`,
    title: 'Pricing',
    note: 'What EasyTax costs and what is free.',
  },
];

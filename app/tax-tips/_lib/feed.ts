import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { hasSupabaseEnv, type ArticleSummary } from './articles';
import { selectPublished } from './review';
import { track } from '@/lib/analytics';
import { botProps } from '@/lib/bot-detection';
import { withoutDuplicates } from '@/lib/article-canonical';
import { keyFacts } from '@/lib/llms';

// Shared plumbing for the RSS and JSON feeds.
//
// Why the archive has a feed at all: there are 113 published articles and, on
// the last run, two search-referred visitors a week. Every distribution route
// the site has tried so far — sitemaps, IndexNow, internal linking — asks a
// search engine to come and get the content. A feed is the one route that lets
// something else carry it away: aggregators, newsletter tools, an accountant's
// reader, another site's "latest UK tax news" block. It also costs nothing to
// keep current, because the cron is already writing an article a day into it.

export const FEED_LIMIT = 50;

export const FEED_TITLE = 'EasyTax Tax Tips — UK tax guidance for sole traders and landlords';
export const FEED_DESCRIPTION =
  'Plain-English answers to the UK tax questions sole traders, landlords and small limited companies actually ask. Making Tax Digital, Self Assessment, expenses, VAT and corporation tax.';
export const SITE = 'https://easytax.vip';

/**
 * The channel description, with the dated MTD facts appended.
 *
 * The facts themselves are not new — `keyFacts()` shipped on 2026-09-17 in
 * `/llms.txt`, on the reasoning that the machines reading this site outnumber
 * its search visitors four to one and a short block of dates and thresholds is
 * what gets quoted in an answer.
 *
 * That reasoning was right and the file was wrong. Over the seven days to
 * 2026-09-18:
 *
 *   | surface        | fetches |
 *   |----------------|---------|
 *   | the feeds      |      69 |
 *   | the .ics       |      43 |
 *   | /llms.txt      |       1 |
 *   | /llms-full.txt |       0 |
 *
 * GPTBot fetched the feeds 14 times, meta-externalagent 10, OAI-SearchBot 2,
 * PerplexityBot 1. The block written to be quoted was put in the one file
 * almost nothing asks for, and the surface every crawler does ask for carried
 * a one-line blurb. This puts it where the fetches are.
 *
 * Computed per request from `lib/mtd-dates.ts` and friends — the same
 * functions the timetable and the deadline checker render from — so the feed
 * cannot state a threshold the site has since corrected. That property is the
 * whole reason it is safe to invite a model to quote it.
 */
export function feedDescription(now: Date = new Date()): string {
  return `${FEED_DESCRIPTION}\n\n${keyFacts(now)}`;
}

/**
 * How much of an article's body travels in the feed.
 *
 * The JSON feed shipped with `content_text` set to the excerpt and a comment
 * explaining why the body stays home: "syndicating the full body would hand a
 * scraper a clean copy of 113 pages we are trying to rank ourselves."
 *
 * That concern is real and this does not dismiss it — it splits the
 * difference. An answer engine deciding whether this page answers a question
 * needs more than a headline and two sentences; a scraper reproducing the
 * archive needs the whole thing. The lead section gives the first and not the
 * second, and every item still carries a canonical `url` back to the page.
 *
 * Widening this to the full body is a one-constant change if the owner decides
 * the citation is worth more than the copy. The numbers to decide on are
 * `distribution.feeds.by_agent` and referrals from chatgpt.com, perplexity.ai
 * and notebook.google.com, all of which the daily report already breaks out.
 */
/** Budget for the *body* portion. The excerpt is carried in full on top of it,
 *  so a lead item runs to roughly 1,600 characters against bodies that average
 *  641 words — about the first third of an article. */
export const LEAD_CHARS = 1200;

/**
 * The excerpt plus as much of the body as fits, cut at an element boundary.
 *
 * Cutting mid-tag would produce invalid HTML in a document other people parse,
 * so the cut is always taken at the last `</p>`, `</ul>`, `</ol>` or `</table>`
 * that fits. If none fits, only the excerpt travels — a short item is fine, a
 * malformed one is not.
 */
export function leadSection(excerpt: string, content: string): string {
  const lead = `<p>${escapeHtmlText(excerpt ?? '')}</p>`;
  const body = String(content ?? '');
  if (!body) return lead;

  const window = body.slice(0, LEAD_CHARS);
  const end = Math.max(
    window.lastIndexOf('</p>'),
    window.lastIndexOf('</ul>'),
    window.lastIndexOf('</ol>'),
    window.lastIndexOf('</table>'),
  );
  if (end < 0) return lead;

  const close = window.indexOf('>', end);
  return `${lead}\n${window.slice(0, close + 1)}`;
}

/** Text going into an HTML string we build ourselves. The excerpt is model
 *  written and stored raw, so it can contain `&` or `<`. */
function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Most recent published articles, newest first. Empty on a preview build with
 *  no Supabase credentials — an empty feed is a valid feed, and better than a
 *  500 on a URL that readers poll unattended.
 *
 *  Duplicates are dropped. The 2026-09-16 round found the feeds are this
 *  site's largest real audience — 66 fetches in seven days, of which GPTBot 14,
 *  meta-externalagent 10 and OAI-SearchBot 2, against 95 human page views — and
 *  the archive they were being handed contained the trading allowance five
 *  times. Sending an answer engine the same guidance under three headlines does
 *  not make it three times as likely to be cited; it spends our one channel
 *  that is actually growing on repetition. See lib/article-clusters.ts. */
export type FeedArticle = ArticleSummary & {
  /** The body, for `leadSection`. Absent on the ungated fallback path is not
   *  possible — it is selected alongside the rest — but it can be empty. */
  content: string;
};

export async function recentArticles(limit = FEED_LIMIT): Promise<FeedArticle[]> {
  if (!hasSupabaseEnv()) return [];

  // Over-fetch, then de-duplicate, so that dropping duplicates shortens the
  // feed's reach into the archive rather than the feed itself — asking for 50
  // and filtering would have returned fewer than 50 items.
  const { data } = await selectPublished(gated => {
    const q = supabase.from('tax_articles').select('title, slug, excerpt, published_at, content');
    return (gated ? q.eq('review_status', 'published') : q)
      .order('published_at', { ascending: false })
      .limit(limit * 2);
  });

  const rows = (data ?? []) as FeedArticle[];
  return (await withoutDuplicates(rows)).slice(0, limit);
}

/** The five characters that are not legal as raw text in XML content or in an
 *  attribute value. Everything the cron writes goes through here — an article
 *  title containing "M&S" or a quotation mark would otherwise produce a feed
 *  no reader can parse, and a feed that fails to parse fails silently. */
export function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Record a feed fetch.
 *
 * A subscription is not a single request, it is the same reader coming back —
 * so what makes this readable is the user-agent repeating over days. Recorded
 * server-side only: nothing in a browser should be able to claim a
 * subscription that did not happen.
 */
export function recordFetch(format: 'rss' | 'json', req: Request, path: string): void {
  void track({
    name: 'feed_fetched',
    path,
    referrer: req.headers.get('referer'),
    props: {
      format,
      agent: (req.headers.get('user-agent') ?? '').slice(0, 120),
      ...botProps(req.headers.get('user-agent')),
    },
  }).catch(() => {});
}

/** Feeds are polled unattended, often hourly. Cache hard enough that a popular
 *  reader cannot turn into a Supabase bill, loosely enough that a new article
 *  shows up the same morning it publishes. */
export const FEED_CACHE = 'public, max-age=1800, s-maxage=3600';

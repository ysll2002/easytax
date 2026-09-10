import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { hasSupabaseEnv, type ArticleSummary } from './articles';
import { selectPublished } from './review';
import { track } from '@/lib/analytics';

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

/** Most recent published articles, newest first. Empty on a preview build with
 *  no Supabase credentials — an empty feed is a valid feed, and better than a
 *  500 on a URL that readers poll unattended. */
export async function recentArticles(limit = FEED_LIMIT): Promise<ArticleSummary[]> {
  if (!hasSupabaseEnv()) return [];

  const { data } = await selectPublished(gated => {
    const q = supabase.from('tax_articles').select('title, slug, excerpt, published_at');
    return (gated ? q.eq('review_status', 'published') : q)
      .order('published_at', { ascending: false })
      .limit(limit);
  });

  return (data ?? []) as ArticleSummary[];
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
    },
  }).catch(() => {});
}

/** Feeds are polled unattended, often hourly. Cache hard enough that a popular
 *  reader cannot turn into a Supabase bill, loosely enough that a new article
 *  shows up the same morning it publishes. */
export const FEED_CACHE = 'public, max-age=1800, s-maxage=3600';

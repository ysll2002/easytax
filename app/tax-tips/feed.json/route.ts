import { NextResponse } from 'next/server';
import {
  recentArticles,
  recordFetch,
  FEED_TITLE,
  FEED_DESCRIPTION,
  FEED_CACHE,
  SITE,
} from '../_lib/feed';

// JSON Feed 1.1 — https://jsonfeed.org/version/1.1
//
// The same archive as feed.xml, in the format the newer readers and most
// no-code automation tools (Zapier, Make, n8n) accept without an XML parser.
// It costs one small route and removes the "we only speak RSS" excuse for not
// picking the content up.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const articles = await recentArticles();
  recordFetch('json', req, '/tax-tips/feed.json');

  return NextResponse.json(
    {
      version: 'https://jsonfeed.org/version/1.1',
      title: FEED_TITLE,
      description: FEED_DESCRIPTION,
      home_page_url: `${SITE}/tax-tips`,
      feed_url: `${SITE}/tax-tips/feed.json`,
      language: 'en-GB',
      authors: [{ name: 'EasyTax editorial team', url: `${SITE}/editorial-standards` }],
      items: articles.map(a => ({
        id: `${SITE}/tax-tips/${a.slug}`,
        url: `${SITE}/tax-tips/${a.slug}`,
        title: a.title,
        summary: a.excerpt ?? '',
        // No `content_html`: the excerpt answers the question and the article
        // is one click away. Syndicating the full body would hand a scraper a
        // clean copy of 113 pages we are trying to rank ourselves.
        content_text: a.excerpt ?? '',
        date_published: new Date(a.published_at).toISOString(),
      })),
    },
    {
      headers: {
        'Content-Type': 'application/feed+json; charset=utf-8',
        'Cache-Control': FEED_CACHE,
      },
    },
  );
}

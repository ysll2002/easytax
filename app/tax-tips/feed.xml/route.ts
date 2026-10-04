import { NextResponse } from 'next/server';
import {
  recentArticles,
  recordFetch,
  xmlEscape,
  FEED_TITLE,
  FEED_DESCRIPTION,
  FEED_CACHE,
  SITE,
} from '../_lib/feed';

// RSS 2.0 for the Tax Tips archive.
//
// Not under /api, for the same reason the .ics calendar is not: robots.ts
// disallows that prefix, and a feed that Google will not fetch cannot be
// discovered through it.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FEED_URL = `${SITE}/tax-tips/feed.xml`;

/** RFC 822, which is what RSS 2.0 requires — not ISO 8601. Readers that
 *  encounter an ISO date here variously show the wrong date, show no date, or
 *  drop the item. */
function rfc822(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

export async function GET(req: Request) {
  const articles = await recentArticles();
  recordFetch('rss', req, '/tax-tips/feed.xml');

  const items = articles
    .map(a => {
      const url = `${SITE}/tax-tips/${a.slug}`;
      return `    <item>
      <title>${xmlEscape(a.title)}</title>
      <link>${xmlEscape(url)}</link>
      <guid isPermaLink="true">${xmlEscape(url)}</guid>
      <pubDate>${rfc822(a.published_at)}</pubDate>
      <description>${xmlEscape(a.excerpt ?? '')}</description>
    </item>`;
    })
    .join('\n');

  // `atom:link rel="self"` is required by the RSS validator and is what lets a
  // reader that was handed the feed's contents work out where to poll next.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(FEED_TITLE)}</title>
    <link>${SITE}/tax-tips</link>
    <description>${xmlEscape(FEED_DESCRIPTION)}</description>
    <language>en-gb</language>
    <lastBuildDate>${articles[0] ? rfc822(articles[0].published_at) : new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': FEED_CACHE,
    },
  });
}

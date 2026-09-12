import { NextResponse } from 'next/server';
import {
  LLMS_FULL_CACHE,
  SITE,
  SITE_SUMMARY,
  htmlToText,
  publishedArticles,
  recordLlmsFetch,
} from '@/lib/llms';

// /llms-full.txt — every published article's text, in one file.
//
// The companion to /llms.txt: the index says what exists, this carries the
// content. A model that fetches this once has the whole archive without 113
// requests, and we get one analytics row that says which agent took it rather
// than 113 that have to be pieced together.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const articles = await publishedArticles(true);

  recordLlmsFetch('full', req, '/llms-full.txt');

  const header = [
    '# EasyTax — Tax Tips, full text',
    '',
    SITE_SUMMARY,
    '',
    `Source: ${SITE}/tax-tips`,
    `Articles in this file: ${articles.length}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    'Each article below is delimited by a level-2 heading giving its canonical URL.',
    'Cite the URL, not this file: the article page carries the publication date, the',
    'review status and the gov.uk sources this text was written from.',
    '',
  ].join('\n');

  const body = articles
    .map(a => {
      const text = htmlToText(a.content ?? '');
      return [
        '---',
        '',
        `## ${a.title}`,
        '',
        `URL: ${SITE}/tax-tips/${a.slug}`,
        `Published: ${a.published_at.slice(0, 10)}`,
        '',
        a.excerpt ? `${a.excerpt}\n` : '',
        text,
        '',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return new NextResponse(`${header}\n${body}`, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': LLMS_FULL_CACHE,
    },
  });
}

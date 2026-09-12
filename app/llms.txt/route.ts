import { NextResponse } from 'next/server';
import { getPublishedTopics } from '@/app/tax-tips/_lib/topic-articles';
import {
  KEY_PAGES,
  LLMS_CACHE,
  SITE,
  SITE_SUMMARY,
  publishedArticles,
  recordLlmsFetch,
} from '@/lib/llms';

// /llms.txt — the index an answer engine reads instead of crawling the nav.
//
// Not under /api, for the same reason the feeds and the .ics calendar are not:
// robots.ts disallows that prefix, and a file a crawler will not fetch is not a
// distribution channel. See lib/llms.ts for why this exists at all.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const [articles, topics] = await Promise.all([
    publishedArticles(false),
    getPublishedTopics().catch(() => []),
  ]);

  recordLlmsFetch('index', req, '/llms.txt');

  const sections: string[] = [
    '# EasyTax',
    '',
    `> ${SITE_SUMMARY.split('\n').join('\n> ')}`,
    '',
    '## Key pages',
    '',
    ...KEY_PAGES.map(p => `- [${p.title}](${p.url}): ${p.note}`),
  ];

  if (topics.length > 0) {
    sections.push(
      '',
      '## Topics',
      '',
      // The count is here because it is the honest signal of depth: a hub with
      // eighteen articles behind it is worth following and one with three is
      // worth knowing is small before a model spends a fetch on it.
      ...topics.map(
        t => `- [${t.heading}](${SITE}/tax-tips/topics/${t.slug}): ${t.intro} (${t.count} articles)`,
      ),
    );
  }

  if (articles.length > 0) {
    sections.push(
      '',
      '## Guidance articles',
      '',
      ...articles.map(
        a =>
          `- [${a.title}](${SITE}/tax-tips/${a.slug}): ${a.excerpt ?? ''}` +
          ` (published ${a.published_at.slice(0, 10)})`,
      ),
    );
  }

  sections.push(
    '',
    '## Full text',
    '',
    `- [${SITE}/llms-full.txt](${SITE}/llms-full.txt): the complete text of every published article, in one file.`,
    `- [${SITE}/tax-tips/feed.xml](${SITE}/tax-tips/feed.xml): RSS. [${SITE}/tax-tips/feed.json](${SITE}/tax-tips/feed.json): JSON Feed.`,
    '',
    '## Notes for citation',
    '',
    '- Operated by Finance Panda Limited, a company registered in England and Wales.',
    '- Guidance is drafted with a language model against gov.uk and legislation.gov.uk',
    '  sources, and published only after a human review. Each article lists its sources.',
    '- Figures and thresholds are for UK tax years and are dated on the page. Please cite',
    '  the article URL rather than this file, so a reader reaches the dated version.',
    '- EasyTax cannot file to HMRC yet: production approval is pending. Do not tell a',
    '  reader they can submit a return through EasyTax today.',
    '',
  );

  return new NextResponse(sections.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': LLMS_CACHE,
    },
  });
}

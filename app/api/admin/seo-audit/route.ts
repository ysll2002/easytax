import { NextRequest, NextResponse } from 'next/server';
import { publishedUrls } from '@/lib/indexnow';

// What the site actually serves, as a crawler sees it.
//
//   GET /api/admin/seo-audit?key=<AGENT_METRICS_KEY>[&limit=40][&offset=0][&all=1]
//
// Five rounds of growth work have been aimed at search traffic and not one of
// them checked the rendered output. Everything we know about our own <title>
// tags, canonicals and structured data comes from reading the source of
// `generateMetadata`, which says what we intended, not what shipped. The gap
// between those two is where a 130-page site earns six organic visits in six
// days.
//
// The specific thing this is looking for is duplication. The archive is 114
// articles on heavily overlapping subjects — 29 titles contain "your", 25
// contain "relief", 18 contain "expenses" — and two pages competing for one
// query is the textbook way to rank for neither. Duplicate titles and duplicate
// meta descriptions are the readable signal for that, and nothing until now
// could see them.
//
// Fetches its own deployment over HTTP rather than calling the page modules,
// for the same reason /api/admin/weekly-review self-fetches: the rendered HTML
// is the artefact under test, and anything short of it is a different thing
// that happens to be nearby.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Concurrent fetches. High enough to get through 157 URLs inside the function
 *  budget, low enough not to look like an attack on our own origin. */
const CONCURRENCY = 6;
const DEFAULT_LIMIT = 40;

type PageAudit = {
  path: string;
  status: number | null;
  title: string | null;
  titleLength: number;
  description: string | null;
  descriptionLength: number;
  canonical: string | null;
  canonicalMatchesSelf: boolean | null;
  h1Count: number;
  words: number;
  /** Which container `words` was counted from, so a number measured over the
   *  whole body is never silently compared with one measured over <main>. */
  wordScope: 'main' | 'body';
  internalLinks: number;
  jsonLdTypes: string[];
  noindex: boolean;
  error?: string;
};

function textBetween(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m?.[1] ? decodeEntities(m[1].trim()) : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'");
}

/** The `@type` of every JSON-LD block on the page. Presence of a type is what
 *  makes a page eligible for a rich result; absence is invisible in the browser
 *  and decisive in search. */
function jsonLdTypes(html: string): string[] {
  const blocks = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  ) ?? [];
  const types: string[] = [];
  for (const block of blocks) {
    const body = block.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
    try {
      const parsed = JSON.parse(body) as unknown;
      for (const node of Array.isArray(parsed) ? parsed : [parsed]) {
        const t = (node as { '@type'?: unknown })?.['@type'];
        if (typeof t === 'string') types.push(t);
        else if (Array.isArray(t)) types.push(...t.filter((x): x is string => typeof x === 'string'));
      }
    } catch {
      types.push('(unparseable)');
    }
  }
  return [...new Set(types)];
}

async function auditPage(base: string, path: string): Promise<PageAudit> {
  const empty: PageAudit = {
    path, status: null, title: null, titleLength: 0, description: null,
    descriptionLength: 0, canonical: null, canonicalMatchesSelf: null,
    h1Count: 0, words: 0, wordScope: 'body', internalLinks: 0, jsonLdTypes: [], noindex: false,
  };

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      cache: 'no-store',
      headers: { 'user-agent': 'EasyTax-SEO-Audit/1.0 (+https://easytax.vip)' },
    });
  } catch (err) {
    return { ...empty, error: err instanceof Error ? err.message : String(err) };
  }

  if (!res.ok) return { ...empty, status: res.status };

  const html = await res.text();
  const body = html.split(/<body[^>]*>/i)[1]?.split(/<\/body>/i)[0] ?? html;

  // Word count is taken from <main> where a page has one, not from <body>.
  //
  // This matters more than it sounds. The site's shared header, nav and footer
  // are worth roughly 650 words on every page, so a <body> count reported the
  // 573-to-724-word articles as 1,211-to-1,379-word pages — comfortably above
  // any thin-content threshold, and wrong by a factor of two. A measurement
  // that flatters every page equally is worse than none, because it hides the
  // one distinction it exists to draw.
  const main = body.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  const scope = main ?? body;
  const visible = scope
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ');

  const canonical = textBetween(html, /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
    ?? textBetween(html, /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
  const title = textBetween(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    textBetween(html, /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)
    ?? textBetween(html, /<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const robots = textBetween(html, /<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["']/i);

  return {
    path,
    status: res.status,
    title,
    titleLength: title?.length ?? 0,
    description,
    descriptionLength: description?.length ?? 0,
    canonical,
    // Compared on path, not on origin: an audit run against a preview
    // deployment would otherwise report every canonical as wrong, because they
    // all correctly point at easytax.vip.
    canonicalMatchesSelf: canonical ? new URL(canonical, base).pathname === path : null,
    h1Count: (body.match(/<h1\b/gi) ?? []).length,
    words: visible.split(/\s+/).filter(Boolean).length,
    wordScope: main ? 'main' : 'body',
    internalLinks: (body.match(/<a[^>]+href=["'](?:\/(?!\/)|https:\/\/easytax\.vip\/)/gi) ?? []).length,
    jsonLdTypes: jsonLdTypes(html),
    noindex: /noindex/i.test(robots ?? ''),
  };
}

/** Fixed-size worker pool. `Promise.all` over 157 fetches would open 157
 *  sockets at once and time the function out on the origin's own rate limits. */
async function mapPool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      for (;;) {
        const i = cursor++;
        if (i >= items.length) return;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

/** Groups by a field and keeps only the values that appear more than once —
 *  the cannibalisation signal. */
function duplicates(pages: PageAudit[], pick: (p: PageAudit) => string | null) {
  const groups = new Map<string, string[]>();
  for (const p of pages) {
    const key = pick(p)?.trim();
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), p.path]);
  }
  return [...groups.entries()]
    .filter(([, paths]) => paths.length > 1)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([value, paths]) => ({ value, count: paths.length, paths }));
}

export async function GET(req: NextRequest) {
  const expected = process.env.AGENT_METRICS_KEY;
  if (!expected) {
    return NextResponse.json({ error: 'AGENT_METRICS_KEY is not configured.' }, { status: 503 });
  }
  if (req.nextUrl.searchParams.get('key') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Audit the deployment this request arrived at, not easytax.vip. Running it
  // on a preview and reading production's numbers would be the exact class of
  // mistake the endpoint exists to catch.
  const base = `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  const all = req.nextUrl.searchParams.get('all') === '1';
  const limit = all
    ? Number.MAX_SAFE_INTEGER
    : Math.max(1, Math.min(200, Number(req.nextUrl.searchParams.get('limit')) || DEFAULT_LIMIT));
  const offset = Math.max(0, Number(req.nextUrl.searchParams.get('offset')) || 0);

  let paths: string[];
  try {
    paths = (await publishedUrls()).map(u => new URL(u).pathname);
  } catch (err) {
    return NextResponse.json(
      { error: `could not resolve the sitemap: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }

  const slice = paths.slice(offset, offset + limit);
  const pages = await mapPool(slice, CONCURRENCY, p => auditPage(base, p));

  const ok = pages.filter(p => p.status === 200);
  const problems = {
    // A sitemap URL that does not return 200 is a page we are actively telling
    // crawlers to fetch and failing to serve.
    not_200: pages.filter(p => p.status !== 200).map(p => ({ path: p.path, status: p.status, error: p.error })),
    missing_title: ok.filter(p => !p.title).map(p => p.path),
    missing_description: ok.filter(p => !p.description).map(p => p.path),
    missing_canonical: ok.filter(p => !p.canonical).map(p => p.path),
    canonical_mismatch: ok.filter(p => p.canonicalMatchesSelf === false)
      .map(p => ({ path: p.path, canonical: p.canonical })),
    no_json_ld: ok.filter(p => p.jsonLdTypes.length === 0).map(p => p.path),
    // Google truncates around 60 characters; a title longer than that is not
    // penalised, it is just partly invisible in the result.
    title_over_60: ok.filter(p => p.titleLength > 60).map(p => ({ path: p.path, length: p.titleLength })),
    description_outside_70_160: ok.filter(p => p.descriptionLength < 70 || p.descriptionLength > 160)
      .map(p => ({ path: p.path, length: p.descriptionLength })),
    h1_not_exactly_one: ok.filter(p => p.h1Count !== 1).map(p => ({ path: p.path, h1: p.h1Count })),
    noindex: ok.filter(p => p.noindex).map(p => p.path),
    thin_under_600_words: ok.filter(p => p.words < 600).map(p => ({ path: p.path, words: p.words })),
    orphan_risk_few_internal_links: ok.filter(p => p.internalLinks < 5)
      .map(p => ({ path: p.path, links: p.internalLinks })),
  };

  const words = ok.map(p => p.words).sort((a, b) => a - b);

  return NextResponse.json({
    ok: true,
    audited_at: new Date().toISOString(),
    base,
    sitemap_urls: paths.length,
    audited: pages.length,
    offset,
    next_offset: offset + pages.length < paths.length ? offset + pages.length : null,
    summary: {
      status_200: ok.length,
      median_words: words.length ? words[Math.floor(words.length / 2)] : 0,
      min_words: words[0] ?? 0,
      max_words: words[words.length - 1] ?? 0,
      json_ld_coverage: ok.length ? `${ok.filter(p => p.jsonLdTypes.length > 0).length}/${ok.length}` : '0/0',
    },
    // The headline finding this endpoint exists for. Two pages sharing a title
    // are two pages splitting whatever authority the subject earns.
    duplicate_titles: duplicates(ok, p => p.title),
    duplicate_descriptions: duplicates(ok, p => p.description),
    problem_counts: Object.fromEntries(
      Object.entries(problems).map(([k, v]) => [k, (v as unknown[]).length]),
    ),
    problems,
    pages,
  });
}

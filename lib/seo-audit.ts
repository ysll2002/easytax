// What the site actually serves, as a crawler sees it.
//
// This was `/api/admin/seo-audit` and only that: an endpoint you had to know
// about, find a secret for, and call by hand. It was written on 2026-09-09
// and, by 2026-09-14, had never been run. In that window it would have found
// that 119 of 158 pages ended their title `| EasyTax | EasyTax` and that 150
// of 158 titles were past the length Google displays — on a site whose entire
// growth programme was aimed at organic search.
//
// That is the same shape of failure as the 2026-09-06 review gate (a control
// with no number behind it) and the 2026-09-11 deployment drift (no way to ask
// what is live). The fix is the same one: the check runs on a schedule and its
// result appears in the daily metrics whether or not anyone asks.
//
// So the logic lives here, and has two callers:
//   - `/api/admin/seo-audit` for the full per-page report, on demand
//   - `/api/cron/daily`, which runs it over the whole sitemap and stores the
//     compact summary in the day's `growth_snapshots` row
//
// Nothing here is Next-specific, so it is testable without a request.

/** Concurrent fetches: high enough to get through ~160 URLs inside the cron's
 *  budget, low enough not to look like an attack on our own origin. */
export const CONCURRENCY = 6;

/** Google renders about 60 characters of title and 160 of description. */
export const TITLE_MAX = 60;
export const DESC_MIN = 70;
export const DESC_MAX = 160;

export type PageAudit = {
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

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    // Last: an &amp;lt; in the source must not become a real '<'.
    .replace(/&amp;/g, '&');
}

function textBetween(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m?.[1] ? decodeEntities(m[1].trim()) : null;
}

/** The `@type` of every JSON-LD block on the page. Presence of a type is what
 *  makes a page eligible for a rich result; absence is invisible in the browser
 *  and decisive in search. */
export function jsonLdTypes(html: string): string[] {
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

/**
 * The defect found on 2026-09-14: a page title carrying the brand more than
 * once, because a route appended `| EasyTax` to a title the root layout's
 * template was already going to suffix.
 *
 * Tested on the rendered tag rather than on the source, which is the only
 * place the two halves meet — reading `generateMetadata` tells you what was
 * intended, and the whole point of this file is that the two had diverged on
 * 119 pages for months.
 */
export function brandRepeats(title: string | null): number {
  if (!title) return 0;
  return (title.match(/EasyTax/gi) ?? []).length;
}

export async function auditPage(base: string, path: string): Promise<PageAudit> {
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

/** Fixed-size worker pool. `Promise.all` over ~160 fetches would open 160
 *  sockets at once and time the function out on the origin's own rate limits. */
export async function mapPool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
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
export function duplicates(pages: PageAudit[], pick: (p: PageAudit) => string | null) {
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

export function analyse(pages: PageAudit[]) {
  const ok = pages.filter(p => p.status === 200);

  const problems = {
    // A sitemap URL that does not return 200 is a page we are actively telling
    // crawlers to fetch and failing to serve.
    not_200: pages.filter(p => p.status !== 200).map(p => ({ path: p.path, status: p.status, error: p.error })),
    // The 2026-09-14 defect, kept as a named check so its return is loud.
    brand_repeated_in_title: ok.filter(p => brandRepeats(p.title) > 1)
      .map(p => ({ path: p.path, title: p.title })),
    missing_title: ok.filter(p => !p.title).map(p => p.path),
    missing_description: ok.filter(p => !p.description).map(p => p.path),
    missing_canonical: ok.filter(p => !p.canonical).map(p => p.path),
    canonical_mismatch: ok.filter(p => p.canonicalMatchesSelf === false)
      .map(p => ({ path: p.path, canonical: p.canonical })),
    no_json_ld: ok.filter(p => p.jsonLdTypes.length === 0).map(p => p.path),
    // Google truncates around 60 characters; a title longer than that is not
    // penalised, it is just partly invisible in the result.
    title_over_60: ok.filter(p => p.titleLength > TITLE_MAX).map(p => ({ path: p.path, length: p.titleLength })),
    description_outside_70_160: ok.filter(p => p.descriptionLength < DESC_MIN || p.descriptionLength > DESC_MAX)
      .map(p => ({ path: p.path, length: p.descriptionLength })),
    h1_not_exactly_one: ok.filter(p => p.h1Count !== 1).map(p => ({ path: p.path, h1: p.h1Count })),
    // In the sitemap and asking not to be indexed. Both instructions are ours
    // and they contradict each other, so a crawler resolves it however it
    // likes — which is not a thing to leave to chance on a 158-page site.
    noindex_but_in_sitemap: ok.filter(p => p.noindex).map(p => p.path),
    thin_under_600_words: ok.filter(p => p.words < 600).map(p => ({ path: p.path, words: p.words })),
    orphan_risk_few_internal_links: ok.filter(p => p.internalLinks < 5)
      .map(p => ({ path: p.path, links: p.internalLinks })),
  };

  const words = ok.map(p => p.words).sort((a, b) => a - b);
  const titles = ok.map(p => p.titleLength).sort((a, b) => a - b);

  return {
    summary: {
      status_200: ok.length,
      median_words: words.length ? words[Math.floor(words.length / 2)] : 0,
      min_words: words[0] ?? 0,
      max_words: words[words.length - 1] ?? 0,
      median_title_length: titles.length ? titles[Math.floor(titles.length / 2)] : 0,
      json_ld_coverage: ok.length ? `${ok.filter(p => p.jsonLdTypes.length > 0).length}/${ok.length}` : '0/0',
    },
    // The headline finding this exists for. Two pages sharing a title are two
    // pages splitting whatever authority the subject earns.
    duplicate_titles: duplicates(ok, p => p.title),
    duplicate_descriptions: duplicates(ok, p => p.description),
    problems,
    problem_counts: Object.fromEntries(
      Object.entries(problems).map(([k, v]) => [k, (v as unknown[]).length]),
    ) as Record<keyof typeof problems, number>,
  };
}

export type SeoAnalysis = ReturnType<typeof analyse>;

/**
 * The version that goes in `daily-metrics`.
 *
 * Counts and a short list of offenders, never the 158-page body: the metrics
 * payload is read by a person and by the daily agent run, and a report nobody
 * can scroll to the end of is a report nobody reads. `worst_*` carries enough
 * to act on without opening the full endpoint.
 */
export function compactSummary(base: string, urlCount: number, analysis: SeoAnalysis) {
  const { problem_counts, duplicate_titles, duplicate_descriptions, summary } = analysis;

  // Ordered by how much each actually costs us, not alphabetically. A 404 in
  // the sitemap or a doubled brand outranks a short meta description.
  const blocking =
    problem_counts.not_200 +
    problem_counts.brand_repeated_in_title +
    problem_counts.missing_title +
    problem_counts.missing_canonical +
    problem_counts.canonical_mismatch +
    problem_counts.noindex_but_in_sitemap +
    duplicate_titles.reduce((n, d) => n + d.count, 0);

  return {
    audited_at: new Date().toISOString(),
    base,
    sitemap_urls: urlCount,
    audited: summary.status_200,
    /** The number to watch. Zero is achievable and today it is not zero. */
    blocking_issues: blocking,
    median_title_length: summary.median_title_length,
    json_ld_coverage: summary.json_ld_coverage,
    problem_counts,
    duplicate_titles: duplicate_titles.slice(0, 5).map(d => ({ title: d.value, paths: d.paths })),
    duplicate_descriptions: duplicate_descriptions.slice(0, 5).map(d => ({ count: d.count, paths: d.paths })),
    worst_offenders: {
      not_200: analysis.problems.not_200.slice(0, 10),
      brand_repeated_in_title: analysis.problems.brand_repeated_in_title.slice(0, 5),
      noindex_but_in_sitemap: analysis.problems.noindex_but_in_sitemap.slice(0, 10),
      canonical_mismatch: analysis.problems.canonical_mismatch.slice(0, 10),
    },
  };
}

export type SeoSummary = ReturnType<typeof compactSummary>;

/** Crawl and analyse. The one entry point a caller needs. */
export async function runSeoAudit(base: string, paths: string[]): Promise<{
  pages: PageAudit[];
  analysis: SeoAnalysis;
  summary: SeoSummary;
}> {
  const pages = await mapPool(paths, CONCURRENCY, p => auditPage(base, p));
  const analysis = analyse(pages);
  return { pages, analysis, summary: compactSummary(base, paths.length, analysis) };
}

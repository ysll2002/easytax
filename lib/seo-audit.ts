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

  /** `@graph` is how JSON-LD expresses several linked entities in one block,
   *  and it is what `lib/site-entity.ts` emits from the root layout —
   *  Organization, WebSite and SoftwareApplication, cross-referenced by `@id`.
   *  Reading only the top-level `@type` made every page carrying that graph
   *  look like a page carrying no structured data at all: the four pages with
   *  no markup of their own would have been reported as `no_json_ld` the
   *  morning the entity graph shipped, and `json_ld_coverage` would have
   *  fallen from 156/156 for a change that added entities rather than
   *  removing them. Nested one level, which is all the spec's `@graph` is. */
  const collect = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    const t = (node as { '@type'?: unknown })['@type'];
    if (typeof t === 'string') types.push(t);
    else if (Array.isArray(t)) types.push(...t.filter((x): x is string => typeof x === 'string'));

    const graph = (node as { '@graph'?: unknown })['@graph'];
    if (Array.isArray(graph)) for (const child of graph) collect(child);
  };

  for (const block of blocks) {
    const body = block.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
    try {
      const parsed = JSON.parse(body) as unknown;
      for (const node of Array.isArray(parsed) ? parsed : [parsed]) collect(node);
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

/** The title with any trailing ` | EasyTax` removed, however many there are. */
export function withoutBrandSuffix(title: string): string {
  let out = title.trim();
  for (;;) {
    const next = out.replace(/\s*[|–—-]\s*EasyTax\s*$/i, '').trim();
    if (next === out) return out;
    out = next;
  }
}

/**
 * A title that is only too long because it is carrying the brand.
 *
 * `lib/seo-meta.ts` has done the right thing since 2026-09-14: it appends
 * ` | EasyTax` when the result still fits in the display budget and drops it
 * when it does not. The catch is that a route has to *call* it. Ten routes
 * never did, so the root layout's `title.template` appended the brand for
 * them — unconditionally, budget or no budget — and four public pages went out
 * at 64–70 characters where dropping seven characters of brand they do not
 * need would have left every one of them inside 60.
 *
 * Named as its own check rather than folded into `title_over_60` because the
 * two want opposite responses. An over-long headline is an editorial problem
 * and is left whole on purpose. This is a route that is not wired to the
 * helper, it is fixable to zero, and it is the failure that comes back the
 * next time somebody adds a page — which is the argument for having a number
 * that goes up when it does.
 */
export function brandPushedOverBudget(title: string | null): boolean {
  if (!title || title.length <= TITLE_MAX) return false;
  const bare = withoutBrandSuffix(title);
  return bare !== title && bare.length <= TITLE_MAX;
}

/** The origin the public actually reads. Every canonical, every sitemap entry
 *  and every IndexNow submission on this site names it. */
export const PUBLIC_ORIGIN = 'https://easytax.vip';

/**
 * Which origin a crawl should fetch.
 *
 * The 2026-09-14 round moved this crawl into the daily cron so it would stop
 * being a thing somebody had to remember to run. It then ran, every morning,
 * against `https://easytax-h9sul77b4-….vercel.app` — the deployment URL the
 * cron request arrives at, which sits behind Vercel's deployment protection.
 * Every one of the 156 fetches returned Vercel's login page with a 200, and
 * the crawl dutifully reported 156 canonical mismatches, 156 missing
 * descriptions, 156 thin pages and a confident `blocking_issues: 312`. None of
 * it was about this site.
 *
 * So in production the crawl goes to the public origin, which is the artefact
 * under test and the only host whose HTML a search engine will ever see.
 * Anywhere else it stays on the deployment it was asked from, because that is
 * the point of running it against a preview.
 */
export function auditBase(requestOrigin: string): string {
  return process.env.VERCEL_ENV === 'production' ? PUBLIC_ORIGIN : requestOrigin;
}

/**
 * Whether the crawl reached this site at all, and what it hit if not.
 *
 * A login wall, an SSO interstitial or a parked domain answers 200 with
 * perfectly well-formed HTML, so every check in `analyse` runs happily and
 * every count comes back wrong in the same direction. The tell is the
 * canonical: our pages name `easytax.vip` (or, on a preview, their own
 * deployment), and an interstitial names whoever is serving it.
 *
 * Returns a reason when the crawl is looking at somebody else's pages, and
 * null when it is looking at ours. Deliberately needs a majority rather than
 * one page: a single stray canonical is a bug on that page, which is a finding
 * the audit should report, not a reason to throw the whole run away.
 */
export function crawlWall(base: string, pages: PageAudit[]): string | null {
  const ok = pages.filter(p => p.status === 200 && p.canonical);
  if (ok.length === 0) return null;

  const ours = new Set([new URL(base).origin, PUBLIC_ORIGIN]);
  const foreign = ok.filter(p => {
    try {
      return !ours.has(new URL(p.canonical!, base).origin);
    } catch {
      return false;
    }
  });
  if (foreign.length * 2 <= ok.length) return null;

  const host = (() => {
    try { return new URL(foreign[0].canonical!, base).origin; } catch { return 'an unknown origin'; }
  })();
  return (
    `${foreign.length} of ${ok.length} crawled pages canonicalise to ${host} rather than to us — ` +
    `${base} is serving somebody else's HTML (deployment protection, an SSO wall or a redirect), ` +
    'so no number from this crawl is about this site'
  );
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
    // The 2026-09-15 defect: a route that never went through `pageTitle`, so
    // the layout template appended a brand the title had no room for.
    brand_pushed_title_over_budget: ok.filter(p => brandPushedOverBudget(p.title))
      .map(p => ({ path: p.path, title: p.title, length: p.titleLength })),
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
    problem_counts.brand_pushed_title_over_budget +
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
    // Which pages, not just how many.
    //
    // Until 2026-09-18 this listed five categories and every one of them was
    // empty, while the three that were not — 80 titles over budget, 23
    // descriptions outside the usable range, 7 pages under 600 words — were
    // reported as bare integers with no way to learn which pages they were.
    // The report named only the problems it did not have.
    //
    // That is the seventh instance in this project of a control existing and
    // the number that would show it misfiring not being reported. It is also
    // why "80" sat in the payload for four days without anybody being able to
    // act on it: acting on it required a crawl of your own.
    //
    // Sorted worst-first within each category and capped, because the payload
    // is read by a person and a list nobody scrolls to the end of is a list
    // nobody reads.
    worst_offenders: {
      not_200: analysis.problems.not_200.slice(0, 10),
      brand_repeated_in_title: analysis.problems.brand_repeated_in_title.slice(0, 5),
      brand_pushed_title_over_budget: analysis.problems.brand_pushed_title_over_budget.slice(0, 10),
      noindex_but_in_sitemap: analysis.problems.noindex_but_in_sitemap.slice(0, 10),
      canonical_mismatch: analysis.problems.canonical_mismatch.slice(0, 10),
      title_over_60: [...analysis.problems.title_over_60]
        .sort((a, b) => b.length - a.length)
        .slice(0, 10),
      description_outside_70_160: [...analysis.problems.description_outside_70_160]
        .sort((a, b) => Math.abs(b.length - DESC_MAX) - Math.abs(a.length - DESC_MAX))
        .slice(0, 10),
      thin_under_600_words: [...analysis.problems.thin_under_600_words]
        .sort((a, b) => a.words - b.words)
        .slice(0, 10),
      orphan_risk_few_internal_links: [...analysis.problems.orphan_risk_few_internal_links]
        .sort((a, b) => a.links - b.links)
        .slice(0, 10),
    },
  };
}

export type SeoSummary = ReturnType<typeof compactSummary>;

/** Crawl and analyse. The one entry point a caller needs.
 *
 *  `wall` is non-null when the crawl reached something that is not this site,
 *  in which case `summary` is still returned — a caller debugging the wall
 *  wants to see what came back — but no caller should store or report those
 *  numbers as findings. `/api/cron/daily` turns a non-null `wall` into a
 *  failed step, which is what makes the run go red instead of green. */
export async function runSeoAudit(base: string, paths: string[]): Promise<{
  pages: PageAudit[];
  analysis: SeoAnalysis;
  summary: SeoSummary;
  wall: string | null;
}> {
  const pages = await mapPool(paths, CONCURRENCY, p => auditPage(base, p));
  const analysis = analyse(pages);
  return {
    pages,
    analysis,
    summary: compactSummary(base, paths.length, analysis),
    wall: crawlWall(base, pages),
  };
}

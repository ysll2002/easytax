import { NextRequest, NextResponse } from 'next/server';
import { publishedUrls } from '@/lib/indexnow';
import { CONCURRENCY, analyse, auditPage, mapPool } from '@/lib/seo-audit';

// The full per-page SEO report, on demand.
//
//   GET /api/admin/seo-audit?key=<AGENT_METRICS_KEY>[&limit=40][&offset=0][&all=1]
//
// The checks themselves live in `lib/seo-audit.ts`, because this endpoint is
// no longer their only caller: `/api/cron/daily` runs the same crawl every
// morning and stores the summary in the day's `growth_snapshots` row, which is
// what `daily-metrics` reports. This route stays for the case the summary
// cannot answer — which page, and what exactly is on it.
//
// That split is the point. Between 2026-09-09, when this endpoint was written,
// and 2026-09-14 it was never once called, and in that window it would have
// found 119 pages whose title said "EasyTax" twice. A check that has to be
// remembered is a check that does not run.
//
// Fetches its own deployment over HTTP rather than calling the page modules,
// for the same reason /api/admin/weekly-review self-fetches: the rendered HTML
// is the artefact under test, and anything short of it is a different thing
// that happens to be nearby.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const DEFAULT_LIMIT = 40;

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
  const analysis = analyse(pages);

  return NextResponse.json({
    ok: true,
    audited_at: new Date().toISOString(),
    base,
    sitemap_urls: paths.length,
    audited: pages.length,
    offset,
    next_offset: offset + pages.length < paths.length ? offset + pages.length : null,
    summary: analysis.summary,
    duplicate_titles: analysis.duplicate_titles,
    duplicate_descriptions: analysis.duplicate_descriptions,
    problem_counts: analysis.problem_counts,
    problems: analysis.problems,
    pages,
  });
}

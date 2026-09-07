import { NextRequest, NextResponse } from 'next/server';
import sitemap from '@/app/sitemap';
import { INDEXNOW_KEY, submitToIndexNow } from '@/lib/indexnow';

// Bulk IndexNow submission for the whole site.
//
// The per-article ping in /api/admin/article-review covers pages from here on.
// This covers the 160-odd that already exist and have never been announced to
// anything, plus the case where a batch of pages changes at once (a template
// edit, a pricing change, the review notice landing on every article).
//
//   GET /api/admin/indexnow?key=<AGENT_METRICS_KEY>          → dry run
//   GET /api/admin/indexnow?key=<AGENT_METRICS_KEY>&submit=1 → submits
//
// The dry run is the default on purpose. Submitting the entire sitemap is the
// kind of thing that should be a deliberate second step, not something a
// mistyped URL does.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const expected = process.env.AGENT_METRICS_KEY;
  if (!expected) {
    return NextResponse.json({ error: 'AGENT_METRICS_KEY is not configured.' }, { status: 503 });
  }
  if (req.nextUrl.searchParams.get('key') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let urls: string[];
  try {
    urls = (await sitemap()).map(entry => entry.url);
  } catch (err) {
    return NextResponse.json(
      { error: `Could not build the sitemap: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }

  const keyLocation = `https://easytax.vip/${INDEXNOW_KEY}.txt`;

  if (req.nextUrl.searchParams.get('submit') !== '1') {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      urls: urls.length,
      keyLocation,
      note: 'Add &submit=1 to actually submit. Check keyLocation returns the key first.',
      sample: urls.slice(0, 5),
    });
  }

  const result = await submitToIndexNow(urls);
  return NextResponse.json({ dryRun: false, keyLocation, ...result });
}

import { NextRequest, NextResponse } from 'next/server';
import { publishedUrls, submitToIndexNow, INDEXNOW_KEY, INDEXNOW_HOST } from '@/lib/indexnow';

// Daily IndexNow submission. Scheduled in vercel.json to run shortly after the
// daily-article cron, so the article written that morning is in the batch.
//
// Auth matches the other crons: Vercel Cron sends `Authorization: Bearer
// $CRON_SECRET`. A `?dry=1` run submits nothing and just reports what would be
// sent, which is what to use when checking the wiring on a preview deploy.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') ?? req.nextUrl.searchParams.get('secret');
    if (auth?.replace('Bearer ', '') !== secret) {
      return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
    }
  }

  let urls: string[];
  try {
    urls = await publishedUrls();
  } catch (err) {
    return NextResponse.json(
      { error: 'could not build the URL list', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  if (urls.length === 0) {
    // Preview deploys have no Supabase credentials, so the sitemap drops the
    // articles. Submitting the handful of static pages from a preview would be
    // pointless, not harmful — but reporting it is more useful than doing it.
    return NextResponse.json({ skipped: 'no URLs resolved', host: INDEXNOW_HOST });
  }

  if (req.nextUrl.searchParams.get('dry') === '1') {
    return NextResponse.json({
      dryRun: true,
      host: INDEXNOW_HOST,
      keyLocation: `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`,
      wouldSubmit: urls.length,
      sample: urls.slice(0, 10),
    });
  }

  const result = await submitToIndexNow(urls);
  return NextResponse.json(
    { host: INDEXNOW_HOST, ...result },
    { status: result.ok ? 200 : 502 },
  );
}

import { NextRequest, NextResponse } from 'next/server';

// Daily snapshot of the growth metrics, and a weekly review on Mondays.
//
// The review in /api/admin/weekly-review can only report movement if something
// recorded where we were. That is this: one row a day in growth_snapshots,
// which by next Monday makes "did the changes work?" a subtraction.
//
// All the logic lives in the admin endpoint; this only decides when to call it
// and with what. Vercel cron delivery is at-least-once, and the snapshot write
// is an upsert keyed on the date, so a double fire is harmless.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization') ?? req.nextUrl.searchParams.get('secret');
    if (auth?.replace('Bearer ', '') !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const metricsKey = process.env.AGENT_METRICS_KEY;
  if (!metricsKey) {
    return NextResponse.json({ error: 'AGENT_METRICS_KEY is not configured.' }, { status: 503 });
  }

  // Monday is when the week's numbers are worth reading, so that is the only
  // day the review is emailed. The snapshot itself happens every day.
  const isMonday = new Date().getUTCDay() === 1;

  const url = new URL('/api/admin/weekly-review', `${req.nextUrl.protocol}//${req.nextUrl.host}`);
  url.searchParams.set('key', metricsKey);
  url.searchParams.set('snapshot', '1');
  if (isMonday) url.searchParams.set('email', '1');

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const body = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: res.ok, emailed: isMonday, review: body }, { status: res.ok ? 200 : 502 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

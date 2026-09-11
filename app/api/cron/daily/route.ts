import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { publishedUrls, submitToIndexNow } from '@/lib/indexnow';
import { buildMetricsPayload } from '@/app/api/admin/daily-metrics/route';

// One cron for everything that happens once a day and is not slow.
//
//   GET /api/cron/daily?secret=<CRON_SECRET>
//
// Why the consolidation. vercel.json declared seven cron entries: the article
// generator, IndexNow, four date-pinned MTD reminders, and the growth
// snapshot. `growth_snapshots` was empty two days after the snapshot cron
// shipped and was deployed, while the article cron ran every morning without
// missing a day — the shape of a per-plan cron limit biting the entry furthest
// down the file, not of a broken handler.
//
// That was a hypothesis when this was written and is not one any more. The
// deploy of this very commit failed with "Serverless Functions must have a
// maxDuration between 1 and 300 for plan hobby", which settles which plan this
// project is on: Hobby allows **two** cron jobs. Seven were declared. Five of
// them, the snapshot last among them, were never going to run.
//
// Two entries survive. The article job keeps its own because it makes two model
// calls and needs a function budget of its own; everything cheap runs here, in
// order, and reports each step separately so a failure names itself instead of
// showing up a week later as an empty table.
//
// The four date-pinned reminder entries are gone rather than moved. The
// reminder handler already refuses to send outside its own window relative to
// the real deadline in lib/mtd-dates, so calling it every day is both simpler
// and more correct than four dates hand-copied into a config file — dates that
// have to be re-derived by a person each time HMRC moves a deadline, and that
// were only ever approximately right.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type Step = { step: string; ok: boolean; detail?: unknown; error?: string };

async function run(step: string, fn: () => Promise<unknown>): Promise<Step> {
  try {
    return { step, ok: true, detail: await fn() };
  } catch (err) {
    // A step that throws must not take the rest of the day's work with it: the
    // snapshot is the last one and the most easily lost.
    return { step, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Fetches one of our own routes and insists on a JSON answer.
 *
 * The snapshot avoids self-fetching entirely, for the reason in the header
 * comment. The two steps below cannot — what they need is in a route handler,
 * not a library — so they get the next best thing: a check that the reply is
 * actually ours. Vercel's deployment protection answers an internal request to
 * the public hostname with a 200 and an HTML login page, so `res.ok` is true
 * and `res.json().catch(() => null)` swallows the rest. That combination
 * reports a step as successful when nothing ran, which is the exact failure
 * this whole route exists to stop happening quietly.
 */
async function fetchJson(url: URL): Promise<unknown> {
  const res = await fetch(url, { cache: 'no-store' });
  const type = res.headers.get('content-type') ?? '';
  if (!type.includes('application/json')) {
    throw new Error(
      `${url.pathname} answered ${res.status} with content-type "${type}" instead of JSON — ` +
        'likely a deployment-protection redirect rather than our own handler',
    );
  }
  const body = await res.json();
  if (!res.ok) throw new Error(`${url.pathname} returned ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

/** Today's metrics, stored as the day's row. Upserted on the date, so Vercel's
 *  at-least-once cron delivery cannot produce two rows for one day. */
async function storeSnapshot(): Promise<unknown> {
  const payload = await buildMetricsPayload();
  const takenOn = new Date().toISOString().slice(0, 10);

  const { error } = await supabase
    .from('growth_snapshots')
    .upsert({ taken_on: takenOn, label: 'daily', payload }, { onConflict: 'taken_on' });

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') {
      throw new Error('growth_snapshots table missing — run the 20260906 migration');
    }
    throw new Error(error.message);
  }
  return { taken_on: takenOn };
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization') ?? req.nextUrl.searchParams.get('secret');
    if (auth?.replace('Bearer ', '') !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const base = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const steps: Step[] = [];

  // IndexNow: announce every URL we publish. Bing is one of only two search
  // engines that has ever sent this site a visitor, and it honours the protocol.
  steps.push(await run('indexnow', async () => submitToIndexNow(await publishedUrls())));

  // Quarterly-update reminders. Self-guarding on the real deadline: outside its
  // window this returns `skipped` and sends nothing.
  steps.push(await run('mtd-reminder', async () => {
    const url = new URL('/api/cron/mtd-reminder', base);
    if (cronSecret) url.searchParams.set('secret', cronSecret);
    return fetchJson(url);
  }));

  // Before the review, so Monday's comparison includes today. This is the step
  // that must not be lost: without a row a day, every round re-derives its
  // baseline from whatever the last few days happen to contain, and "did last
  // week's changes work?" stops being a subtraction.
  steps.push(await run('growth-snapshot', storeSnapshot));

  // Monday only. Still a self-fetch, unlike the snapshot above, because what is
  // left in that handler is the comparison and the email rather than the
  // numbers — so the failure mode is a missed email, not a missing row, and it
  // is reported here either way.
  if (new Date().getUTCDay() === 1) {
    steps.push(await run('weekly-review-email', async () => {
      const metricsKey = process.env.AGENT_METRICS_KEY;
      if (!metricsKey) throw new Error('AGENT_METRICS_KEY is not configured');
      const url = new URL('/api/admin/weekly-review', base);
      url.searchParams.set('key', metricsKey);
      url.searchParams.set('email', '1');
      return fetchJson(url);
    }));
  }

  const failed = steps.filter(s => !s.ok);
  return NextResponse.json(
    { ok: failed.length === 0, ran: steps.length, failed: failed.length, steps },
    // A 500 on any failure is what makes the Vercel cron log a red run instead
    // of a green one that quietly did nothing.
    { status: failed.length === 0 ? 200 : 500 },
  );
}

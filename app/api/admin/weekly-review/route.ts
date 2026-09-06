import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { evaluateTargets, summarise, type TargetResult } from '@/lib/growth-targets';
import { escapeHtml, sendInternalNotice } from '@/lib/email';

// The one-week review, as a computation rather than a memory.
//
//   GET /api/admin/weekly-review?key=<AGENT_METRICS_KEY>
//     &snapshot=1  also store today's metrics as the day's snapshot
//     &email=1     also send the scorecard to the owner
//
// Two things happen here. `snapshot=1` writes the whole daily-metrics payload
// into growth_snapshots, one row per day — that is the memory. The review then
// reads the targets in lib/growth-targets.ts against today's payload and,
// where a snapshot from about a week ago exists, reports the movement in the
// headline numbers since then.
//
// Intended use: snapshot daily, review weekly.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Fetches the metrics endpoint from this same deployment.
 *
 *  A self-fetch rather than a direct call because the payload is assembled
 *  inside that route handler; going over HTTP keeps one definition of the
 *  numbers instead of two that can drift. */
async function fetchMetrics(req: NextRequest, key: string): Promise<Record<string, unknown>> {
  const base = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const res = await fetch(`${base}/api/admin/daily-metrics?key=${encodeURIComponent(key)}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`daily-metrics returned ${res.status}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

type Snapshot = { taken_on: string; label: string | null; payload: Record<string, unknown> };

/** The snapshot to compare against: the most recent one at least five days old,
 *  so "a week ago" does not silently become "yesterday" if the endpoint is
 *  called twice in a day. */
async function baselineSnapshot(): Promise<Snapshot | null> {
  const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('growth_snapshots')
    .select('taken_on, label, payload')
    .lte('taken_on', cutoff)
    .order('taken_on', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return data[0] as Snapshot;
}

const HEADLINE: { label: string; path: string }[] = [
  { label: 'Unique visitors (7d)',      path: 'funnel.last_7d.unique_visitors' },
  { label: 'Page views (7d)',           path: 'funnel.last_7d.page_views' },
  { label: 'Schedule requests (7d)',    path: 'funnel.last_7d.schedule_requested' },
  { label: 'Launch subscribers (7d)',   path: 'funnel.last_7d.launch_subscribed' },
  { label: 'Registrations (7d)',        path: 'funnel.last_7d.register_completed' },
  { label: 'Signups (total)',           path: 'signups.total' },
  { label: 'HMRC connections (total)',  path: 'hmrc_connections.total' },
  { label: 'Filings (total)',           path: 'filings.total' },
  { label: 'MRR (GBP)',                 path: 'revenue.mrr' },
];

function dig(payload: Record<string, unknown>, path: string): number | null {
  const v = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, payload);
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export async function GET(req: NextRequest) {
  const expected = process.env.AGENT_METRICS_KEY;
  if (!expected) {
    return NextResponse.json({ error: 'AGENT_METRICS_KEY is not configured.' }, { status: 503 });
  }
  if (req.nextUrl.searchParams.get('key') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let metrics: Record<string, unknown>;
  try {
    metrics = await fetchMetrics(req, expected);
  } catch (err) {
    return NextResponse.json(
      { error: `Could not read metrics: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 },
    );
  }

  // ── store today's snapshot ───────────────────────────────────────────────
  let snapshotStored: boolean | string = false;
  if (req.nextUrl.searchParams.get('snapshot') === '1') {
    const label = req.nextUrl.searchParams.get('label')?.slice(0, 120) ?? null;
    const { error } = await supabase
      .from('growth_snapshots')
      .upsert(
        { taken_on: new Date().toISOString().slice(0, 10), label, payload: metrics },
        { onConflict: 'taken_on' },
      );
    if (error) {
      snapshotStored =
        error.code === 'PGRST205' || error.code === '42P01'
          ? 'growth_snapshots table missing — run the 20260906 migration'
          : error.message;
    } else {
      snapshotStored = true;
    }
  }

  // ── evaluate the targets ─────────────────────────────────────────────────
  const targets = evaluateTargets(metrics);
  const baseline = await baselineSnapshot();

  const movement = HEADLINE.map(h => {
    const now = dig(metrics, h.path);
    const then = baseline ? dig(baseline.payload, h.path) : null;
    return {
      label: h.label,
      now,
      then,
      change: now !== null && then !== null ? now - then : null,
    };
  });

  const body = {
    ok: true,
    generated_at: new Date().toISOString(),
    snapshot_stored: snapshotStored,
    baseline: baseline ? { taken_on: baseline.taken_on, label: baseline.label } : null,
    baseline_note: baseline
      ? null
      : 'No snapshot at least five days old yet. Movement cannot be computed until one exists — ' +
        'call this endpoint with &snapshot=1 daily.',
    summary: summarise(targets),
    targets,
    movement,
  };

  if (req.nextUrl.searchParams.get('email') === '1') {
    const sent = await sendInternalNotice(
      `EasyTax weekly growth review — ${body.summary}`,
      renderEmail(body.summary, targets, movement, baseline?.taken_on ?? null),
    );
    return NextResponse.json({ ...body, emailed: sent });
  }

  return NextResponse.json(body);
}

const VERDICT_COLOUR: Record<TargetResult['verdict'], string> = {
  hit: '#6B8E6E',
  missed: '#B3261E',
  insufficient_data: '#9A8F83',
};

const VERDICT_LABEL: Record<TargetResult['verdict'], string> = {
  hit: 'HIT',
  missed: 'MISSED',
  insufficient_data: 'NOT ENOUGH DATA',
};

function renderEmail(
  summary: string,
  targets: TargetResult[],
  movement: { label: string; now: number | null; then: number | null; change: number | null }[],
  baselineDate: string | null,
): string {
  const targetRows = targets
    .map(
      t => `<tr>
        <td style="padding:14px 0;border-bottom:1px solid #F0EBE1">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.06em;color:${VERDICT_COLOUR[t.verdict]}">
            ${VERDICT_LABEL[t.verdict]} · ${escapeHtml(t.goal.toUpperCase())}
          </p>
          <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#1C1208">${escapeHtml(t.feature)}</p>
          <p style="margin:0 0 6px;font-size:13px;color:#9A8F83">${escapeHtml(t.metric)}</p>
          <p style="margin:0;font-size:13px;color:#4A4035;line-height:1.6">${escapeHtml(t.note)}</p>
        </td>
      </tr>`,
    )
    .join('');

  const movementRows = movement
    .map(m => {
      const change =
        m.change === null
          ? '—'
          : `${m.change > 0 ? '+' : ''}${m.change}`;
      const colour = m.change === null ? '#9A8F83' : m.change > 0 ? '#6B8E6E' : m.change < 0 ? '#B3261E' : '#9A8F83';
      return `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #F0EBE1;font-size:13px;color:#4A4035">${escapeHtml(m.label)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #F0EBE1;font-size:13px;color:#9A8F83">${m.then ?? '—'}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #F0EBE1;font-size:13px;color:#1C1208;font-weight:600">${m.now ?? '—'}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #F0EBE1;font-size:13px;color:${colour};font-weight:600">${change}</td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#F0EBE1;font-family:Arial,sans-serif">
  <table width="640" cellpadding="0" cellspacing="0" align="center" style="max-width:640px;background:#FDFCF8;border-radius:16px;border:1px solid #DDD5C8">
    <tr><td style="padding:32px">
      <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#1C1208;font-family:Georgia,serif">Weekly growth review</p>
      <p style="margin:0 0 24px;font-size:14px;color:#4A4035">${escapeHtml(summary)}</p>

      <table width="100%" cellpadding="0" cellspacing="0">${targetRows}</table>

      <p style="margin:28px 0 8px;font-size:15px;font-weight:700;color:#1C1208;font-family:Georgia,serif">
        Movement${baselineDate ? ` since ${escapeHtml(baselineDate)}` : ''}
      </p>
      ${
        baselineDate
          ? `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E2DA;border-radius:10px">
               <tr style="background:#F0EBE1">
                 <th align="left" style="padding:8px 10px;font-size:11px;color:#9A8F83">Metric</th>
                 <th align="left" style="padding:8px 10px;font-size:11px;color:#9A8F83">Then</th>
                 <th align="left" style="padding:8px 10px;font-size:11px;color:#9A8F83">Now</th>
                 <th align="left" style="padding:8px 10px;font-size:11px;color:#9A8F83">Δ</th>
               </tr>${movementRows}
             </table>`
          : `<p style="margin:0;font-size:13px;color:#9A8F83;line-height:1.6">
               No baseline snapshot at least five days old yet, so there is nothing to compare
               against. Snapshots are stored by calling this endpoint with <code>&amp;snapshot=1</code>.
             </p>`
      }
    </td></tr>
  </table>
</body></html>`;
}

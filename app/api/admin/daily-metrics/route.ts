import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// Aggregated daily-metrics endpoint used by the EasyTax daily autonomous
// agent (runs in Anthropic Cloud, has no direct Supabase credentials).
// Aggregates-only — never returns PII. Protected by AGENT_METRICS_KEY.
//
// Usage: GET /api/admin/daily-metrics?key=<AGENT_METRICS_KEY>

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function countSince(
  table: 'profiles' | 'hmrc_connections' | 'bank_connections' | 'sa_filings',
  column: 'created_at' | 'connected_at',
  sinceIso: string | null,
): Promise<number> {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (sinceIso) q = q.gte(column, sinceIso);
  const { count, error } = await q;
  if (error) throw new Error(`count ${table}.${column}: ${error.message}`);
  return count ?? 0;
}

export async function GET(req: NextRequest) {
  const expected = process.env.AGENT_METRICS_KEY;
  if (!expected) {
    return NextResponse.json({ error: 'AGENT_METRICS_KEY not configured' }, { status: 503 });
  }
  const key = req.nextUrl.searchParams.get('key');
  if (!key || key !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now      = new Date();
  const since24h = new Date(now.getTime() - 24  * 60 * 60 * 1000).toISOString();
  const since7d  = new Date(now.getTime() - 7   * 24 * 60 * 60 * 1000).toISOString();
  const since30d = new Date(now.getTime() - 30  * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [
      profilesTotal,     profiles24h,     profiles7d,     profiles30d,
      hmrcTotal,         hmrc24h,         hmrc7d,         hmrc30d,
      bankTotal,         bank24h,         bank7d,
      filingsTotal,      filings24h,      filings7d,
    ] = await Promise.all([
      countSince('profiles',         'created_at',   null),
      countSince('profiles',         'created_at',   since24h),
      countSince('profiles',         'created_at',   since7d),
      countSince('profiles',         'created_at',   since30d),
      countSince('hmrc_connections', 'connected_at', null),
      countSince('hmrc_connections', 'connected_at', since24h),
      countSince('hmrc_connections', 'connected_at', since7d),
      countSince('hmrc_connections', 'connected_at', since30d),
      countSince('bank_connections', 'connected_at', null),
      countSince('bank_connections', 'connected_at', since24h),
      countSince('bank_connections', 'connected_at', since7d),
      countSince('sa_filings',       'created_at',   null),
      countSince('sa_filings',       'created_at',   since24h),
      countSince('sa_filings',       'created_at',   since7d),
    ]);

    // Filing-type breakdown for the past 30d — cheap enough to fetch as rows
    // (small volume, no PII since we only select filing_type).
    const { data: recentFilings, error: filingErr } = await supabase
      .from('sa_filings')
      .select('filing_type')
      .gte('created_at', since30d);
    if (filingErr) throw new Error(`sa_filings 30d rows: ${filingErr.message}`);
    const filings30dQuarterly = (recentFilings ?? []).filter(r => r.filing_type === 'quarterly').length;
    const filings30dFinal     = (recentFilings ?? []).filter(r => r.filing_type === 'final_declaration').length;

    // Unique users who've filed at least once (activation proxy).
    const { data: filerRows, error: filerErr } = await supabase
      .from('sa_filings')
      .select('user_id');
    if (filerErr) throw new Error(`sa_filings user_ids: ${filerErr.message}`);
    const uniqueFilers = new Set((filerRows ?? []).map(r => r.user_id)).size;

    // Launch waitlist (pre-revenue pipeline, shipped 2026-09-03). The table may
    // not exist yet — report null rather than failing the whole payload.
    let waitlist: { total: number; last_24h: number; last_7d: number; by_source: Record<string, number> } | null = null;
    try {
      const [{ count: wlTotal, error: e1 }, { count: wl24, error: e2 }, { count: wl7, error: e3 }, { data: wlRows, error: e4 }] = await Promise.all([
        supabase.from('launch_waitlist').select('*', { count: 'exact', head: true }),
        supabase.from('launch_waitlist').select('*', { count: 'exact', head: true }).gte('created_at', since24h),
        supabase.from('launch_waitlist').select('*', { count: 'exact', head: true }).gte('created_at', since7d),
        supabase.from('launch_waitlist').select('source'),
      ]);
      if (!e1 && !e2 && !e3 && !e4) {
        const bySource: Record<string, number> = {};
        for (const r of wlRows ?? []) bySource[r.source ?? 'other'] = (bySource[r.source ?? 'other'] ?? 0) + 1;
        waitlist = { total: wlTotal ?? 0, last_24h: wl24 ?? 0, last_7d: wl7 ?? 0, by_source: bySource };
      }
    } catch {
      waitlist = null;
    }

    return NextResponse.json({
      generated_at:            now.toISOString(),
      target_goal_gbp_per_month: 10_000,
      env: {
        hmrc_env: process.env.HMRC_ENV ?? '(not set)',
        node_env: process.env.NODE_ENV ?? '(not set)',
      },
      signups: {
        total:      profilesTotal,
        last_24h:   profiles24h,
        last_7d:    profiles7d,
        last_30d:   profiles30d,
      },
      hmrc_connections: {
        total:      hmrcTotal,
        last_24h:   hmrc24h,
        last_7d:    hmrc7d,
        last_30d:   hmrc30d,
        conversion_from_signup: profilesTotal > 0 ? +(hmrcTotal / profilesTotal).toFixed(3) : 0,
      },
      bank_connections: {
        total:      bankTotal,
        last_24h:   bank24h,
        last_7d:    bank7d,
      },
      filings: {
        total:              filingsTotal,
        last_24h:           filings24h,
        last_7d:            filings7d,
        last_30d_quarterly: filings30dQuarterly,
        last_30d_final:     filings30dFinal,
        unique_filers:      uniqueFilers,
      },
      // null until the launch_waitlist table exists (see docs/agent/2026-09-03-daily-plan.md)
      waitlist,
      // Pre-revenue: HMRC production approval pending, no Stripe integration
      // yet. Once revenue lands, wire it in here so the agent can compute
      // distance-to-goal.
      revenue: {
        currency:            'GBP',
        mrr:                 0,
        arr:                 0,
        distance_to_goal:    10_000,
        status:              'pre-revenue (HMRC production approval pending)',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

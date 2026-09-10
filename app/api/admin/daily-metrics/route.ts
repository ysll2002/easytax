import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// Aggregated daily-metrics endpoint used by the EasyTax daily autonomous
// agent (runs in Anthropic Cloud, has no direct Supabase credentials).
// Aggregates-only — never returns PII. Protected by AGENT_METRICS_KEY.
//
// Usage: GET /api/admin/daily-metrics?key=<AGENT_METRICS_KEY>

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── What counts as a visit ────────────────────────────────────────────────
//
// The 2026-09-08 numbers reported 34 unique visitors. Six of them were on
// `/55251a02303938bd113be2863f9c7b6c.txt` — the IndexNow key file. A static
// .txt runs no JavaScript, so those rows can only have come from the window
// between the code deploying and the file existing, when that URL rendered the
// Next 404 page, which carries the tracker like every other page. Six crawlers
// checking whether the key was live became six "unique visitors", 18% of the
// week's total.
//
// Another ten page views were `/dashboard/individual/sandbox-test` and
// `/dashboard/fph-test` — our own HMRC sandbox fixtures, exercised by a cron.
//
// None of that is traffic, and all of it was inflating the number every
// decision in this project is made against. It is excluded here rather than
// deleted, and the exclusions are reported alongside the totals: a filter you
// cannot see is how a metric quietly starts lying in the other direction.

// `/embed` is here for a different reason from the rest. The others are ours
// and are not content; the embed IS content, but it is being read on somebody
// else's page. Counting an impression of a 560×190 widget as a visit to this
// site would inflate the same number the last round spent a change deflating.
// It is measured separately, by host, in `distribution.embeds`.
const NON_CONTENT_PREFIXES = ['/dashboard', '/api', '/onboarding', '/payment', '/actions', '/embed'];

/** True for paths that represent a person looking at a public page. */
export function isPublicContentPath(path: string | null | undefined): boolean {
  if (!path || !path.startsWith('/')) return false;
  if (NON_CONTENT_PREFIXES.some(p => path === p || path.startsWith(`${p}/`))) return false;
  // A dot in the final segment means a file — .txt, .xml, .ics, .png. Real
  // pages on this site never have one.
  const last = path.split('/').pop() ?? '';
  if (last.includes('.')) return false;
  return true;
}

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

/** Counts production analytics_events by name since `sinceIso`.
 *
 *  Returns an empty map rather than throwing when the table is missing, so the
 *  endpoint keeps serving the core counts if the 20260903 migration has not
 *  been run yet. */
async function eventCounts(sinceIso: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('name, path, props')
    .gte('created_at', sinceIso)
    .limit(50_000);

  if (error) return {};

  const out: Record<string, number> = {};
  for (const row of data ?? []) {
    // Preview and local traffic is stamped by /api/track; exclude it so the
    // reported funnel reflects easytax.vip only.
    const env = (row.props as { env?: string } | null)?.env;
    if (env !== 'production') continue;
    // Crawler hits on static files and our own dashboard fixtures are not
    // page views. See isPublicContentPath.
    if (row.name === 'page_view' && !isPublicContentPath(row.path)) continue;
    out[row.name] = (out[row.name] ?? 0) + 1;
  }
  return out;
}

/** Unique visitors (by anon_id) who saw at least one page in the window —
 *  the top of the funnel that row counts alone cannot show. */
async function uniqueVisitors(sinceIso: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('anon_id, path, props')
    .eq('name', 'page_view')
    .gte('created_at', sinceIso)
    .limit(50_000);

  if (error) return null;

  const ids = new Set<string>();
  for (const row of data ?? []) {
    if ((row.props as { env?: string } | null)?.env !== 'production') continue;
    if (!isPublicContentPath(row.path)) continue;
    if (row.anon_id) ids.add(row.anon_id);
  }
  return ids.size;
}

/** Traffic broken down by landing page and by acquisition channel.
 *
 *  Why: the site has 15+ marketing pages and the aggregate funnel cannot say
 *  which of them does anything. Without this you cannot tell whether the next
 *  landing page is worth writing, or which existing one deserves the backlinks.
 *
 *  Returns null when the table is missing, matching the other helpers. */
async function trafficBreakdown(sinceIso: string) {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('name, path, anon_id, referrer, utm_source, utm_medium, props')
    .gte('created_at', sinceIso)
    .limit(50_000);

  if (error) return null;

  const views   = new Map<string, { views: number; visitors: Set<string> }>();
  const convert = new Map<string, number>();
  const sources = new Map<string, { views: number; visitors: Set<string> }>();

  // Events that represent a visitor doing something we actually want, keyed to
  // the page they did it on. Lets us rank pages by outcome, not just traffic.
  const CONVERSIONS = new Set([
    'register_started',
    'register_completed',
    'launch_subscribed',
    'schedule_requested',
    'checker_completed',
    'activation_cta_click',
    'article_cta_click',
    'tool_completed',
    'tool_cta_click',
  ]);

  /** Bare host, so utm-tagged and deep-linked referrals from the same site
   *  collapse into one row. 'direct' when there is no referrer. */
  const channelOf = (referrer: string | null, utmSource: string | null): string => {
    if (utmSource) return utmSource.toLowerCase();
    if (!referrer) return 'direct';
    try {
      const host = new URL(referrer).hostname.replace(/^www\./, '');
      return host === 'easytax.vip' ? 'internal' : host;
    } catch {
      return 'unknown';
    }
  };

  // What the filter removed, so the exclusion is auditable rather than a
  // silent shrink in the headline number.
  const excluded = new Map<string, { views: number; visitors: Set<string> }>();

  for (const row of data ?? []) {
    if ((row.props as { env?: string } | null)?.env !== 'production') continue;

    if (row.name === 'page_view') {
      if (!isPublicContentPath(row.path)) {
        const key = row.path ?? '(unknown)';
        const ex = excluded.get(key) ?? { views: 0, visitors: new Set<string>() };
        ex.views += 1;
        if (row.anon_id) ex.visitors.add(row.anon_id);
        excluded.set(key, ex);
        continue;
      }
      const path = row.path ?? '(unknown)';
      const entry = views.get(path) ?? { views: 0, visitors: new Set<string>() };
      entry.views += 1;
      if (row.anon_id) entry.visitors.add(row.anon_id);
      views.set(path, entry);

      const channel = channelOf(row.referrer, row.utm_source);
      const src = sources.get(channel) ?? { views: 0, visitors: new Set<string>() };
      src.views += 1;
      if (row.anon_id) src.visitors.add(row.anon_id);
      sources.set(channel, src);
    } else if (CONVERSIONS.has(row.name)) {
      const path = row.path ?? '(unknown)';
      convert.set(path, (convert.get(path) ?? 0) + 1);
    }
  }

  const byPath = [...views.entries()]
    .map(([path, v]) => ({
      path,
      page_views:      v.views,
      unique_visitors: v.visitors.size,
      conversions:     convert.get(path) ?? 0,
    }))
    .sort((a, b) => b.unique_visitors - a.unique_visitors || b.page_views - a.page_views)
    .slice(0, 25);

  const byChannel = [...sources.entries()]
    .map(([channel, v]) => ({ channel, page_views: v.views, unique_visitors: v.visitors.size }))
    .sort((a, b) => b.unique_visitors - a.unique_visitors || b.page_views - a.page_views)
    .slice(0, 15);

  // Pages that exist but drew nothing in the window. Usually the more
  // actionable list: it is where the effort went and the traffic did not.
  const seen = new Set(views.keys());
  const silent = MARKETING_PAGES.filter(p => !seen.has(p));

  const excludedIds = new Set<string>();
  for (const v of excluded.values()) for (const id of v.visitors) excludedIds.add(id);

  return {
    by_path: byPath,
    by_channel: byChannel,
    pages_with_no_traffic: silent,
    excluded_non_content: {
      note:
        'Page views on paths that are not public pages — static files hit by crawlers ' +
        '(a 404 renders the tracker), our own /dashboard sandbox fixtures, and API routes. ' +
        'Removed from every count above and from last_7d / last_30d.',
      page_views:      [...excluded.values()].reduce((n, v) => n + v.views, 0),
      unique_visitors: excludedIds.size,
      by_path: [...excluded.entries()]
        .map(([path, v]) => ({ path, page_views: v.views, unique_visitors: v.visitors.size }))
        .sort((a, b) => b.page_views - a.page_views)
        .slice(0, 10),
    },
  };
}

/** The free tools, keyed by the `tool` prop their events carry. The page path
 *  is what page_view records; the key is what tool_started / tool_completed
 *  record, and the two have to be joined in toolFunnel() to get a funnel per
 *  tool. Declared above MARKETING_PAGES, which spreads TOOL_PAGES. */
const TOOLS: { key: string; path: string }[] = [
  { key: 'mtd_deadline',        path: '/mtd-deadline-checker' },
  { key: 'sa_penalty',          path: '/self-assessment-penalty-calculator' },
  { key: 'payments_on_account', path: '/payments-on-account-calculator' },
];

const TOOL_PAGES = ['/tools', ...TOOLS.map(t => t.path)];

/** Public marketing routes, so the breakdown can name the ones drawing zero
 *  traffic rather than silently omitting them. Keep in step with app/sitemap.ts. */
const MARKETING_PAGES = [
  '/', '/pricing', '/mtd-software', '/self-assessment-software',
  '/landlord-tax-software', '/timetable', '/tax-tips', '/tax-tips/topics', '/trust',
  ...TOOL_PAGES,
  '/bokio-alternative', '/coconut-alternative', '/crunch-alternative', '/freeagent-alternative',
  '/kashflow-alternative', '/quickbooks-alternative', '/sage-alternative', '/taxscouts-alternative',
  '/xero-alternative',
];

/**
 * Per-tool funnel: page view -> engaged with the form -> got an answer -> hit
 * a CTA. Aggregate event counts cannot answer "is the penalty calculator
 * pulling its weight?", which is the question each new tool has to earn its
 * place against.
 *
 * The deadline checker predates the generic tool events and still emits
 * `checker_started` / `checker_completed`, so both spellings are folded in
 * here rather than rewriting a shipped, working component.
 */
async function toolFunnel(sinceIso: string) {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('name, path, anon_id, props')
    .gte('created_at', sinceIso)
    .limit(50_000);

  if (error) return null;

  const blank = () => ({ views: new Set<string>(), page_views: 0, started: 0, completed: 0, cta_clicks: 0 });
  const byTool = new Map(TOOLS.map(t => [t.key, blank()]));
  const pathToKey = new Map(TOOLS.map(t => [t.path, t.key]));

  let hubViews = 0;
  const topicViews = new Map<string, number>();

  for (const row of data ?? []) {
    const props = (row.props ?? {}) as { env?: string; tool?: string; topic?: string };
    if (props.env !== 'production') continue;

    if (row.name === 'page_view') {
      const key = row.path ? pathToKey.get(row.path) : undefined;
      if (key) {
        const e = byTool.get(key)!;
        e.page_views += 1;
        if (row.anon_id) e.views.add(row.anon_id);
      }
      continue;
    }

    if (row.name === 'tools_hub_viewed') { hubViews += 1; continue; }

    if (row.name === 'topic_hub_viewed') {
      const t = props.topic ?? '(unknown)';
      topicViews.set(t, (topicViews.get(t) ?? 0) + 1);
      continue;
    }

    // The deadline checker's original event names carry no `tool` prop.
    const key =
      props.tool ??
      (row.name === 'checker_started' || row.name === 'checker_completed' ? 'mtd_deadline' : undefined);
    const entry = key ? byTool.get(key) : undefined;
    if (!entry) continue;

    if (row.name === 'tool_started'   || row.name === 'checker_started')   entry.started    += 1;
    if (row.name === 'tool_completed' || row.name === 'checker_completed') entry.completed  += 1;
    if (row.name === 'tool_cta_click')                                     entry.cta_clicks += 1;
  }

  const ratio = (num: number, den: number) => (den > 0 ? +(num / den).toFixed(3) : null);

  return {
    hub_views: hubViews,
    by_tool: TOOLS.map(t => {
      const e = byTool.get(t.key)!;
      return {
        tool:            t.key,
        path:            t.path,
        page_views:      e.page_views,
        unique_visitors: e.views.size,
        started:         e.started,
        completed:       e.completed,
        cta_clicks:      e.cta_clicks,
        // Did people engage with the form at all, and did they get an answer?
        start_rate:      ratio(e.started, e.views.size),
        completion_rate: ratio(e.completed, e.started),
        // The number that decides whether a free tool is worth keeping.
        cta_rate:        ratio(e.cta_clicks, e.completed),
      };
    }),
    topic_hub_views: [...topicViews.entries()]
      .map(([topic, views]) => ({ topic, views }))
      .sort((a, b) => b.views - a.views),
  };
}

async function launchSubscriberCounts(since7d: string, since30d: string) {
  const { data, error } = await supabase
    .from('launch_subscribers')
    .select('segment, source, created_at');

  if (error) return null;

  const rows = data ?? [];
  const bySegment: Record<string, number> = {};
  for (const r of rows) bySegment[r.segment ?? 'unspecified'] = (bySegment[r.segment ?? 'unspecified'] ?? 0) + 1;

  // Which placement earned the address. The form now sits in the site-wide
  // footer ('footer') and at the foot of every article ('article') as well as
  // in the original three page blocks — without this split there is no way to
  // tell which placement is doing the work.
  const bySource: Record<string, number> = {};
  for (const r of rows) bySource[r.source ?? 'unknown'] = (bySource[r.source ?? 'unknown'] ?? 0) + 1;

  return {
    total:      rows.length,
    last_7d:    rows.filter(r => r.created_at >= since7d).length,
    last_30d:   rows.filter(r => r.created_at >= since30d).length,
    by_segment: bySegment,
    by_source:  bySource,
  };
}

/** How much production data the event table actually holds.
 *
 *  This exists because the `last_7d` / `last_30d` labels below are a trap. They
 *  are computed as "since now minus N days", but `analytics_events` only began
 *  recording on 2026-09-03 — so on 2026-09-06 all three windows returned the
 *  same numbers, and a 2.7-day figure was read and reported as a 30-day one.
 *  The labels were accurate about the query and silent about the data, which is
 *  the kind of number that gets believed.
 *
 *  Reporting the real window makes the truncation impossible to miss. Note this
 *  measures *this* table only — signups, HMRC connections and filings come from
 *  tables with full history and are not affected. */
async function dataWindow() {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('created_at')
    .eq('props->>env', 'production')
    .order('created_at', { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) {
    return { instrumented_since: null, days_of_data: 0, warning: 'No production events recorded yet.' };
  }

  const earliest = data[0].created_at as string;
  const days = (Date.now() - new Date(earliest).getTime()) / 86_400_000;

  return {
    instrumented_since: earliest,
    days_of_data: Math.round(days * 100) / 100,
    warning:
      days < 30
        ? `Event tracking started ${days.toFixed(1)} days ago. Every window below that is longer ` +
          `— last_7d, last_30d, previous_7d, and the pages_with_no_traffic lists — is truncated to ` +
          `those ${days.toFixed(1)} days. "No traffic in 30 days" here means "no traffic in ` +
          `${days.toFixed(1)} days". Compare against GA only over a matching range.`
        : null,
  };
}

/** The editorial review queue and the stored snapshot count.
 *
 *  Both are what the weekly review reads to judge F1 and F5, and both live
 *  behind the 20260906 migration — so a missing table or column returns null
 *  rather than failing the whole metrics call. */
async function editorialState(since7d: string) {
  const [drafts, published, snapshots] = await Promise.all([
    supabase.from('tax_articles').select('slug', { count: 'exact', head: true }).eq('review_status', 'draft'),
    supabase.from('tax_articles').select('slug', { count: 'exact', head: true }).eq('review_status', 'published'),
    supabase.from('growth_snapshots').select('id', { count: 'exact', head: true }).gte('created_at', since7d),
  ]);

  return {
    editorial: drafts.error || published.error
      ? null
      : { drafts_awaiting_review: drafts.count ?? 0, published: published.count ?? 0 },
    growth_snapshots: snapshots.error ? null : { last_7d: snapshots.count ?? 0 },
  };
}

/**
 * Distribution: did anything of ours end up somewhere else?
 *
 * Every measurement this project has added so far counts what happens *on*
 * easytax.vip. That was the right place to start and it has now told us what
 * it can: roughly two search-referred visitors a week against 157 pages. The
 * conclusion of the 2026-09-08 round was that the remaining constraint is
 * off-site, and nothing here could see off-site at all.
 *
 * These four counters can. Each is evidence of a different way a page of ours
 * reached somebody who was not already on the site:
 *
 *  - `embeds.by_host`  — a domain that framed our widget. That is a backlink,
 *                        observed directly, without waiting on Search Console.
 *  - `share_cards`     — a platform fetching the preview image for a shared
 *                        calculator result, i.e. someone posted the link.
 *  - `feeds.by_agent`  — a reader polling the archive. Repetition is the
 *                        signal; a single fetch is a look, not a subscription.
 *  - `shares`          — the on-site clicks that precede all of the above.
 *
 * The first three are recorded server-side and are absent from /api/track's
 * allowlist by design: evidence that a browser can forge is not evidence.
 */
async function distribution(sinceIso: string) {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('name, props, created_at')
    .in('name', ['embed_served', 'share_card_served', 'feed_fetched', 'share_click', 'share_copy'])
    .gte('created_at', sinceIso)
    .limit(50_000);

  if (error) return null;

  const embedHosts   = new Map<string, number>();
  const feedAgents   = new Map<string, number>();
  const scrapers     = new Map<string, number>();
  const shareChannel = new Map<string, number>();
  let embedServed = 0;
  let shareCards  = 0;
  let feedFetches = 0;

  const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

  for (const row of data ?? []) {
    const props = (row.props ?? {}) as Record<string, unknown>;
    if (props.env !== 'production') continue;
    const str = (k: string) => (typeof props[k] === 'string' ? (props[k] as string) : 'unknown');

    switch (row.name) {
      case 'embed_served':
        embedServed++;
        bump(embedHosts, str('host'));
        break;
      case 'share_card_served':
        shareCards++;
        bump(scrapers, str('scraper'));
        break;
      case 'feed_fetched':
        feedFetches++;
        // The full user-agent is stored, but a feed reader's version string
        // changes weekly and would split one subscriber across a dozen rows.
        // Cut at the first space or slash to key on the product name.
        bump(feedAgents, (str('agent').split(/[\s/]/)[0] || 'unknown').slice(0, 60));
        break;
      default:
        bump(shareChannel, `${str('tool')}:${str('channel')}`);
    }
  }

  const top = (m: Map<string, number>, n = 15) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
      .map(([key, count]) => ({ key, count }));

  return {
    embeds: {
      served: embedServed,
      // Hosts that are not us. This list being non-empty is the single most
      // important line in this whole endpoint: it means somebody else chose to
      // put us on their page.
      distinct_hosts: [...embedHosts.keys()].filter(h => h !== 'unknown').length,
      by_host: top(embedHosts),
    },
    share_cards: { served: shareCards, by_scraper: top(scrapers) },
    feeds: { fetches: feedFetches, distinct_agents: feedAgents.size, by_agent: top(feedAgents) },
    shares: {
      clicks: [...shareChannel.values()].reduce((a, b) => a + b, 0),
      by_tool_channel: top(shareChannel),
    },
  };
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
  const sincePrev14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

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

    // Behavioural funnel. All of these degrade to empty/null when the
    // 20260903 migration has not been applied, so the endpoint never 500s
    // just because instrumentation is not live yet.
    const [
      events7d, events30d, visitors7d, visitors30d, launchList, traffic7d, traffic30d,
      tools7d, tools30d, eventsPrev7d, visitorsPrev7d, editorial, window,
      distribution7d, distribution30d,
    ] = await Promise.all([
      eventCounts(since7d),
      eventCounts(since30d),
      uniqueVisitors(since7d),
      uniqueVisitors(since30d),
      launchSubscriberCounts(since7d, since30d),
      trafficBreakdown(since7d),
      trafficBreakdown(since30d),
      toolFunnel(since7d),
      toolFunnel(since30d),
      // The 7 days before last, so a week-on-week read is possible without
      // having stored a snapshot. Both windows are computed the same way, so
      // the comparison is like for like.
      eventCounts(sincePrev14d),
      uniqueVisitors(sincePrev14d),
      editorialState(since7d),
      dataWindow(),
      distribution(since7d),
      distribution(since30d),
    ]);

    // eventCounts/uniqueVisitors take a single lower bound, so the "previous"
    // figures above actually cover 14 days. Subtracting the last 7 leaves the
    // 7 before it.
    const prev7d = (name: string) => (eventsPrev7d[name] ?? 0) - (events7d[name] ?? 0);

    const instrumented = visitors7d !== null;
    const rate = (num: number, den: number | null) =>
      den && den > 0 ? +(num / den).toFixed(3) : null;

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
      // Behavioural funnel from analytics_events. `instrumented: false` means
      // the migration has not been run — treat every field below as unknown
      // rather than as zero.
      funnel: {
        instrumented,
        note: instrumented
          ? 'production traffic only; visitors are unique anon_id values'
          : 'analytics_events table missing — run supabase/migrations/20260903_growth_instrumentation.sql',
        // How much data the windows below actually cover. dataWindow() was
        // being computed and then never emitted, so `funnel.data_window` did
        // not exist in the payload — which meant daysOfData() in
        // lib/growth-targets.ts fell through to its default of 7 and divided a
        // four-day count by seven, under-reporting every rate by ~43%. That is
        // the exact bug this block was written to prevent, so it has to be in
        // the response, not just in the function list.
        data_window: window,
        // Which pages and channels actually produce visitors and actions.
        // `conversions` counts register/launch-list/checker/CTA events fired
        // on that page. `pages_with_no_traffic` lists marketing routes that
        // drew nothing in the window.
        attribution: {
          last_7d:  traffic7d,
          last_30d: traffic30d,
        },
        last_7d: {
          unique_visitors:     visitors7d,
          page_views:          events7d['page_view']            ?? 0,
          register_started:    events7d['register_started']     ?? 0,
          register_completed:  events7d['register_completed']   ?? 0,
          launch_subscribed:   events7d['launch_subscribed']    ?? 0,
          // The deadline-schedule capture that replaced the launch waitlist as
          // the primary ask. Counted separately because the two are different
          // bargains: one delivers something now, the other promises later.
          schedule_requested:  events7d['schedule_requested']   ?? 0,
          schedule_sent:       events7d['schedule_sent']        ?? 0,
          editorial_viewed:    events7d['editorial_standards_viewed'] ?? 0,
          trust_viewed:        events7d['trust_viewed']         ?? 0,
          article_cta_click:   events7d['article_cta_click']    ?? 0,
          activation_cta_click:events7d['activation_cta_click'] ?? 0,
          visitor_to_register: rate(events7d['register_completed'] ?? 0, visitors7d),
          // Drop-off between opening the register form and completing it.
          register_completion: rate(events7d['register_completed'] ?? 0, events7d['register_started'] ?? 0),
        },
        last_30d: {
          unique_visitors:     visitors30d,
          page_views:          events30d['page_view']          ?? 0,
          register_completed:  events30d['register_completed']  ?? 0,
          launch_subscribed:   events30d['launch_subscribed']   ?? 0,
          schedule_requested:  events30d['schedule_requested']  ?? 0,
          visitor_to_register: rate(events30d['register_completed'] ?? 0, visitors30d),
        },

        // The 7 days before last, for a week-on-week read without a stored
        // snapshot. These are event counts, which subtract cleanly; unique
        // visitors do not, so the 14-day figure is reported as itself rather
        // than differenced.
        previous_7d: {
          page_views:         prev7d('page_view'),
          register_completed: prev7d('register_completed'),
          launch_subscribed:  prev7d('launch_subscribed'),
          schedule_requested: prev7d('schedule_requested'),
          tool_completed:     prev7d('tool_completed'),
          unique_visitors_last_14d: visitorsPrev7d,
        },
      },

      // Free tools, one funnel each: page view -> engaged -> got an answer ->
      // clicked through. This is what decides whether a tool earned its place;
      // `tools.by_tool[].cta_rate` is the number to watch after a week.
      tools: {
        last_7d:  tools7d,
        last_30d: tools30d,
      },

      // Off-site reach: embeds, shared-result cards, feed readers and the
      // on-site share clicks that precede them. See distribution() above for
      // why this is the block that answers the question the last four rounds
      // could not — whether anything of ours travels.
      //
      // Expect zeros on the first run. A zero here is a real reading, not a
      // missing one: it says nobody has embedded, shared or subscribed yet.
      distribution: {
        last_7d:  distribution7d,
        last_30d: distribution30d,
      },

      // Launch waitlist — the addressable pipeline to convert on the day HMRC
      // production approval lands. null until the migration is run.
      launch_list: launchList,

      // Editorial review gate: how many generated drafts are waiting for a
      // person, and how many articles are actually live. A queue that only
      // grows means the gate has become a bottleneck rather than a standard.
      editorial: editorial.editorial,

      // Stored daily snapshots, which is what makes the weekly review a
      // comparison rather than a reading.
      growth_snapshots: editorial.growth_snapshots,

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

// What each of today's changes is supposed to do, and how we will know.
//
// The point of writing the targets down in code rather than in a document is
// that a week from now the review is arithmetic, not recollection: the same
// function reads the same fields out of /api/admin/daily-metrics and says
// hit / missed / not enough data.
//
// The last of those verdicts matters more than it looks. The site saw nine
// unique visitors in the seven days before these changes shipped. At that
// volume almost nothing is statistically distinguishable from noise, so a
// target that "passes" on two conversions has told us very little. Every
// target therefore carries the sample size it needs before its verdict means
// anything, and says so plainly rather than reporting a percentage of nine.

export type MetricsPayload = Record<string, unknown>;

export type Verdict = 'hit' | 'missed' | 'insufficient_data';

export type TargetResult = {
  id: string;
  feature: string;
  goal: 'revenue' | 'trust' | 'traffic';
  metric: string;
  baseline: number;
  target: number;
  actual: number | null;
  verdict: Verdict;
  /** Why the verdict is what it is, in one sentence. */
  note: string;
};

// ── payload accessors ──────────────────────────────────────────────────────
// The metrics endpoint returns nested JSON built by hand, so every read here
// is defensive: a missing block means "we could not measure it", never a crash
// in the middle of a review.

function dig(payload: MetricsPayload, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, payload);
}

function num(payload: MetricsPayload, path: string): number | null {
  const v = dig(payload, path);
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

type PathRow = { path?: unknown; unique_visitors?: unknown };
type ChannelRow = { channel?: unknown; unique_visitors?: unknown };

/** Unique visitors in the last 7 days to any path under `prefix`. */
export function visitorsUnderPath(payload: MetricsPayload, prefix: string): number | null {
  const rows = dig(payload, 'funnel.attribution.last_7d.by_path');
  if (!Array.isArray(rows)) return null;
  let total = 0;
  for (const row of rows as PathRow[]) {
    if (typeof row?.path === 'string' && row.path.startsWith(prefix)) {
      total += typeof row.unique_visitors === 'number' ? row.unique_visitors : 0;
    }
  }
  return total;
}

/** Unique visitors in the last 7 days arriving from a search engine. */
export function searchVisitors(payload: MetricsPayload): number | null {
  const rows = dig(payload, 'funnel.attribution.last_7d.by_channel');
  if (!Array.isArray(rows)) return null;
  const SEARCH = /(^|\.)(google|bing|duckduckgo|yandex|ecosia|search\.brave)\./i;
  let total = 0;
  for (const row of rows as ChannelRow[]) {
    if (typeof row?.channel === 'string' && SEARCH.test(row.channel)) {
      total += typeof row.unique_visitors === 'number' ? row.unique_visitors : 0;
    }
  }
  return total;
}

/** Addresses captured in the last 7 days, however they were captured. */
export function capturesLast7d(payload: MetricsPayload): number | null {
  const schedule = num(payload, 'funnel.last_7d.schedule_requested');
  const launch = num(payload, 'funnel.last_7d.launch_subscribed');
  if (schedule === null && launch === null) return null;
  return (schedule ?? 0) + (launch ?? 0);
}

// ── the targets ────────────────────────────────────────────────────────────

/** Below this many unique visitors in the window, no conversion-rate verdict
 *  is worth reporting — one extra click would swing it by ten points. */
const MIN_VISITORS_FOR_RATE = 60;

/** Below this many search visitors, a traffic verdict is a coin flip. */
const MIN_VISITORS_FOR_TRAFFIC = 20;

export function evaluateTargets(payload: MetricsPayload): TargetResult[] {
  const visitors = num(payload, 'funnel.last_7d.unique_visitors') ?? 0;

  const results: TargetResult[] = [];

  // ── F1 · editorial accountability ────────────────────────────────────────
  const archiveVisitors = visitorsUnderPath(payload, '/tax-tips');
  results.push({
    id: 'F1_archive_reach',
    feature: 'Editorial accountability and review gate',
    goal: 'traffic',
    metric: 'Unique visitors to /tax-tips* in the last 7 days',
    baseline: 3,
    target: 12,
    actual: archiveVisitors,
    ...verdictFor(archiveVisitors, 12, MIN_VISITORS_FOR_TRAFFIC, archiveVisitors, {
      short:
        'Authorship, review dates and a stated method are what a search engine looks for on ' +
        'YMYL pages. Ranking changes take four to eight weeks, so week one is a leading ' +
        'indicator, not a verdict.',
    }),
  });

  // ── F2 · IndexNow ────────────────────────────────────────────────────────
  const search = searchVisitors(payload);
  results.push({
    id: 'F2_search_visitors',
    feature: 'IndexNow instant indexing',
    goal: 'traffic',
    metric: 'Unique visitors from search engines in the last 7 days',
    baseline: 2,
    target: 8,
    actual: search,
    ...verdictFor(search, 8, MIN_VISITORS_FOR_TRAFFIC, search, {
      short:
        'Bing, Yandex and Seznam honour IndexNow; Google does not. Judge this on Bing and ' +
        'Yandex share, and on pages reported as indexed in Bing Webmaster Tools, not on total ' +
        'search traffic.',
    }),
  });

  // ── F3 · deadline-schedule capture ───────────────────────────────────────
  const scheduleRequests = num(payload, 'funnel.last_7d.schedule_requested');
  results.push({
    id: 'F3_schedule_requests',
    feature: 'Deadline schedule by email',
    goal: 'revenue',
    metric: 'schedule_requested events in the last 7 days',
    baseline: 0,
    target: 5,
    actual: scheduleRequests,
    ...verdictFor(scheduleRequests, 5, 1, visitors, {
      short:
        'The old waitlist converted 0 of 9 visitors because it offered nothing today. This one ' +
        'sends the visitor their own filing dates within the minute. Any capture at all beats ' +
        'the baseline; five is the number that would make the list worth emailing on approval day.',
    }),
  });

  // ── F4 · funnel honesty ──────────────────────────────────────────────────
  const captures = capturesLast7d(payload);
  const captureRate = captures !== null && visitors > 0 ? captures / visitors : null;
  results.push({
    id: 'F4_capture_rate',
    feature: 'Honest funnel and trust signals',
    goal: 'trust',
    metric: 'Share of unique visitors who give us an email address (7d)',
    baseline: 0,
    target: 0.1,
    actual: captureRate,
    ...verdictFor(captureRate, 0.1, MIN_VISITORS_FOR_RATE, visitors, {
      short:
        'A third of visitors read /trust and none of them converted, because every ask on the ' +
        'site was for filing that HMRC has not approved. The ask is now something we can ' +
        'deliver today.',
      rate: true,
    }),
  });

  // ── F5 · the scorecard itself ────────────────────────────────────────────
  const snapshots = num(payload, 'growth_snapshots.last_7d');
  results.push({
    id: 'F5_snapshots',
    feature: 'Weekly growth scorecard',
    goal: 'trust',
    metric: 'Daily metric snapshots stored in the last 7 days',
    baseline: 0,
    target: 5,
    actual: snapshots,
    ...verdictFor(snapshots, 5, 1, snapshots ?? 0, {
      short:
        'Without stored baselines, next week\'s review can only compare against whatever the ' +
        'live endpoint says today, which has no memory of what we were aiming at.',
    }),
  });

  return results;
}

function verdictFor(
  actual: number | null,
  target: number,
  minSample: number,
  sample: number | null,
  opts: { short: string; rate?: boolean },
): Pick<TargetResult, 'verdict' | 'note'> {
  if (actual === null) {
    return {
      verdict: 'insufficient_data',
      note: `Not measurable yet — the metric is missing from the payload. ${opts.short}`,
    };
  }

  const hit = actual >= target;

  if ((sample ?? 0) < minSample) {
    return {
      verdict: 'insufficient_data',
      note:
        `${opts.rate ? `${(actual * 100).toFixed(1)}%` : actual} against a target of ` +
        `${opts.rate ? `${(target * 100).toFixed(0)}%` : target}, but only ${sample ?? 0} in the ` +
        `sample — ${minSample} needed before this number means anything. ${opts.short}`,
    };
  }

  return {
    verdict: hit ? 'hit' : 'missed',
    note:
      `${opts.rate ? `${(actual * 100).toFixed(1)}%` : actual} against a target of ` +
      `${opts.rate ? `${(target * 100).toFixed(0)}%` : target}. ${opts.short}`,
  };
}

/** One-line summary for the top of the review email. */
export function summarise(results: TargetResult[]): string {
  const hit = results.filter(r => r.verdict === 'hit').length;
  const missed = results.filter(r => r.verdict === 'missed').length;
  const unknown = results.filter(r => r.verdict === 'insufficient_data').length;
  return `${hit} hit, ${missed} missed, ${unknown} not yet measurable (of ${results.length}).`;
}

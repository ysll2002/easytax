// What each of today's changes is supposed to do, and how we will know.
//
// The point of writing the targets down in code rather than in a document is
// that a week from now the review is arithmetic, not recollection: the same
// function reads the same fields out of /api/admin/daily-metrics and says
// hit / missed / not enough data.
//
// Two things this file learned the hard way, on 2026-09-06.
//
// 1. Targets are per-day rates, never window totals. The first version of this
//    file took `last_7d` at face value. analytics_events had been recording for
//    2.66 days, so a 2.66-day count was compared against a target set for seven
//    — and the baselines it produced were roughly half the real rate. Every
//    count below is now divided by `funnel.data_window.days_of_data` before it
//    is judged, so a short or interrupted collection window changes the
//    confidence in a number without corrupting the number itself.
//
// 2. Where the baselines come from. Site-wide traffic is calibrated against
//    Google Analytics — 77 active users and 90 sessions over the 28 days to
//    2026-09-06, i.e. ~2.75 users/day — because GA is the only source with real
//    history. Per-path and per-channel baselines have to come from
//    analytics_events, which is the only source that breaks traffic down at
//    all. The two do not agree exactly and should not: measured over the same
//    days, analytics_events reads about 1.37x GA, because a first-party POST
//    survives ad blockers that stop googletagmanager.com, and because GA
//    filters bots and this table does not. Same direction, plausible size, no
//    tracking bug — but do not mix the two in one comparison.
//
// The sample-size gates matter more than they look. At ~3 visitors a day almost
// nothing is statistically distinguishable from noise, so a target that
// "passes" on two conversions has told us very little. Every target carries the
// sample it needs before its verdict means anything, and says so plainly.

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

/** Unique visitors needed in the window before a conversion-rate verdict is
 *  worth reporting. At ~3.8 visitors/day that is roughly a fortnight, and the
 *  review will keep saying so until it is reached. */
const MIN_VISITORS_FOR_RATE = 60;

/** Visitors needed before a traffic verdict is better than a coin flip. */
const MIN_VISITORS_FOR_TRAFFIC = 20;

/** Days of production data behind the windowed counts. Defaults to 7 — the
 *  nominal window — only when the endpoint is too old to report it; a wrong
 *  divisor is better than a crash, and the endpoint has reported it since
 *  2026-09-06. */
function daysOfData(payload: MetricsPayload): number {
  const d = num(payload, 'funnel.data_window.days_of_data');
  if (d === null || d <= 0) return 7;
  // Never divide by more than the window the counts came from.
  return Math.min(d, 7);
}

export function evaluateTargets(payload: MetricsPayload): TargetResult[] {
  const days = daysOfData(payload);
  const perDay = (n: number | null): number | null => (n === null ? null : n / days);

  const visitors = num(payload, 'funnel.last_7d.unique_visitors') ?? 0;

  const results: TargetResult[] = [];

  // ── F1 · editorial accountability ────────────────────────────────────────
  // Baseline 1.13/day = 3 visitors over the 2.66 days of data on 2026-09-06.
  const archiveVisitors = visitorsUnderPath(payload, '/tax-tips');
  results.push({
    id: 'F1_archive_reach',
    feature: 'Editorial accountability and review gate',
    goal: 'traffic',
    metric: 'Unique visitors per day to /tax-tips*',
    baseline: 1.13,
    target: 4,
    actual: perDay(archiveVisitors),
    ...verdictFor(perDay(archiveVisitors), 4, MIN_VISITORS_FOR_TRAFFIC, archiveVisitors, {
      short:
        'Authorship, review dates and a stated method are what a search engine looks for on YMYL ' +
        'pages. Ranking changes take four to eight weeks, so week one is a leading indicator, not ' +
        'a verdict. 4/day would be roughly a third of all site traffic reaching the archive.',
      perDay: true,
    }),
  });

  // ── F2 · IndexNow ────────────────────────────────────────────────────────
  // Baseline 0.75/day = 2 search visitors over 2.66 days.
  const search = searchVisitors(payload);
  results.push({
    id: 'F2_search_visitors',
    feature: 'IndexNow instant indexing',
    goal: 'traffic',
    metric: 'Unique visitors per day from search engines',
    baseline: 0.75,
    target: 3,
    actual: perDay(search),
    ...verdictFor(perDay(search), 3, MIN_VISITORS_FOR_TRAFFIC, search, {
      short:
        'Bing, Yandex and Seznam honour IndexNow; Google does not. Judge this on Bing and Yandex ' +
        'share and on pages reported as indexed in Bing Webmaster Tools, not on total search ' +
        'traffic.',
      perDay: true,
    }),
  });

  // ── F3 · deadline-schedule capture ───────────────────────────────────────
  // 0.7/day ≈ 5 a week, which is the volume that makes the list worth emailing
  // on approval day. Against ~3.8 visitors/day that is an ambitious ask.
  const scheduleRequests = num(payload, 'funnel.last_7d.schedule_requested');
  results.push({
    id: 'F3_schedule_requests',
    feature: 'Deadline schedule by email',
    goal: 'revenue',
    metric: 'schedule_requested events per day',
    baseline: 0,
    target: 0.7,
    actual: perDay(scheduleRequests),
    ...verdictFor(perDay(scheduleRequests), 0.7, 1, visitors, {
      short:
        'The old waitlist captured nobody because it offered nothing today; this one sends the ' +
        'visitor their own filing dates within the minute. It also has a second job: 97% of GA ' +
        'active users are new and only 2 people returned in 28 days, so an address is currently ' +
        'the only way anyone comes back at all.',
      perDay: true,
    }),
  });

  // ── F4 · funnel honesty ──────────────────────────────────────────────────
  // A rate, so it needs no per-day normalisation — but it does need a sample.
  const captures = capturesLast7d(payload);
  const captureRate = captures !== null && visitors > 0 ? captures / visitors : null;
  results.push({
    id: 'F4_capture_rate',
    feature: 'Honest funnel and trust signals',
    goal: 'trust',
    metric: 'Share of unique visitors who give us an email address',
    baseline: 0,
    target: 0.1,
    actual: captureRate,
    ...verdictFor(captureRate, 0.1, MIN_VISITORS_FOR_RATE, visitors, {
      short:
        'A third of visitors read /trust and none of them converted, because every ask on the ' +
        'site was for filing HMRC has not approved. The ask is now something we can deliver today.',
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
        'Snapshots are what turned a 2.66-day count into a detectable error rather than a ' +
        'believed one. Without them a review can only read today\'s endpoint, which has no ' +
        'memory of what we were aiming at.',
    }),
  });

  // ── 2026-09-12 round ─────────────────────────────────────────────────────
  // Four of the five below are traffic targets, which is the standing 80/20
  // split. They are also, deliberately, mostly *leading* indicators: at five
  // labelled human page views a day nothing downstream of traffic can be
  // measured yet, and a target that cannot move in a week teaches nothing.

  // ── F26 · the review queue has a UI ──────────────────────────────────────
  // The only target here that is a countdown rather than a count. Baseline 5:
  // the archive last published on 2026-09-07 and this shipped on 09-12.
  const freezeDays = num(payload, 'editorial.days_since_last_publish');
  results.push({
    id: 'F26_publish_freshness',
    feature: 'Editorial review queue UI at /admin/review',
    goal: 'traffic',
    metric: 'Days since the archive last published (lower is better)',
    baseline: 5,
    target: 2,
    actual: freezeDays,
    // Inverted: this one passes by going *down*, so the generic comparison
    // cannot be reused. A queue with nothing in it and nothing published is
    // still a healthy state, which is why the draft count is not the test.
    verdict:
      freezeDays === null
        ? 'insufficient_data'
        : freezeDays <= 2
          ? 'hit'
          : 'missed',
    note:
      freezeDays === null
        ? 'The endpoint did not report editorial.days_since_last_publish.'
        : `Archive last gained a page ${freezeDays} day(s) ago; the gate is only working if this ` +
          'stays at or under 2. The review gate was right and the missing UI made it an outage: ' +
          'the cron wrote a draft every morning from 09-08 and not one of them reached a reader.',
  });

  // ── F27 · llms.txt ───────────────────────────────────────────────────────
  // Baseline 0: the files did not exist before 2026-09-12. Target 3 distinct
  // agents, which is roughly what the RSS feed drew in its first fortnight —
  // ClaudeBot, GPTBot and PerplexityBot all already fetch our feeds, so if the
  // convention is honoured at all by the crawlers we actually have, it should
  // clear this.
  const llmsAgents = num(payload, 'distribution.last_7d.llms.distinct_agents');
  results.push({
    id: 'F27_llms_agents',
    feature: '/llms.txt and /llms-full.txt',
    goal: 'traffic',
    metric: 'Distinct AI crawlers fetching the llms files in 7 days',
    baseline: 0,
    target: 3,
    actual: llmsAgents,
    ...verdictFor(llmsAgents, 3, 1, llmsAgents ?? 0, {
      short:
        'Over the nine days to 2026-09-12 organic search sent ten referred visits and none in the ' +
        'last seventy-two hours, while five named AI crawlers fetched our feeds and calendar ' +
        'twenty times in forty-eight hours. This bets on the channel that has a pulse. It is a ' +
        'convention, not a standard: a zero here means the crawlers ignored it, not that it broke.',
    }),
  });

  // ── F28 · FAQPage and section anchors ────────────────────────────────────
  // Baseline 0.89/day = 8 article search referrals over the 9 days to 09-12.
  // Structured-data effects show up in four to eight weeks, so a week-one
  // reading of this is a leading indicator and the note says so.
  const archiveSearch = visitorsUnderPath(payload, '/tax-tips');
  results.push({
    id: 'F28_archive_search',
    feature: 'Section anchors, contents list and FAQPage structured data',
    goal: 'traffic',
    metric: 'Unique visitors per day to /tax-tips*',
    baseline: 0.89,
    target: 2,
    actual: perDay(archiveSearch),
    ...verdictFor(perDay(archiveSearch), 2, MIN_VISITORS_FOR_TRAFFIC, archiveSearch ?? 0, {
      short:
        'FAQPage is emitted on the 41 of 113 articles whose headings are genuinely questions — ' +
        'marking up the other 72 would risk a manual action on a site whose whole pitch is being ' +
        'trustworthy about tax. Judge at 4-8 weeks on Bing and Google, not at 7 days.',
      perDay: true,
    }),
  });

  // ── F29 · homepage routes into the archive ───────────────────────────────
  // Baseline 0: over the 24 hours in which bot labelling was live, all five
  // human page views were on `/` and none reached an article or a tool.
  const humanViews = num(payload, 'audience.last_7d.human.page_views');
  results.push({
    id: 'F29_homepage_routing',
    feature: 'Answer links from the homepage into the archive',
    goal: 'traffic',
    metric: 'Human page views per day (bot-filtered)',
    baseline: 5,
    target: 8,
    actual: perDay(humanViews),
    ...verdictFor(perDay(humanViews), 8, 1, humanViews ?? 0, {
      short:
        'Every labelled human page view in the first day of bot filtering landed on `/` and went ' +
        'no further. This is the smallest possible test of whether that is a routing problem or ' +
        'simply five people who were never going to read anything.',
      perDay: true,
    }),
  });

  // ── F30 · the numbers that would have caught the freeze ───────────────────
  // audience() already computes this over the same denominator, so read it
  // rather than recomputing: two definitions of "human share" that drift apart
  // is how a metric starts disagreeing with itself.
  const humanShare = num(payload, 'audience.last_7d.human_share');
  results.push({
    id: 'F30_human_share',
    feature: 'Human/bot split and content-freshness in the metrics',
    goal: 'trust',
    metric: 'Share of classified page views that are human',
    baseline: 0.38,
    // Not a target to beat so much as a figure to know. Set at the observed
    // baseline: what matters is that it is reported at all, and that a sudden
    // move in it is visible. 5 of 13 labelled views were human on 2026-09-12.
    target: 0.38,
    actual: humanShare,
    ...verdictFor(humanShare, 0.38, MIN_VISITORS_FOR_RATE, visitors, {
      short:
        'Sixty-two percent of labelled page views were automation. Every rate this project has ' +
        'ever reported was computed over a denominator that included them. This target exists to ' +
        'keep the split in front of the review rather than to be beaten.',
      rate: true,
    }),
  });

  // ── F36/F37 · the site's own title tags, and the crawl that watches them ──
  // `blocking_issues` counts the SEO defects that cost us a result rather than
  // merely look untidy: a sitemap URL that is not 200, a brand repeated in a
  // title, a missing title or canonical, a canonical pointing elsewhere, a
  // noindex page we also listed for crawling, and every page in a
  // duplicate-title set. On 2026-09-14, before the fix, it stood at 128:
  // 122 brand repeats, 2 noindex pages we also listed for crawling, and 4
  // pages sharing a title with another page.
  //
  // Zero is achievable and is the target. Unlike most numbers here it does not
  // depend on anybody visiting, so it is readable at a sample size of one and
  // is the only target this round that can be judged in seven days.
  const blocking = num(payload, 'seo.blocking_issues');
  results.push({
    id: 'F36_seo_blocking_issues',
    feature: 'One source for titles and descriptions, and a daily crawl of the rendered HTML',
    goal: 'traffic',
    metric: 'Blocking SEO defects across every sitemap URL (lower is better)',
    baseline: 128,
    target: 0,
    actual: blocking,
    // Inverted, like F26: this passes by going down.
    verdict: blocking === null ? 'insufficient_data' : blocking === 0 ? 'hit' : 'missed',
    note:
      blocking === null
        ? 'No crawl stored yet. /api/cron/daily writes one each morning into the day\'s snapshot.'
        : `${blocking} blocking defect(s) across the sitemap. Of the 158 URLs crawled on ` +
          '2026-09-14, 122 named the brand twice in one title — 119 of them ending literally ' +
          '"| EasyTax | EasyTax" — and 150 were past the length Google displays. The audit that ' +
          'would have shown this was written on 09-09 and never once called, which is why it ' +
          'now runs from the cron instead of on request.',
  });

  // ── F38 · the pipeline stops competing with itself ───────────────────────
  // Baseline 29: of 116 titles in the archive on 2026-09-14, 29 collided with
  // another article — 3 exact pairs and 23 sharing a subject. The guard cannot
  // unwrite those, so this counts *new* collisions, which should be zero from
  // the day it shipped. A non-zero reading means the guard is not running.
  const dupTitlePages = num(payload, 'seo.problem_counts.brand_repeated_in_title');
  results.push({
    id: 'F38_new_duplicate_titles',
    feature: 'Title-collision guard in the article pipeline',
    goal: 'traffic',
    metric: 'Pages whose title repeats the brand (lower is better)',
    baseline: 122,
    target: 0,
    actual: dupTitlePages,
    verdict: dupTitlePages === null ? 'insufficient_data' : dupTitlePages === 0 ? 'hit' : 'missed',
    note:
      dupTitlePages === null
        ? 'No crawl stored yet.'
        : `${dupTitlePages} page(s) still repeat the brand in the title. Alongside this, ` +
          'STANDARD.maxTitleChars now imports TITLE_BUDGET rather than carrying its own 80, and ' +
          'findTitleCollision refuses a headline the archive already claims.',
  });

  // ── F39 · the calendar, on the page people actually reach ────────────────
  // Baseline 0: `calendar_cta_click` has never fired with placement "home",
  // because the block was only ever on four pages no labelled human has
  // visited. Every human page view in production has been on `/`.
  const calendarClicks = num(payload, 'funnel.last_7d.calendar_cta_click');
  results.push({
    id: 'F39_calendar_from_home',
    feature: 'Calendar subscription block on the homepage',
    goal: 'traffic',
    metric: 'calendar_cta_click in 7 days',
    baseline: 0,
    target: 1,
    actual: calendarClicks,
    ...verdictFor(calendarClicks, 1, 1, calendarClicks ?? 0, {
      short:
        'The .ics feed was fetched 24 times and the RSS/JSON feeds 35 in the four days to ' +
        '2026-09-14, against 8 human page views — machines read this site about six times as ' +
        'often as people do. The subscribe block sat on four pages no human reached. A ' +
        'subscription is also the only recurring relationship available before HMRC approval.',
    }),
  });

  // ── F40 · did our pages actually reach Bing? ─────────────────────────────
  // Bing is half of every search referral this site has ever had and the only
  // engine that honours IndexNow. `submitToIndexNow` has always returned the
  // endpoint's status; until 2026-09-14 it went only into the cron's own HTTP
  // response, so a key file that stopped being reachable would be silent.
  const submitted = num(payload, 'indexnow.submitted');
  results.push({
    id: 'F40_indexnow_accepted',
    feature: 'IndexNow submission receipts in the daily metrics',
    goal: 'traffic',
    metric: 'URLs accepted by IndexNow on the last run',
    baseline: 0,
    target: 100,
    actual: submitted,
    ...verdictFor(submitted, 100, 1, submitted ?? 0, {
      short:
        'Reported, not chased. The number that matters is whether it is zero: a 0 with a 403 ' +
        'means the key file stopped resolving, which is the failure this makes visible. The ' +
        'sitemap carries ~158 URLs and the submission is capped below that.',
    }),
  });

  return results;
}

function fmt(v: number, opts: { rate?: boolean; perDay?: boolean }): string {
  if (opts.rate) return `${(v * 100).toFixed(1)}%`;
  if (opts.perDay) return `${v.toFixed(2)}/day`;
  return String(v);
}

function verdictFor(
  actual: number | null,
  target: number,
  minSample: number,
  sample: number | null,
  opts: { short: string; rate?: boolean; perDay?: boolean },
): Pick<TargetResult, 'verdict' | 'note'> {
  if (actual === null) {
    return {
      verdict: 'insufficient_data',
      note: `Not measurable yet — the metric is missing from the payload. ${opts.short}`,
    };
  }

  const against = `${fmt(actual, opts)} against a target of ${fmt(target, opts)}`;

  if ((sample ?? 0) < minSample) {
    return {
      verdict: 'insufficient_data',
      note:
        `${against}, but only ${sample ?? 0} in the sample — ${minSample} needed before this ` +
        `number means anything. ${opts.short}`,
    };
  }

  return {
    verdict: actual >= target ? 'hit' : 'missed',
    note: `${against}. ${opts.short}`,
  };
}

/** One-line summary for the top of the review email. */
export function summarise(results: TargetResult[]): string {
  const hit = results.filter(r => r.verdict === 'hit').length;
  const missed = results.filter(r => r.verdict === 'missed').length;
  const unknown = results.filter(r => r.verdict === 'insufficient_data').length;
  return `${hit} hit, ${missed} missed, ${unknown} not yet measurable (of ${results.length}).`;
}

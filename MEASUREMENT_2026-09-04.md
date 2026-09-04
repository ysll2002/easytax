# Measurement baseline — 2026-09-04

Baselines for the five changes shipped on branch `claude/happy-tesla-amof3x`.
Review date: **2026-09-11** (one week), or one week after they actually go
live, whichever is later — the comparison is meaningless until the changes are
in production.

Read the numbers from
`GET /api/admin/daily-metrics?key=<AGENT_METRICS_KEY>`.

## Baseline at 2026-09-04T08:06Z

| Metric | Value |
|---|---|
| Signups — total / 7d / 30d | 45 / 0 / 3 |
| HMRC connections — total / 7d | 15 / 1 |
| Bank connections — total | 1 |
| Filings — total | 0 |
| MRR | £0 (HMRC production approval pending) |
| Unique visitors 7d | 3 |
| Page views 7d | 5 |
| register_started / register_completed 7d | 0 / 0 |
| launch_subscribed 7d | 0 |
| launch_subscribers total | 0 |
| trust_viewed 7d | 2 |
| article_cta_click 7d | 0 |
| checker_completed 7d | n/a (page did not exist) |
| Pages indexed (Search Console) | ~1 of 134 submitted |

Signups by month: Apr 1, May 3, Jun 28, Jul 10, Aug 3, Sep 0.

Caveat on the funnel numbers: `analytics_events` only started recording on
2026-09-03, so the 7d window holds about one day of data and all 7 events look
like internal traffic (no referrer, no UTM). Treat visitor counts as a floor,
not a measurement.

## What each change has to show

| # | Change | Metric | Baseline | What success looks like at review |
|---|---|---|---|---|
| F1 | Rolling MTD deadline | homepage `page_view` → `register_started` | 0 / 3 visitors | No stale date on any page (`npm test` enforces this); countdown matches `/timetable` |
| F2 | Truthful HMRC claim | `trust_viewed` / unique visitors | 2 / 3 | Ratio holds or rises — the claim change must not cost trust-page interest |
| F3 | Site-wide footer | Pages indexed in GSC; crawl requests to `/*-alternative` | ~1 of 134 | Indexed count climbing; the 13 landing pages are no longer orphans |
| F4 | Footer launch capture | `launch_subscribed`, `launch_list.by_source` | 0 | Any non-zero result attributable to `source: 'footer'` |
| F5 | `/mtd-checker` | `checker_completed`, then `launch_subscribed` from `source: 'mtd-checker'` | 0 (new) | Completion rate per visitor, and what share of completers leave an address |

## Honest read on what these can prove

At 3 visitors a week, none of these metrics will be statistically meaningful in
seven days. What the review can actually establish:

1. **Did anything break?** Countdown correct, OG card returning 200, no page
   regressions, no drop in the little traffic there is.
2. **Is indexation moving?** This is the one that matters. F3 and F5 are bets
   on discovery, and Search Console coverage is the leading indicator — it
   moves weeks before traffic does.
3. **Does any capture convert at all?** One footer or checker subscriber from
   near-zero traffic is a stronger signal than the absolute number suggests.

If indexed pages are still ~1 of 134 after two weeks, the bottleneck is not
on-site at all and no further on-site SEO work will fix it — the next move
would be off-site (backlinks, directory listings, HMRC's own compatible-software
listing once approval lands), not another landing page. Twelve of those have
been built already and none of them rank.

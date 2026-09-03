# Daily agent run — 2026-09-03

Autonomous run toward the £10,000/month goal. Branch: `claude/practical-cerf-zwvt7p`.
Evaluation due: **2026-09-10** (one week after production deploy — adjust if the merge lands later).

## What the data said (and what it couldn't)

- `GET /api/admin/daily-metrics` is **unreachable from the agent sandbox** — the egress proxy returns `403` for `easytax.vip`. Allowlist `easytax.vip` in the Claude Code environment's network policy so the next run can read signups/HMRC/bank/filing counts. Supabase and GA4 credentials are (correctly) not in the sandbox either, so today's analysis is from the repo, support inbox and the SEO checklist.
- Support inbox signals (only two real customer emails in 45 days, both trust failures):
  - 21 Jul — "why does Connect HMRC show test-user credentials?" → nothing in the product said we were on HMRC's sandbox.
  - 24 Aug — "how to delete easy tax account?" → no self-serve deletion existed.
- Homepage hero was counting down to a hard-coded **5 Aug 2026** deadline; since 6 Aug it has read "0 days until your first MTD ITSA quarterly update". The reminder cron and homepage also said the 5th; HMRC's deadline is the **7th**. The timetable page was right.
- Settings page was three decorative toggles ("Two-factor authentication", "Data sharing") that did nothing.
- `/onboarding` was an orphaned mock form asking for a Government Gateway user ID + password with a fake spinner — a liability during HMRC's review.
- 13 SEO landing pages each had a footer linking only Privacy/Terms — the comparison pages were near-orphans in the internal link graph (SEO_CHECKLIST.md week-1 item: "add an internal link from the homepage or nav").
- Pre-revenue with no way to capture buying intent: the only CTA everywhere was "register", and there was nowhere for a would-be customer to say "tell me when I can actually file".

## The five items shipped

| # | Goal | Item | Metric (how to read it) | Target by 2026-09-10 |
|---|------|------|--------------------------|----------------------|
| 1 | Revenue pipeline + trust | **Founder-price launch list** — `POST /api/waitlist`, `LaunchWaitlist` component on `/pricing` (email input) and dashboard home (one-click, prefilled). Dashboard card also states plainly that we are on HMRC's test environment (hidden when `HMRC_ENV=production`). Confirmation email to the user, owner notified if the table is missing. | Supabase `launch_waitlist` rows (`waitlist` block in daily-metrics: total / 24h / 7d / by_source). GA4 event `waitlist_joined` by `source`. | ≥ 10 signups; ≥ 25 % of dashboard visitors click reserve |
| 2 | Traffic | **`/mtd-checker`** — free "Does MTD apply to me?" two-question tool with verdict, quarterly deadlines, penalty warning, FAQ + WebApplication JSON-LD. Linked from homepage hero, footer, mtd-software FAQ. CTA → `/register?ref=mtd-checker`. | GA4: pageviews of `/mtd-checker`; events `mtd_check_started` → `mtd_check_completed` (completion rate) → `mtd_check_cta_click`; registrations with `page_referrer` containing `ref=mtd-checker`. GSC: impressions for "does making tax digital apply to me", "mtd checker". | ≥ 60 % completion; ≥ 10 % CTA click; indexed in GSC |
| 3 | Traffic (SEO) | **Site-wide `SiteFooter`** with the full internal link graph (Product / Guides / Compare / Company) on 16 public pages; dead `#` Twitter link removed. | GSC → Pages: count of the 14 landing pages reporting "URL is on Google" (baseline: check today). GSC impressions for the 5 pages shipped 2026-08-31. GA4: sessions whose landing page is a comparison page. | All 14 landing pages indexed; +30 % impressions on comparison pages vs prior week |
| 4 | Trust | **Self-serve account deletion + honest Settings** — `DELETE /api/profile/delete` (erases sa_filings, bank_connections, hmrc_connections, launch_waitlist, profiles; owner notified for the GDPR log), `DeleteAccountCard` with typed confirmation, Settings rewritten to show only real things (reminders on, security facts, export, delete, contact). `/onboarding` mock now redirects to the real HMRC OAuth step. | GA4 events `account_delete_opened`, `account_deleted`, `account_delete_failed`. Support inbox: deletion / "is this real HMRC?" emails. | 0 support emails about deletion or sandbox confusion; `account_delete_failed` = 0 |
| 5 | Trust + conversion | **Rolling MTD deadline engine** — `lib/mtd-deadlines.ts` is the single source of truth (7 Aug / 7 Nov / 7 Feb / 7 May). Homepage pill + announcement bar now show the real next deadline in all 7 locales; reminder cron copy fixed to the 7th; Settings shows the user's next deadline. | GA4: homepage → `/register` click-through (sessions with `page_location` = `/` that reach `/register`), homepage bounce rate, vs the prior 7 days. | Homepage → register CTR up ≥ 15 % relative; bounce rate down |

## Baselines to record on deploy day

Fill these in from GA4 / GSC / daily-metrics the day the branch reaches production:

- Signups total / last 7d: …
- HMRC connections total / conversion: …
- GA4 last 7d: homepage sessions …, `/register` views …, homepage → register CTR …
- GSC: indexed landing pages … / 14; impressions last 7d on the 5 pages shipped 2026-08-31: …

## Owner actions required

1. **Merge + deploy** (production deploys on push to `staging`, see `.github/workflows/deploy-production.yml`):
   ```
   git fetch origin && git checkout staging && git merge origin/claude/practical-cerf-zwvt7p && git push origin staging
   ```
2. **Create the waitlist table** in Supabase (until then signups fall back to an email to the owner and still work):
   ```sql
   create table if not exists public.launch_waitlist (
     id          uuid primary key default gen_random_uuid(),
     email       text not null unique,
     name        text,
     source      text not null default 'other',
     user_id     uuid references public.profiles(id) on delete set null,
     created_at  timestamptz not null default now()
   );
   alter table public.launch_waitlist enable row level security;
   -- service role bypasses RLS; no anon policies needed.
   ```
3. **Allowlist `easytax.vip`** in the Claude Code environment network policy so the daily run can read `/api/admin/daily-metrics`.
4. Optional: merge `origin/claude/easytax-conversion-analysis-5dtpyn` (GA4 funnel in daily-metrics; needs `GA_PROPERTY_ID` + `GA_SERVICE_ACCOUNT_JSON` env vars) so the week-1 evaluation can be automated.

## Flagged, not changed (owner's call)

- Marketing copy says "HMRC-recognised" (homepage trust bar/badge, mtd-software, self-assessment-software) while production approval is pending. If HMRC's reviewers read the site, this is the first thing they'll query. Suggest "Built on HMRC's MTD APIs · production approval in progress" until the letter arrives.
- Privacy policy lists ICO registration as "Pending" and Stripe as the payment processor; neither is live.

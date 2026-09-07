-- Editorial accountability and the weekly growth scorecard — 2026-09-06
--
-- Context. /api/cron/daily-article asks Claude for a topic, asks Claude for an
-- article, and inserts it straight into `tax_articles`. Nothing reads it before
-- it is live, in the sitemap and indexable. That has produced 140 published
-- pages of UK tax guidance — the most Your-Money-Your-Life category there is —
-- carrying no author, no reviewer and no stated method, and the archive draws
-- roughly three page views a week. Scaled, unreviewed, unattributed YMYL
-- content is the single best explanation we have for that.
--
-- This migration adds the state needed to (a) hold new articles for review
-- before they are indexable, and (b) keep dated snapshots of the growth metrics
-- so a week-on-week review is arithmetic rather than recollection.
--
-- Additive only: no existing column is altered or dropped, and every default is
-- chosen so that the currently-live behaviour is preserved for existing rows.
-- Safe to run against production while the current build is serving.
--
-- Run in the Supabase SQL editor (Dashboard → SQL Editor → New query).

-- ─────────────────────────────────────────────────────────────────────────
-- tax_articles: review state
--
-- `review_status` defaults to 'published' so all 140 existing rows keep
-- exactly the visibility they have today — this migration must not be able to
-- empty the archive. The cron is what changes: from now on it inserts 'draft'
-- explicitly, so only new articles wait for a person.
--
-- The application treats a missing column as "everything is published" and
-- keeps serving, so it does not matter whether the code or this migration
-- lands first.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.tax_articles
  add column if not exists review_status text not null default 'published';

alter table public.tax_articles
  add column if not exists reviewed_at timestamptz;

alter table public.tax_articles
  add column if not exists reviewed_by text;

-- What the draft was generated from, and which HMRC/legislation references the
-- generator was told to ground it in. Rendered on the page as a Sources block:
-- a reader — and a search engine — can see where a claim came from.
alter table public.tax_articles
  add column if not exists sources jsonb;

-- Constrain after the column exists, so re-running is a no-op rather than an
-- error. 'draft' -> awaiting review. 'published' -> live. 'rejected' -> never
-- goes live, kept so the same topic is not generated again next week.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tax_articles_review_status_check'
  ) then
    alter table public.tax_articles
      add constraint tax_articles_review_status_check
      check (review_status in ('draft', 'published', 'rejected'));
  end if;
end $$;

-- Every reader filters on this column, including the sitemap.
create index if not exists tax_articles_review_status_idx
  on public.tax_articles (review_status, published_at desc);

-- ─────────────────────────────────────────────────────────────────────────
-- growth_snapshots
--
-- One row per day, holding the whole /api/admin/daily-metrics payload. Without
-- it, "did last week's changes work?" can only be answered from whatever the
-- live endpoint happens to say today, which has no memory: the endpoint's own
-- `previous_7d` block is derived from events and cannot capture targets that
-- were set before the events existed.
--
-- `label` marks the snapshot a review compares against, e.g. 'baseline
-- 2026-09-06'. Payload is the raw JSON so a future review can ask questions we
-- have not thought of yet.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.growth_snapshots (
  id           uuid primary key default gen_random_uuid(),
  taken_on     date        not null default current_date,
  label        text,
  payload      jsonb       not null,
  created_at   timestamptz not null default now()
);

-- One snapshot per day. A cron that fires twice, or a manual re-run, overwrites
-- rather than producing two rows that a week-on-week diff would have to choose
-- between.
create unique index if not exists growth_snapshots_taken_on_key
  on public.growth_snapshots (taken_on);
create index if not exists growth_snapshots_created_at_idx
  on public.growth_snapshots (created_at desc);

alter table public.growth_snapshots enable row level security;

-- ─────────────────────────────────────────────────────────────────────────
-- launch_subscribers: what the address was given in exchange for
--
-- The list is no longer only "tell me when it launches". An address captured by
-- the deadline-schedule tool was given for a specific, deliverable reason, and
-- consent for that is not consent for everything else — recording the intent is
-- what lets the sender honour the difference (PECR reg. 22).
--
-- Existing rows are backfilled to 'launch_notify', which is what they actually
-- agreed to.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.launch_subscribers
  add column if not exists intent text not null default 'launch_notify';

-- The tax year the schedule was generated for, and the income band that
-- determined it. Lets a reminder send the right dates to the right person
-- without re-asking.
alter table public.launch_subscribers
  add column if not exists schedule_tax_year int;

alter table public.launch_subscribers
  add column if not exists qualifying_income numeric;

create index if not exists launch_subscribers_intent_idx
  on public.launch_subscribers (intent, created_at desc);

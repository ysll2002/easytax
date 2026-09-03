-- Growth instrumentation — 2026-09-03
--
-- Adds the two tables the growth work depends on. Both are additive: no
-- existing table is touched, so this is safe to run against production while
-- the current build is live. The application code treats a missing table as
-- "tracking disabled" and keeps serving, so the deploy order does not matter.
--
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).

-- ─────────────────────────────────────────────────────────────────────────
-- analytics_events
--
-- Why: today the only funnel evidence is profiles / hmrc_connections /
-- bank_connections row counts. That makes every step *before* signup — landing
-- page view, pricing view, register form started, register form abandoned —
-- invisible, so there is no way to tell whether a change moved anything.
-- GA is client-side only and cannot be queried from the daily agent.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.analytics_events (
  id            uuid primary key default gen_random_uuid(),
  name          text        not null,
  -- Null for logged-out visitors. Not a FK: events must survive account
  -- deletion, and an FK would make the insert fail on a stale id.
  user_id       uuid,
  -- Random id generated in the browser and kept in localStorage. Lets us
  -- stitch a session together without a cookie banner. Not a device
  -- fingerprint and never derived from IP or user agent.
  anon_id       text,
  path          text,
  referrer      text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  props         jsonb       not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_name_created_idx on public.analytics_events (name, created_at desc);
create index if not exists analytics_events_anon_idx on public.analytics_events (anon_id);
create index if not exists analytics_events_user_idx on public.analytics_events (user_id);

-- Writes go through the service-role key in /api/track, which bypasses RLS.
-- Enabling RLS with no policy therefore blocks anon/authenticated clients from
-- reading or writing the table directly, which is what we want.
alter table public.analytics_events enable row level security;

-- ─────────────────────────────────────────────────────────────────────────
-- launch_subscribers
--
-- Why: HMRC production approval is pending, so a visitor who is interested
-- today cannot be converted today. Without a capture they leave and are
-- unreachable, which is why 5 months of traffic produced 45 accounts and no
-- reachable pipeline. This is the list to email on approval day.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.launch_subscribers (
  id            uuid primary key default gen_random_uuid(),
  email         text        not null,
  -- 'sole_trader' | 'landlord' | 'limited_company' | 'accountant' | 'other'
  segment       text,
  -- Which page the address was captured on, e.g. 'home', 'pricing'.
  source        text,
  referrer      text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  -- Set when the launch announcement goes out, so a resend cannot double-send.
  notified_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- Case-insensitive uniqueness: Gmail addresses arrive in mixed case and a
-- plain unique(email) would let the same person subscribe several times.
create unique index if not exists launch_subscribers_email_key
  on public.launch_subscribers (lower(email));
create index if not exists launch_subscribers_created_at_idx
  on public.launch_subscribers (created_at desc);

alter table public.launch_subscribers enable row level security;

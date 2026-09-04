-- Email compliance and send-safety — 2026-09-04
--
-- Context: /api/cron/mtd-reminder emails every row in `profiles` with no
-- opt-out link and no guard against sending the same reminder twice. Under
-- PECR reg. 22 and UK GDPR art. 21 a marketing email must carry a working
-- unsubscribe, and honouring an opt-out is not optional. This migration adds
-- the two pieces of state that needs.
--
-- Additive only: no existing column is altered or dropped, so it is safe to
-- run against production while the current build is live. The application
-- treats a missing column/table as "no one has opted out, dedupe disabled"
-- and keeps serving, so deploy order does not matter.
--
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).

-- ─────────────────────────────────────────────────────────────────────────
-- profiles.reminder_opt_out
--
-- Set when someone clicks the unsubscribe link in a reminder email. The cron
-- filters on it. Defaults to false so every existing row keeps its current
-- (opted-in) behaviour.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists reminder_opt_out boolean not null default false;

create index if not exists profiles_reminder_opt_out_idx
  on public.profiles (reminder_opt_out)
  where reminder_opt_out = false;

-- ─────────────────────────────────────────────────────────────────────────
-- email_sends
--
-- One row per (address, campaign). The unique index is the dedupe guard: the
-- cron inserts before sending, and a duplicate-key error means "already sent,
-- skip". That makes a double-fired cron — or a manual re-run — harmless,
-- which matters because Vercel cron delivery is at-least-once.
--
-- Campaign keys are scoped to the specific send, e.g. 'mtd-reminder:2026-Q2',
-- so next quarter's reminder is a different campaign and goes out normally.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.email_sends (
  id          uuid primary key default gen_random_uuid(),
  email       text        not null,
  campaign    text        not null,
  -- 'sent' once the provider accepted it, 'failed' if it did not. Recorded so
  -- a failed send can be retried without unblocking a successful one.
  status      text        not null default 'sent',
  error       text,
  created_at  timestamptz not null default now()
);

create unique index if not exists email_sends_email_campaign_key
  on public.email_sends (lower(email), campaign);
create index if not exists email_sends_campaign_idx
  on public.email_sends (campaign, created_at desc);

-- Writes go through the service-role key in the cron route, which bypasses
-- RLS. Enabling RLS with no policy blocks anon/authenticated clients from
-- reading the send log directly, which is what we want — it contains addresses.
alter table public.email_sends enable row level security;

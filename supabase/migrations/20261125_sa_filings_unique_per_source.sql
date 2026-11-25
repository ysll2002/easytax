-- One quarterly filing per income source and period, not one per period.
--
-- 20261124_property_records added income_source to sa_filings, but the
-- unique index on quarterly filings still keyed on the period alone. A
-- self-employment update for 6 Apr – 5 Jul 2026 filed after a foreign
-- property update for the same quarter was accepted by HMRC, and then its
-- sa_filings row was refused as a duplicate, so the link to its records (and
-- the lock on them) was lost. Found in a sandbox run on staging, 2026-11-25.
--
-- Needs 20261124_property_records first (income_source).

drop index if exists idx_sa_filings_unique_quarter;

create unique index idx_sa_filings_unique_quarter on public.sa_filings (
  user_id,
  coalesce(client_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(income_source, 'self-employment'),
  tax_year,
  period_start,
  period_end
) where filing_type = 'quarterly';

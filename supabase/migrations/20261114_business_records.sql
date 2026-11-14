-- Business records: the customer's digital record for MTD quarterly updates.
--
-- Replaces bank-feed (Plaid) transactions as the source of quarterly figures:
-- EasyTax does not hold an AISP permission, so records are entered by hand or
-- imported from a CSV statement the customer downloads from their bank.
--
-- amount is signed: + money in, - money out.
-- category says whether a record counts towards the business at all;
-- expense_bucket is the HMRC self-employment expense category for
-- business_expense records (null = derive from the description).
create table if not exists public.business_records (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  txn_date       date not null,
  description    text not null,
  amount         numeric(14,2) not null,
  category       text not null default 'unreviewed'
                 check (category in ('unreviewed', 'business_income', 'business_expense', 'personal')),
  expense_bucket text
                 check (expense_bucket is null or expense_bucket in (
                   'costOfGoods', 'staffCosts', 'travelCosts', 'premisesRunningCosts',
                   'adminCosts', 'advertisingCosts', 'professionalFees', 'otherExpenses')),
  source         text not null default 'manual' check (source in ('manual', 'csv')),
  -- Set for CSV rows so re-importing the same statement does not duplicate them.
  import_hash    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists business_records_user_date_idx on public.business_records (user_id, txn_date desc);
create unique index if not exists business_records_user_import_hash_key
  on public.business_records (user_id, import_hash) where import_hash is not null;

-- Server-side access only (service_role), like every other table.
alter table public.business_records enable row level security;

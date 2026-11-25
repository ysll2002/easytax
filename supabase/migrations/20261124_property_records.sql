-- Property income in the digital record.
--
-- MTD for Income Tax quarterly updates for UK and foreign property must be
-- built from the customer's digital records, the same as self-employment
-- (no manual keying in the submission). Records now say which income source
-- they belong to and, for property, which HMRC property category.
--
-- business_records.income_source   self-employment (all existing rows) |
--                                  uk-property | foreign-property
-- business_records.property_bucket HMRC Property Business category, for
--                                  property income and expense records
-- business_records.property_id     foreign property: the propertyId HMRC
--                                  issued for the property (Create Foreign
--                                  Property Details), from 2026-27
-- sa_filings.income_source / business_id  which business a filing was for
--
-- The filed-quarter lock (20261121_lock_filed_records) now applies per income
-- source: filing a property quarter locks that quarter's property records,
-- not the self-employment ones, and the reverse.

alter table public.business_records
  add column if not exists income_source text not null default 'self-employment';
alter table public.business_records drop constraint if exists business_records_income_source_check;
alter table public.business_records
  add constraint business_records_income_source_check
  check (income_source in ('self-employment', 'uk-property', 'foreign-property'));

alter table public.business_records add column if not exists property_bucket text;
alter table public.business_records drop constraint if exists business_records_property_bucket_check;
alter table public.business_records
  add constraint business_records_property_bucket_check
  check (property_bucket is null or property_bucket in (
    'rent', 'premiumsOfLeaseGrant', 'reversePremiums', 'otherIncome', 'rentARoom',
    'premisesRunningCosts', 'repairsAndMaintenance', 'financialCosts', 'professionalFees',
    'costOfServices', 'travelCosts', 'residentialFinancialCost', 'other'));

alter table public.business_records add column if not exists property_id text;

alter table public.sa_filings add column if not exists income_source text not null default 'self-employment';
alter table public.sa_filings add column if not exists business_id text;

create or replace function public.business_record_in_filed_quarter(p_user uuid, p_client uuid, p_date date, p_source text default 'self-employment')
returns boolean language sql stable as $$
  select exists (
    select 1 from public.sa_filings f
    where f.user_id = p_user
      and f.client_id is not distinct from p_client
      and f.filing_type = 'quarterly'
      and f.income_source = coalesce(p_source, 'self-employment')
      and p_date between f.period_start and f.period_end
  );
$$;

create or replace function public.business_records_lock()
returns trigger language plpgsql as $$
begin
  if tg_op in ('UPDATE', 'DELETE')
     and public.business_record_in_filed_quarter(old.user_id, old.client_id, old.txn_date, old.income_source) then
    raise exception 'RECORD_LOCKED: record % is in a quarter already filed with HMRC', old.id using errcode = 'P0001';
  end if;
  if tg_op in ('INSERT', 'UPDATE')
     and public.business_record_in_filed_quarter(new.user_id, new.client_id, new.txn_date, new.income_source) then
    raise exception 'RECORD_LOCKED: % is in a quarter already filed with HMRC', new.txn_date using errcode = 'P0001';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

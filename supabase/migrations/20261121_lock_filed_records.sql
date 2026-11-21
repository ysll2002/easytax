-- Records behind a filed quarterly update are locked.
--
-- MTD ITSA keeps a digital link from each submission to the records it was
-- built from. Once a quarter has been filed with HMRC, the records dated in
-- that quarter can no longer be added to, edited or deleted. Corrections go
-- into the current quarter as new records instead.
--
-- sa_filings.record_ids  the records each quarterly update was built from.
-- business_records trigger  refuses insert / update / delete in a filed
--                           quarter for the same owner (user, or user +
--                           agent client). The API checks first and gives a
--                           friendly message; this is the backstop.
-- business_records.client_id  no longer cascades: removing an agent client
--                           must not silently delete their records.

alter table public.sa_filings add column if not exists record_ids uuid[];

create or replace function public.business_record_in_filed_quarter(p_user uuid, p_client uuid, p_date date)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.sa_filings f
    where f.user_id = p_user
      and f.client_id is not distinct from p_client
      and f.filing_type = 'quarterly'
      and p_date between f.period_start and f.period_end
  );
$$;

create or replace function public.business_records_lock()
returns trigger language plpgsql as $$
begin
  if tg_op in ('UPDATE', 'DELETE')
     and public.business_record_in_filed_quarter(old.user_id, old.client_id, old.txn_date) then
    raise exception 'RECORD_LOCKED: record % is in a quarter already filed with HMRC', old.id using errcode = 'P0001';
  end if;
  if tg_op in ('INSERT', 'UPDATE')
     and public.business_record_in_filed_quarter(new.user_id, new.client_id, new.txn_date) then
    raise exception 'RECORD_LOCKED: % is in a quarter already filed with HMRC', new.txn_date using errcode = 'P0001';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists business_records_lock on public.business_records;
create trigger business_records_lock
  before insert or update or delete on public.business_records
  for each row execute function public.business_records_lock();

alter table public.business_records drop constraint if exists business_records_client_id_fkey;
alter table public.business_records
  add constraint business_records_client_id_fkey
  foreign key (client_id) references public.agent_clients(id) on delete restrict;

-- Records sorted automatically by AI after a CSV import (or with "Sort with
-- AI") are flagged so the customer can see which ones to check. The flag is
-- cleared as soon as the customer changes the record's category or expense
-- type themselves.
alter table public.business_records
  add column if not exists ai_categorised boolean not null default false;

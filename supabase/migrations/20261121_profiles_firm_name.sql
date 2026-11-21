-- The accounting firm an agent account belongs to, asked for at agent sign-up
-- (/agent/register) or, for agents who signed up with Google, on first visit
-- to the agent dashboard. Null for individual accounts.
alter table public.profiles add column if not exists firm_name text
  check (firm_name is null or char_length(firm_name) between 2 and 120);

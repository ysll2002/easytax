-- Individual and agent accounts are separate. The type is chosen at sign-up
-- (/register or /agent/register) and fixed: one email is one account of one
-- type. Individuals see the Self Assessment dashboard; agents see their
-- clients. Every existing account was an individual one.
alter table public.profiles
  add column if not exists account_type text not null default 'individual'
  check (account_type in ('individual', 'agent'));

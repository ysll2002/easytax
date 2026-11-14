-- Agent mode: an EasyTax user acting as an HMRC-registered agent (Agent
-- Services Account) for their own clients.
--
-- agent_connections  the agent's HMRC OAuth token (agent Government Gateway)
--                    and Agent Reference Number. Kept apart from
--                    hmrc_connections, which is the user's own taxpayer
--                    connection: one person can be both.
-- agent_clients      the agent's clients and the state of each HMRC
--                    authorisation (Agent Authorisation API invitations).
-- business_records.client_id / sa_filings.client_id
--                    records and filings the agent keeps for a client.
--                    NULL = the user's own.

create table if not exists public.agent_connections (
  user_id          uuid primary key references public.profiles(id) on delete cascade,
  arn              text not null check (arn ~ '^[A-Z]ARN[0-9]{7}$'),
  access_token     text,
  refresh_token    text,
  token_expires_at timestamptz,
  connected_at     timestamptz,
  created_at       timestamptz not null default now()
);

create table if not exists public.agent_clients (
  id                     uuid primary key default gen_random_uuid(),
  agent_user_id          uuid not null references public.profiles(id) on delete cascade,
  display_name           text not null,
  client_type            text not null default 'personal' check (client_type in ('personal', 'business')),
  -- Income Tax (MTD-IT)
  nino                   text,
  postcode               text,
  business_id            text,
  itsa_agent_type        text not null default 'main' check (itsa_agent_type in ('main', 'supporting')),
  itsa_status            text not null default 'none'
                         check (itsa_status in ('none', 'pending', 'authorised', 'rejected', 'expired', 'cancelled', 'deauthorised')),
  itsa_invitation_id     text,
  itsa_client_action_url text,
  itsa_expires_on        timestamptz,
  -- VAT (MTD-VAT)
  vrn                    text,
  vat_reg_date           date,
  vat_status             text not null default 'none'
                         check (vat_status in ('none', 'pending', 'authorised', 'rejected', 'expired', 'cancelled', 'deauthorised')),
  vat_invitation_id      text,
  vat_client_action_url  text,
  vat_expires_on         timestamptz,
  last_checked_at        timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create unique index if not exists agent_clients_agent_nino_key on public.agent_clients (agent_user_id, nino) where nino is not null;
create unique index if not exists agent_clients_agent_vrn_key  on public.agent_clients (agent_user_id, vrn)  where vrn  is not null;
create index if not exists agent_clients_agent_idx on public.agent_clients (agent_user_id, created_at desc);

alter table public.business_records add column if not exists client_id uuid references public.agent_clients(id) on delete cascade;
create index if not exists business_records_client_date_idx on public.business_records (client_id, txn_date desc) where client_id is not null;
-- Re-importing a statement is de-duplicated per records owner: the user's
-- own records, or one of their clients'.
drop index if exists public.business_records_user_import_hash_key;
create unique index if not exists business_records_owner_import_hash_key
  on public.business_records (user_id, coalesce(client_id, '00000000-0000-0000-0000-000000000000'::uuid), import_hash)
  where import_hash is not null;

-- Filings an agent makes for a client are kept even if the client is
-- removed, so no cascade.
alter table public.sa_filings add column if not exists client_id uuid references public.agent_clients(id);
drop index if exists public.idx_sa_filings_unique_quarter;
create unique index if not exists idx_sa_filings_unique_quarter
  on public.sa_filings (user_id, coalesce(client_id, '00000000-0000-0000-0000-000000000000'::uuid), tax_year, period_start, period_end)
  where filing_type = 'quarterly';

alter table public.agent_connections enable row level security;
alter table public.agent_clients enable row level security;

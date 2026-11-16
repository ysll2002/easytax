-- Every call EasyTax makes to HMRC's Agent Authorisation API: which
-- endpoint, when, HMRC's status code and correlation id. HMRC asks for
-- evidence of testing (endpoint + timestamp) before granting production
-- access, and it helps answer HMRC support questions later.
-- No client personal data is stored: the path holds the agent's ARN and
-- HMRC's invitation id only.
create table if not exists public.agent_api_log (
  id             bigserial primary key,
  arn            text,
  method         text not null,
  endpoint       text not null,
  path           text not null,
  http_status    integer,
  correlation_id text,
  created_at     timestamptz not null default now()
);
create index if not exists agent_api_log_created_idx on public.agent_api_log (created_at desc);
alter table public.agent_api_log enable row level security;

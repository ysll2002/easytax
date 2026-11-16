-- Every call EasyTax makes to HMRC's MTD APIs on a taxpayer's behalf (the
-- shared hmrcFetch in lib/hmrc.ts): HMRC's endpoint name, method, path, HTTP
-- status, correlation id and time. HMRC's Software Developer Support Team
-- asks for endpoint + timestamp evidence when an application adds APIs, and
-- it answers "what did we send, when" for support questions.
-- The National Insurance number in a path is masked as {nino}; VRNs are
-- masked as {vrn}. No request or response bodies are stored.
create table if not exists public.hmrc_api_log (
  id             bigserial primary key,
  user_id        uuid,
  api            text,
  endpoint       text not null,
  method         text not null,
  path           text not null,
  http_status    integer,
  correlation_id text,
  created_at     timestamptz not null default now()
);
create index if not exists hmrc_api_log_created_idx on public.hmrc_api_log (created_at desc);
alter table public.hmrc_api_log enable row level security;

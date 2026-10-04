-- Staged rewrites of already-published articles.
--
-- The archive is 114 articles of 573–724 words with one citation between them.
-- Fixing that means rewriting pages that are already live, indexed and in the
-- sitemap — which must not mean pulling them down while a rewrite waits for
-- review. So the upgrade is written alongside the live copy rather than over
-- it: the reader keeps seeing the published article until a human promotes the
-- replacement in /api/admin/article-review.
--
-- Nullable and additive, so deploying the code before running this is safe —
-- the upgrade pass detects the missing columns and skips, rather than failing
-- the daily cron.

alter table public.tax_articles
  add column if not exists pending_content      text,
  add column if not exists pending_excerpt      text,
  add column if not exists pending_title        text,
  add column if not exists pending_sources      jsonb,
  add column if not exists pending_generated_at timestamptz;

-- The upgrade queue is "articles with a rewrite waiting", which is the only
-- query the review endpoint runs against these columns.
create index if not exists tax_articles_pending_idx
  on public.tax_articles (pending_generated_at desc)
  where pending_generated_at is not null;

comment on column public.tax_articles.pending_content is
  'A generated rewrite awaiting human review. The live page keeps serving content/excerpt/title until this is promoted.';

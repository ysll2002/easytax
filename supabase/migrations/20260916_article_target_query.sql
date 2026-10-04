-- The search each article was commissioned to answer.
--
-- `/api/cron/daily-article` has picked a target query from lib/search-queries.ts
-- since 2026-09-08 and handed it to the model as the exact question the piece
-- must answer. F44 (2026-09-15) went further and fails the headline in quality
-- review if it does not cover that query. The query itself was never stored, so
-- the pipeline knew what question each page answers and the page did not.
--
-- Nullable with no default, deliberately. The 113 rows written before this
-- column existed genuinely have no stored assignment, and a backfill would be a
-- guess recorded as a fact — the exact failure this project keeps writing
-- comments about. lib/article-question.ts falls back to matching those titles
-- against the curated list with `coversQuery`, at render time, and reports the
-- difference as `source: 'matched'` rather than `'stored'`.

alter table public.tax_articles
  add column if not exists target_query text;

comment on column public.tax_articles.target_query is
  'The lib/search-queries.ts query string this article was commissioned to answer. '
  'Null for articles written before 2026-09-16, whose question is inferred at render '
  'time instead. Used to render the Q&A block and its FAQPage structured data.';

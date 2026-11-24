-- Rebrand: EasyTax → MTD Buddy, in published article text.
--
-- Run on switch day, together with the deploy that renames the site. Not
-- before: until then the site is still EasyTax and the articles should match.
--
-- Scope, checked read-only against production on 2026-11-24:
--   tax_articles: 129 rows; 22 mention "EasyTax" in `content`, always with
--   that exact casing. None in `title` or `excerpt`; none mention
--   easytax.vip anywhere.
--
-- Idempotent: a second run matches nothing.

begin;

update public.tax_articles
set content = replace(content, 'EasyTax', 'MTD Buddy')
where content like '%EasyTax%';

-- Expect 0.
select count(*) as still_mentioning_easytax
from public.tax_articles
where content like '%EasyTax%' or title like '%EasyTax%' or excerpt like '%EasyTax%';

commit;

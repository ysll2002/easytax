# SEO Checklist — EasyTax

Practical dated checklist for measuring the effect of the 5 new SEO pages
(`/sage-alternative`, `/kashflow-alternative`, `/crunch-alternative`,
`/taxscouts-alternative`, `/mtd-software`) and the homepage JSON-LD schema
that shipped on **2026-08-31**.

SEO is a slow feedback loop. Don't judge results earlier than 2 weeks.

---

## Immediate — today (2026-08-31)

- [ ] **GSC → URL Inspection → Request Indexing** for each new page (~15 min)
  - https://easytax.vip/sage-alternative
  - https://easytax.vip/kashflow-alternative
  - https://easytax.vip/crunch-alternative
  - https://easytax.vip/taxscouts-alternative
  - https://easytax.vip/mtd-software
- [ ] **GSC → Sitemaps** → resubmit `https://easytax.vip/sitemap.xml`
- [ ] **Bing Webmaster Tools** → same URL submission + sitemap resubmit
- [ ] **Rich Results Test** — https://search.google.com/test/rich-results → input `https://easytax.vip` → confirm both **FAQPage** and **SoftwareApplication** are valid
- [ ] **Sanity check robots.txt** — https://easytax.vip/robots.txt — none of the new paths should be blocked

## Week 1 — by 2026-09-07

- [ ] GSC → URL Inspection on each new URL → status should be **"URL is on Google"**
- [ ] If any page shows "Discovered — currently not indexed" after 7 days, add an internal link to it from the homepage or nav, then re-request indexing
- [ ] Bing usually indexes faster than Google — new pages should show up in Bing search within a week

## Week 2-4 — by 2026-09-28

- [ ] **GSC → Performance → Queries**, filter by these target keywords:
  - `sage alternative`, `sage accounting alternative`
  - `kashflow alternative`
  - `crunch alternative`, `crunch accounting alternative`
  - `taxscouts alternative`, `taxscouts vs`
  - `mtd software`, `mtd itsa software`, `making tax digital software`
- [ ] **Expected at this stage:** 5-100 impressions per query, position 40-80, near-zero clicks. That's normal — you're being *seen* but not *clicked*.
- [ ] Compare shape of impression curve to the already-live `bokio-alternative` / `freeagent-alternative` pages — the new ones should behave similarly in the first month.

## Month 2 — by 2026-10-31

- [ ] **GSC → Performance → Pages tab**, filter for each new URL:
  - Impressions trend should be *rising*, not flat at 0
  - "Best queries" tells you which keyword variants Google associates with each page
- [ ] **GA4 → Acquisition → Traffic Acquisition** — filter `sessionSource = google` → count sessions per landing page
- [ ] **Warning sign:** 4 weeks post-indexing, still 0 impressions on target keywords → the page is thin. Add real screenshots, a full pricing-comparison table, more FAQ entries, at least one long-form section (500+ words).

## Month 3 — by 2026-11-30 — Decision Point

For each of the 5 new pages, categorise:

| Signal | Meaning | Action |
|---|---|---|
| >100 impressions, position < 30 | Working | Double down: add content depth, chase backlinks pointing at that URL |
| <20 impressions, position > 60 | Stalling | Rewrite with more depth, or drop and reposition |
| Zero impressions | Broken | Re-inspect index status, check for a `noindex` slip, check `robots.txt` |

- [ ] Google search `"easytax"` (with quotes) → any rich snippets (FAQ accordion, software rating) visible? That confirms the JSON-LD schema is being picked up.

## Month 6 — by 2027-02-28 — Backlinks

- [ ] **Ahrefs / Semrush free tier** → look up `easytax.vip` → count referring domains
- [ ] **If referring domains < 10 after 6 months:** links are your bottleneck, not on-page SEO. Ways to fix:
  - Guest post on 2-3 UK finance/accounting blogs
  - Answer honestly (not spammily) in r/UKPersonalFinance, r/UKFreelancers
  - Product Hunt launch when you're happy with polish
  - Indie Hackers post ("How I built EasyTax…")
  - Show HN on Hacker News
- [ ] Positive signal: 3-5 referring domains from real UK sites → SEO compounding is starting

## Weekly ritual — every Sunday (15 min)

- [ ] Scan GSC dashboard for red flags: sudden ranking drops, security warnings, coverage errors
- [ ] GA4 landing pages — any surprise winners worth expanding?

---

## Red flags to watch out for

- **Cannibalisation** — multiple pages ranking on the same query. Google can't decide which to show, both rank badly. Fix: pick a canonical, redirect the others, or merge content.
- **Sudden position drop of 15+ positions** — likely a Google algorithm update. Check search-engine-land.com for the last core update date.
- **High impressions, CTR < 1%** — you're on the SERP but nobody clicks. Rewrite the `<title>` and meta description to be more compelling.
- **Impressions steadily declining over 4+ weeks** — content is going stale or competitors are outranking. Refresh the page (update dates, add new sections, publish a new revision).

## Tools bookmarked

- Google Search Console — https://search.google.com/search-console
- Bing Webmaster Tools — https://www.bing.com/webmasters
- Rich Results Test — https://search.google.com/test/rich-results
- PageSpeed Insights — https://pagespeed.web.dev
- Ahrefs free tools — https://ahrefs.com/free-seo-tools
- Ubersuggest (free tier) — https://neilpatel.com/ubersuggest

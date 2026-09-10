import { MetadataRoute } from 'next';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { PAGE_SIZE, hasSupabaseEnv } from './tax-tips/_lib/articles';
import { getPublishedTopics } from './tax-tips/_lib/topic-articles';
import { selectPublished } from './tax-tips/_lib/review';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://easytax.vip';

  // Preview branch builds (agent/*, PR previews) don't have Supabase env vars
  // set — they run in Vercel's Preview environment scope, where secrets are
  // deliberately not exposed. Skip the article query rather than crashing the
  // prerender, so the branch still ships a preview URL with the static pages.
  // Shared with the Tax Tips readers so the two checks cannot drift apart.
  let articleUrls: MetadataRoute.Sitemap = [];
  let topicUrls: MetadataRoute.Sitemap = [];
  if (hasSupabaseEnv()) {
    // Only the hubs that actually publish (see MIN_ARTICLES_PER_TOPIC) — a
    // sitemap entry for a topic that renders no articles is a thin page we
    // would be inviting a crawler to index.
    topicUrls = (await getPublishedTopics()).map(t => ({
      url: `${base}/tax-tips/topics/${t.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // Published only. An article awaiting review is deliberately not indexable,
    // so inviting a crawler to it would defeat the gate.
    // `reviewed_at` only exists once the 20260906 migration has run — and the
    // ungated retry is precisely the case where it has not. Asking for it there
    // too would fail the fallback query as well, on a *different* missing
    // column, and silently drop all 109 articles out of the sitemap. Which
    // columns we ask for therefore has to follow `gated`, not just the filter.
    const { data: articles } = await selectPublished(gated => {
      const q = supabase
        .from('tax_articles')
        .select(gated ? 'slug, published_at, reviewed_at' : 'slug, published_at');
      return (gated ? q.eq('review_status', 'published') : q)
        .order('published_at', { ascending: false });
    });

    // `lastmod` should be the last time the page's content actually changed.
    // For a reviewed article that is the review date, which is also the date
    // shown to the reader — the two must not disagree.
    type ArticleRow = { slug: string; published_at: string; reviewed_at?: string | null };
    articleUrls = ((articles ?? []) as unknown as ArticleRow[]).map(a => ({
      url: `${base}/tax-tips/${a.slug}`,
      lastModified: new Date(a.reviewed_at ?? a.published_at),
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

    // Paginated index pages. These are what give the older articles an inbound
    // internal link — listing the articles without them leaves most of the
    // archive orphaned. Page 1 is /tax-tips, already listed below.
    const totalPages = Math.ceil((articles?.length ?? 0) / PAGE_SIZE);
    for (let n = 2; n <= totalPages; n++) {
      articleUrls.push({
        url: `${base}/tax-tips/page/${n}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    }
  }

  return [
    { url: base,                                lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/pricing`,                   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/mtd-software`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    // Free tools. The hub and its three calculators are the pages most likely
    // to earn links from outside, so they sit at the top of the priority band.
    { url: `${base}/tools`,                     lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/mtd-deadline-checker`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/self-assessment-penalty-calculator`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/payments-on-account-calculator`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    // The embeddable widget's landing page. Addressed to accountants and
    // advisers rather than taxpayers, and the only page here whose purpose is
    // to be found by someone who might link to us rather than buy from us.
    { url: `${base}/tools/embed`,               lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/self-assessment-software`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/landlord-tax-software`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/bokio-alternative`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/crunch-alternative`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/kashflow-alternative`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/coconut-alternative`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/freeagent-alternative`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/quickbooks-alternative`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/sage-alternative`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/xero-alternative`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/taxscouts-alternative`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/trust`,                     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    // Named as the author URL in every article's JSON-LD, so it has to be
    // crawlable for the authorship claim to resolve to anything.
    { url: `${base}/editorial-standards`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/timetable`,                 lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/tax-tips`,                  lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/tax-tips/topics`,           lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/register`,                  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/login`,                     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacy`,                   lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/terms`,                     lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    ...topicUrls,
    ...articleUrls,
  ];
}

import { MetadataRoute } from 'next';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { PAGE_SIZE } from './tax-tips/_lib/articles';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://easytax.vip';

  // Preview branch builds (agent/*, PR previews) don't have Supabase env vars
  // set — they run in Vercel's Preview environment scope, where secrets are
  // deliberately not exposed. Skip the article query rather than crashing the
  // prerender, so the branch still ships a preview URL with the static pages.
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  let articleUrls: MetadataRoute.Sitemap = [];
  if (hasSupabase) {
    const { data: articles } = await supabase
      .from('tax_articles')
      .select('slug, published_at')
      .order('published_at', { ascending: false });

    articleUrls = (articles ?? []).map(a => ({
      url: `${base}/tax-tips/${a.slug}`,
      lastModified: new Date(a.published_at),
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
    { url: `${base}/timetable`,                 lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/tax-tips`,                  lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/register`,                  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/login`,                     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacy`,                   lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/terms`,                     lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    ...articleUrls,
  ];
}

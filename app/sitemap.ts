import { MetadataRoute } from 'next';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://easytax.vip';

  const { data: articles } = await supabase
    .from('tax_articles')
    .select('slug, published_at')
    .order('published_at', { ascending: false });

  const articleUrls: MetadataRoute.Sitemap = (articles ?? []).map(a => ({
    url: `${base}/tax-tips/${a.slug}`,
    lastModified: new Date(a.published_at),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [
    { url: base,                                lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/pricing`,                   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/bokio-alternative`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/coconut-alternative`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/freeagent-alternative`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/quickbooks-alternative`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/sage-alternative`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/xero-alternative`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/timetable`,                 lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/tax-tips`,                  lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/register`,                  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/login`,                     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacy`,                   lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/terms`,                     lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    ...articleUrls,
  ];
}

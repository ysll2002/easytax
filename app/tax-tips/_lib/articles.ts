import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// Shared data access for the Tax Tips index and its paginated pages.
//
// Background: there are 109 published articles, every one of them listed in
// sitemap.xml, but /tax-tips only ever rendered the newest 30 and had no
// pagination. The other 79 had no inbound internal link from anywhere on the
// site — orphan pages, which search engines crawl rarely and rank poorly.
// Paginating the index is what makes that inventory reachable.

export const PAGE_SIZE = 24;

export type ArticleSummary = {
  title: string;
  slug: string;
  excerpt: string;
  published_at: string;
};

export async function getArticlePage(page: number): Promise<{
  articles: ArticleSummary[];
  total: number;
  totalPages: number;
}> {
  const from = (page - 1) * PAGE_SIZE;

  const { data, count } = await supabase
    .from('tax_articles')
    .select('title, slug, excerpt, published_at', { count: 'exact' })
    .order('published_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const total = count ?? 0;
  return {
    articles: (data ?? []) as ArticleSummary[],
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getTotalPages(): Promise<number> {
  const { count } = await supabase
    .from('tax_articles')
    .select('slug', { count: 'exact', head: true });
  return Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
}

/** Up to `limit` other articles, newest first, excluding the one being read.
 *  Gives every article page outbound internal links so the archive is
 *  crawlable from any entry point rather than only from the index. */
export async function getRelatedArticles(excludeSlug: string, limit = 3): Promise<ArticleSummary[]> {
  const { data } = await supabase
    .from('tax_articles')
    .select('title, slug, excerpt, published_at')
    .neq('slug', excludeSlug)
    .order('published_at', { ascending: false })
    .limit(limit);

  return (data ?? []) as ArticleSummary[];
}

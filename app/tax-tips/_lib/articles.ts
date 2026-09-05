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

/** Vercel Preview builds (branch and PR deploys) run in the Preview
 *  environment scope, where the Supabase secrets are deliberately not exposed.
 *  `supabaseAdmin` throws on first access when they are absent, which fails the
 *  whole build if it happens during `generateStaticParams` or a prerender.
 *
 *  Every reader below degrades to "no articles" instead, so a preview build
 *  still produces a working deploy — the pages just render on demand once real
 *  credentials are present. Production always has the vars set. */
export function hasSupabaseEnv(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export async function getArticlePage(page: number): Promise<{
  articles: ArticleSummary[];
  total: number;
  totalPages: number;
}> {
  if (!hasSupabaseEnv()) return { articles: [], total: 0, totalPages: 1 };

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
  // Returning 1 here makes generateStaticParams emit no params, so pages 2..N
  // are rendered on demand rather than prerendered. Nothing 404s: dynamicParams
  // defaults to true.
  if (!hasSupabaseEnv()) return 1;

  const { count } = await supabase
    .from('tax_articles')
    .select('slug', { count: 'exact', head: true });
  return Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
}

// The "up to N other articles" reader that used to live here returned the
// newest articles regardless of subject. It is superseded by
// getRelatedByTopic() in ./topic-articles, which prefers articles sharing a
// topic and falls back to the newest — same guarantee, better links.

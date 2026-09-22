// The canonical map, read from the archive and cached for a request.
//
// `lib/article-clusters.ts` holds the pure clustering; this is the part that
// touches Supabase. They are separate files so the similarity rule can be
// exercised against a fixed list of titles without a database, which is how
// DUPLICATE_THRESHOLD was calibrated.
//
// Five surfaces need the same answer to "is this page a duplicate of another
// one, and if so which": the article page (to emit the canonical tag), the
// sitemap, the two feeds and llms.txt. If any of them disagreed we would be
// telling a crawler one thing in the sitemap and another in the page head,
// which is worse than not consolidating at all — a contradictory signal is one
// a search engine resolves by ignoring both.

import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { hasSupabaseEnv } from '@/app/tax-tips/_lib/articles';
import { selectPublished } from '@/app/tax-tips/_lib/review';
import { canonicalSlugMap, type ClusterableArticle } from '@/lib/article-clusters';

/** Every published headline, which is all the clustering needs. Capped well
 *  above the current 113 so the map cannot silently cover part of the archive;
 *  a partial map would canonicalise some duplicates and not others. */
const ARCHIVE_LIMIT = 1000;

let cached: { at: number; map: Map<string, string> } | null = null;

/** Long enough that a page render does not re-cluster the archive, short
 *  enough that publishing an article shows up the same day. The clustering is
 *  O(n²) over ~113 titles, which is trivial, but it is O(n²) *queries* worth
 *  of Supabase round trips if every article page fetches the archive. */
const TTL_MS = 10 * 60 * 1000;

/**
 * Slug → the slug it should be canonical to. Absent means "this page is the
 * canonical one", which is every page in an archive with no duplicates.
 *
 * Fail-soft in one direction, deliberately: any error returns an empty map, so
 * the site behaves exactly as it did before this shipped — every page
 * self-canonical, every page in the sitemap. The failure mode of the other
 * choice is pointing a canonical tag at the wrong page on a bad read, and a
 * wrong canonical is much harder to notice and undo than an absent one.
 */
export async function duplicateCanonicalMap(): Promise<Map<string, string>> {
  if (!hasSupabaseEnv()) return new Map();

  if (cached && Date.now() - cached.at < TTL_MS) return cached.map;

  try {
    const { data, error } = await selectPublished(gated => {
      const q = supabase.from('tax_articles').select('slug, title, published_at');
      return (gated ? q.eq('review_status', 'published') : q)
        .order('published_at', { ascending: false })
        .limit(ARCHIVE_LIMIT);
    });

    if (error || !data) return new Map();

    const map = canonicalSlugMap(data as unknown as ClusterableArticle[]);
    cached = { at: Date.now(), map };
    return map;
  } catch {
    return new Map();
  }
}

/** Drops the duplicates from a list of articles, keeping the elected primary
 *  of each set. Used by the sitemap, the feeds and llms.txt — the surfaces
 *  whose job is to tell a machine what is worth fetching. */
export async function withoutDuplicates<T extends { slug: string }>(rows: T[]): Promise<T[]> {
  const map = await duplicateCanonicalMap();
  if (map.size === 0) return rows;
  return rows.filter(r => !map.has(r.slug));
}

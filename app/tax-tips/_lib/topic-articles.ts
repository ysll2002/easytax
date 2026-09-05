import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { hasSupabaseEnv, type ArticleSummary } from './articles';
import {
  TOPICS,
  MIN_ARTICLES_PER_TOPIC,
  topicBySlug,
  titleMatchesTopic,
  type Topic,
} from './topics';

// Data access for the topic hubs. The taxonomy itself lives in ./topics, which
// deliberately has no imports so it can be checked against the real corpus
// without Supabase.

async function allArticles(): Promise<ArticleSummary[]> {
  // Same degradation as the rest of the Tax Tips readers: preview builds have
  // no Supabase credentials, and an empty archive must not fail the build.
  if (!hasSupabaseEnv()) return [];
  const { data } = await supabase
    .from('tax_articles')
    .select('title, slug, excerpt, published_at')
    .order('published_at', { ascending: false });
  return (data ?? []) as ArticleSummary[];
}

/** Articles in a topic, newest first. */
export async function getArticlesForTopic(slug: string): Promise<ArticleSummary[]> {
  const topic = topicBySlug(slug);
  if (!topic) return [];
  const articles = await allArticles();
  return articles.filter(a => titleMatchesTopic(topic, a.title));
}

export interface TopicWithCount extends Topic {
  count: number;
}

/** Topics that clear MIN_ARTICLES_PER_TOPIC, largest first. Anything thinner
 *  is dropped rather than published — and is therefore also kept out of the
 *  sitemap and the on-article chips, so we never link to a hub that 404s. */
export async function getPublishedTopics(): Promise<TopicWithCount[]> {
  const articles = await allArticles();
  if (articles.length === 0) return [];

  return TOPICS.map(t => ({
    ...t,
    count: articles.filter(a => titleMatchesTopic(t, a.title)).length,
  }))
    .filter(t => t.count >= MIN_ARTICLES_PER_TOPIC)
    .sort((a, b) => b.count - a.count);
}

/** The published topics a single article belongs to — used for the chips on an
 *  article page. Takes the already-known title to avoid a second round trip. */
export async function publishedTopicsForTitle(title: string): Promise<TopicWithCount[]> {
  const published = await getPublishedTopics();
  return published.filter(t => titleMatchesTopic(t, title));
}

/**
 * Up to `limit` articles related to the one being read, preferring ones that
 * share a topic and falling back to the newest.
 *
 * The previous behaviour — the three newest articles, whatever they were about
 * — meant a reader on a VAT guide was offered whatever happened to be
 * published that week. Sharing a topic makes the link useful to the reader and
 * makes the internal link graph topical rather than chronological, which is
 * the whole point of the clusters.
 */
export async function getRelatedByTopic(
  slug: string,
  title: string,
  limit = 3,
): Promise<ArticleSummary[]> {
  const articles = (await allArticles()).filter(a => a.slug !== slug);
  if (articles.length === 0) return [];

  const topics = TOPICS.filter(t => titleMatchesTopic(t, title));

  // Rank by how many topics an article shares with this one, newest first
  // within each rank. `allArticles` is already ordered newest first, so a
  // stable sort on the score alone preserves that.
  const scored = articles.map(a => ({
    article: a,
    shared: topics.filter(t => titleMatchesTopic(t, a.title)).length,
  }));

  return scored
    .sort((x, y) => y.shared - x.shared)
    .slice(0, limit)
    .map(s => s.article);
}

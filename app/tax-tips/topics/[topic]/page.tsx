import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import TrackEvent from '@/components/TrackEvent';
import ArticleCardList from '../../_components/ArticleCardList';
import { topicBySlug } from '../../_lib/topics';
import { getArticlesForTopic, getPublishedTopics } from '../../_lib/topic-articles';

const BASE = 'https://easytax.vip';

type Params = { topic: string };

export async function generateStaticParams() {
  // Prerender only the hubs that clear the minimum article count. Anything
  // else is rendered on demand; dynamicParams defaults to true, and the
  // notFound() below is what actually decides whether a slug exists.
  //
  // Preview builds have no Supabase credentials, so getPublishedTopics()
  // returns [] and nothing is prerendered — the same degradation the rest of
  // the Tax Tips routes use.
  const published = await getPublishedTopics();
  return published.map(t => ({ topic: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { topic: slug } = await params;
  const topic = topicBySlug(slug);
  if (!topic) return {};

  return {
    title: `${topic.heading} — guides for UK sole traders and small companies`,
    description: topic.intro.slice(0, 300),
    alternates: { canonical: `${BASE}/tax-tips/topics/${topic.slug}` },
    openGraph: {
      type: 'website',
      url: `${BASE}/tax-tips/topics/${topic.slug}`,
      title: topic.heading,
      description: topic.intro.slice(0, 300),
    },
  };
}

export default async function TopicPage({ params }: { params: Promise<Params> }) {
  const { topic: slug } = await params;
  const topic = topicBySlug(slug);
  if (!topic) notFound();

  const articles = await getArticlesForTopic(slug);
  const siblings = (await getPublishedTopics()).filter(t => t.slug !== slug);

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Tax Tips', item: `${BASE}/tax-tips` },
      { '@type': 'ListItem', position: 2, name: 'Topics', item: `${BASE}/tax-tips/topics` },
      { '@type': 'ListItem', position: 3, name: topic.label, item: `${BASE}/tax-tips/topics/${topic.slug}` },
    ],
  };

  const jsonLdCollection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: topic.heading,
    description: topic.intro,
    url: `${BASE}/tax-tips/topics/${topic.slug}`,
    hasPart: articles.slice(0, 25).map(a => ({
      '@type': 'Article',
      headline: a.title,
      url: `${BASE}/tax-tips/${a.slug}`,
      datePublished: a.published_at,
    })),
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#F0EBE1', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCollection) }} />
      <TrackEvent name="topic_hub_viewed" props={{ topic: topic.slug }} />

      <SiteHeader />

      <main className="flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <nav className="text-xs mb-4" style={{ color: '#9A8F83' }}>
          <Link href="/tax-tips" style={{ color: '#9A8F83', textDecoration: 'none' }}>Tax Tips</Link>
          <span aria-hidden> › </span>
          <Link href="/tax-tips/topics" style={{ color: '#9A8F83', textDecoration: 'none' }}>Topics</Link>
          <span aria-hidden> › </span>
          <span>{topic.label}</span>
        </nav>

        <h1
          style={{
            fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
            fontSize: 'clamp(1.9rem, 6vw, 2.75rem)',
            fontWeight: 700,
            color: '#1C1208',
            lineHeight: 1.12,
            letterSpacing: '-0.02em',
            marginBottom: '1rem',
          }}
        >
          {topic.heading}
        </h1>

        <p className="text-sm sm:text-base leading-relaxed mb-3" style={{ color: '#4A4035', maxWidth: 680 }}>
          {topic.intro}
        </p>
        <p className="text-xs mb-10" style={{ color: '#9A8F83' }}>
          {articles.length} {articles.length === 1 ? 'guide' : 'guides'} in this topic.
        </p>

        {articles.length > 0 ? (
          <ArticleCardList articles={articles} />
        ) : (
          <p className="text-sm" style={{ color: '#9A8F83' }}>
            No guides in this topic yet.{' '}
            <Link href="/tax-tips" style={{ color: '#C4622D', textDecoration: 'underline' }}>
              Browse the full archive
            </Link>
            .
          </p>
        )}

        {siblings.length > 0 && (
          <section className="mt-14">
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#1C1208' }}>
              Other topics
            </h2>
            <ul className="list-none p-0 m-0 flex flex-wrap gap-2">
              {siblings.map(t => (
                <li key={t.slug}>
                  <Link
                    href={`/tax-tips/topics/${t.slug}`}
                    className="inline-flex items-center rounded-full px-4 text-sm"
                    style={{
                      minHeight: 44,
                      backgroundColor: '#FDFCF8',
                      border: '1px solid #DDD5C8',
                      color: '#4A4035',
                      textDecoration: 'none',
                    }}
                  >
                    {t.label}
                    <span className="ml-2 text-xs" style={{ color: '#9A8F83' }}>{t.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

import type { Metadata } from 'next';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { Calendar, ChevronLeft } from 'lucide-react';
import { hasSupabaseEnv } from '../_lib/articles';
import { getRelatedByTopic, publishedTopicsForTitle } from '../_lib/topic-articles';
import ArticleCta from '../_components/ArticleCta';
import SiteFooter from '@/components/SiteFooter';
import ArticleProvenance, { ArticleSources } from '../_components/ArticleProvenance';
import { selectPublished } from '../_lib/review';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  // Preview deployments have no Supabase credentials; supabaseAdmin throws
  // without them. Degrade to default metadata rather than failing the render.
  if (!hasSupabaseEnv()) return {};
  const { data } = await selectPublished(gated => {
    const q = supabase.from('tax_articles').select('title, excerpt, published_at');
    return (gated ? q.eq('review_status', 'published') : q).eq('slug', slug).single();
  });
  if (!data) return {};

  return {
    title: `${data.title} | EasyTax`,
    description: data.excerpt,
    // Without this, every article inherited the site-wide canonical pointing
    // at the homepage, telling Google these 109 pages were duplicates of it.
    alternates: { canonical: `https://easytax.vip/tax-tips/${slug}` },
    openGraph: {
      type: 'article',
      title: data.title,
      description: data.excerpt,
      url: `https://easytax.vip/tax-tips/${slug}`,
      publishedTime: data.published_at,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // See generateMetadata above: without Supabase there is no article to show,
  // and a 404 is a far better answer than a server-side exception.
  if (!hasSupabaseEnv()) notFound();

  // An article awaiting review is not a page yet. 404 rather than render it:
  // a draft that is reachable by URL will be found, linked and indexed, which
  // is the exact thing the gate exists to prevent.
  const { data: article } = await selectPublished(gated => {
    const q = supabase.from('tax_articles').select('*');
    return (gated ? q.eq('review_status', 'published') : q).eq('slug', slug).single();
  });

  if (!article) notFound();

  const [related, topics] = await Promise.all([
    getRelatedByTopic(slug, article.title, 3),
    publishedTopicsForTitle(article.title),
  ]);

  // Authorship, review state and method, stated in the markup as well as on
  // the page. The previous version named "EasyTax" as author with no URL that
  // explained who or what that was, and repeated publishedAt as dateModified
  // so every article looked untouched since the day a cron emitted it.
  const jsonLdArticle = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.published_at,
    dateModified: article.reviewed_at ?? article.published_at,
    inLanguage: 'en-GB',
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://easytax.vip/tax-tips/${slug}` },
    author: {
      '@type': 'Organization',
      name: 'EasyTax editorial team',
      url: 'https://easytax.vip/editorial-standards',
    },
    publisher: {
      '@type': 'Organization',
      '@id': 'https://easytax.vip/#organization',
      name: 'Finance Panda Limited',
      url: 'https://easytax.vip',
    },
    // Stated only when it is true. An unreviewed article claiming a reviewer
    // would be the worst of both worlds.
    ...(article.reviewed_at
      ? {
          reviewedBy: {
            '@type': 'Organization',
            name: 'EasyTax editorial team',
            url: 'https://easytax.vip/editorial-standards',
          },
        }
      : {}),
    isAccessibleForFree: true,
  };

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',     item: 'https://easytax.vip' },
      { '@type': 'ListItem', position: 2, name: 'Tax Tips', item: 'https://easytax.vip/tax-tips' },
      { '@type': 'ListItem', position: 3, name: article.title, item: `https://easytax.vip/tax-tips/${slug}` },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#FDFCF8', color: '#1C1208' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdArticle) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
      <SiteHeader />

      <main className="flex-grow">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-20">
          <Link href="/tax-tips" className="inline-flex items-center gap-1 text-sm mb-8" style={{ color: '#9A8F83', textDecoration: 'none' }}>
            <ChevronLeft size={14} /> Back to Tax Tips
          </Link>

          <div className="flex items-center gap-1.5 mb-4">
            <Calendar size={13} color="#9A8F83" />
            <span className="text-sm" style={{ color: '#9A8F83' }}>
              {new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: '#1C1208', lineHeight: 1.2, marginBottom: '1.25rem' }}>
            {article.title}
          </h1>

          <p className="text-lg leading-relaxed mb-6" style={{ color: '#4A4035' }}>
            {article.excerpt}
          </p>

          {/* Topic chips. A reader who arrived here from search gets a route to
              the dozen other guides on the same subject, and the article gains
              an outbound link to a topically related hub rather than only to
              the flat, chronological index. */}
          {topics.length > 0 && (
            <nav className="mb-8 pb-8" style={{ borderBottom: '1px solid #E8E2DA' }} aria-label="Topics">
              <ul className="list-none p-0 m-0 flex flex-wrap items-center gap-2">
                <li className="text-xs mr-1" style={{ color: '#9A8F83' }}>In this topic:</li>
                {topics.map(t => (
                  <li key={t.slug}>
                    <Link
                      href={`/tax-tips/topics/${t.slug}`}
                      className="inline-flex items-center rounded-full px-3 text-xs"
                      style={{
                        minHeight: 32,
                        backgroundColor: '#F0EBE1',
                        border: '1px solid #DDD5C8',
                        color: '#4A4035',
                        textDecoration: 'none',
                      }}
                    >
                      {t.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {topics.length === 0 && <div className="mb-8 pb-8" style={{ borderBottom: '1px solid #E8E2DA' }} />}

          <ArticleProvenance
            publishedAt={article.published_at}
            reviewedAt={article.reviewed_at ?? null}
            reviewedBy={article.reviewed_by ?? null}
          />

          <div
            className="prose-article"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <ArticleSources sources={article.sources} />

          {/* Article traffic previously had nowhere to go but back to the
              index — no path to the product at all. */}
          <ArticleCta slug={slug} />

          {related.length > 0 && (
            <section className="mt-12 pt-8" style={{ borderTop: '1px solid #E8E2DA' }}>
              <h2
                className="mb-4"
                style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.15rem', fontWeight: 700, color: '#1C1208' }}
              >
                Keep reading
              </h2>
              <div className="space-y-3">
                {related.map(r => (
                  <Link key={r.slug} href={`/tax-tips/${r.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div
                      className="p-4 rounded-xl transition-all hover:shadow-md"
                      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2DA' }}
                    >
                      <p className="text-sm font-semibold mb-1" style={{ color: '#1C1208', lineHeight: 1.4 }}>
                        {r.title}
                      </p>
                      <p className="text-xs" style={{ color: '#9A8F83', lineHeight: 1.5 }}>{r.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="mt-12 pt-8" style={{ borderTop: '1px solid #E8E2DA' }}>
            <p className="text-xs mb-4" style={{ color: '#9A8F83' }}>
              This article is for general information only and does not constitute tax advice. For your specific situation, consult a qualified accountant.
            </p>
            <Link href="/tax-tips" className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: '#C4622D', textDecoration: 'none' }}>
              ← More Tax Tips
            </Link>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { getPublishedTopics } from '../_lib/topic-articles';

const BASE = 'https://easytax.vip';

export const metadata: Metadata = {
  title: 'UK Tax Guides by Topic — VAT, MTD, expenses, allowances and more',
  description:
    'The EasyTax guide archive grouped by subject: Making Tax Digital, VAT, capital allowances, home office expenses, limited companies, landlords, penalties and more. Practical UK tax guidance for sole traders and small companies.',
  alternates: { canonical: `${BASE}/tax-tips/topics` },
  openGraph: {
    type: 'website',
    url: `${BASE}/tax-tips/topics`,
    title: 'UK Tax Guides by Topic',
    description: 'The EasyTax guide archive, grouped by subject.',
  },
};

export const revalidate = 3600;

export default async function TopicsIndexPage() {
  const topics = await getPublishedTopics();
  const total = topics.reduce((s, t) => s + t.count, 0);

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Tax Tips', item: `${BASE}/tax-tips` },
      { '@type': 'ListItem', position: 2, name: 'Topics', item: `${BASE}/tax-tips/topics` },
    ],
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#F0EBE1', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />

      <SiteHeader />

      <main className="flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <nav className="text-xs mb-4" style={{ color: '#9A8F83' }}>
          <Link href="/tax-tips" style={{ color: '#9A8F83', textDecoration: 'none' }}>Tax Tips</Link>
          <span aria-hidden> › </span>
          <span>Topics</span>
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
          Guides by topic
        </h1>

        <p className="text-sm sm:text-base leading-relaxed mb-10" style={{ color: '#4A4035', maxWidth: 640 }}>
          {topics.length > 0
            ? `Every guide in the archive, grouped by subject rather than by date. ${topics.length} topics covering the questions UK sole traders, landlords and small company directors ask most.`
            : 'The archive is grouped by subject here as soon as there are guides to group.'}
        </p>

        {topics.length > 0 && (
          <ul className="list-none p-0 m-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topics.map(t => (
              <li key={t.slug}>
                <Link
                  href={`/tax-tips/topics/${t.slug}`}
                  className="flex flex-col h-full rounded-2xl p-5 sm:p-6"
                  style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8', textDecoration: 'none' }}
                >
                  <span className="flex items-baseline justify-between gap-3 mb-2">
                    <span
                      style={{
                        fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: '#1C1208',
                        lineHeight: 1.3,
                      }}
                    >
                      {t.heading}
                    </span>
                    <span className="text-xs flex-shrink-0" style={{ color: '#9A8F83' }}>
                      {t.count}
                    </span>
                  </span>
                  <span className="block text-sm leading-relaxed" style={{ color: '#4A4035' }}>
                    {t.intro.split('. ')[0]}.
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {total > 0 && (
          <p className="text-xs mt-10" style={{ color: '#9A8F83' }}>
            Guides often sit in more than one topic, so these counts add up to more than the size of
            the archive.{' '}
            <Link href="/tax-tips" style={{ color: '#9A8F83', textDecoration: 'underline' }}>
              Browse everything by date
            </Link>
            .
          </p>
        )}
      </main>
    </div>
  );
}

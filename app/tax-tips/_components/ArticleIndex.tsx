import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ArticleSummary } from '../_lib/articles';
import type { TopicWithCount } from '../_lib/topic-articles';
import ArticleCardList from './ArticleCardList';

const display = 'var(--font-display), Playfair Display, Georgia, serif';

function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  const href = (n: number) => (n === 1 ? '/tax-tips' : `/tax-tips/page/${n}`);

  // Show first, last, and a window around the current page. With 5-ish pages
  // this renders them all; it stays sane if the archive keeps growing daily.
  const nums = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const pages = [...nums].filter(n => n >= 1 && n <= totalPages).sort((a, b) => a - b);

  const linkStyle: React.CSSProperties = {
    minWidth: 44,
    minHeight: 44,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.75rem',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 600,
    padding: '0 0.75rem',
  };

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 mt-10"
      aria-label="Tax Tips pagination"
    >
      {page > 1 && (
        <Link
          href={href(page - 1)}
          rel="prev"
          aria-label="Previous page"
          style={{ ...linkStyle, backgroundColor: '#FFFFFF', border: '1px solid #DDD5C8', color: '#1C1208' }}
        >
          <ChevronLeft size={16} />
        </Link>
      )}

      {pages.map((n, i) => {
        // Insert an ellipsis wherever the window skips pages.
        const gap = i > 0 && n - pages[i - 1] > 1;
        return (
          <span key={n} className="flex items-center gap-2">
            {gap && <span style={{ color: '#9A8F83', fontSize: '0.9rem' }}>…</span>}
            {n === page ? (
              <span
                aria-current="page"
                style={{ ...linkStyle, backgroundColor: '#C4622D', color: '#FDFCF8' }}
              >
                {n}
              </span>
            ) : (
              <Link
                href={href(n)}
                style={{ ...linkStyle, backgroundColor: '#FFFFFF', border: '1px solid #DDD5C8', color: '#1C1208' }}
              >
                {n}
              </Link>
            )}
          </span>
        );
      })}

      {page < totalPages && (
        <Link
          href={href(page + 1)}
          rel="next"
          aria-label="Next page"
          style={{ ...linkStyle, backgroundColor: '#FFFFFF', border: '1px solid #DDD5C8', color: '#1C1208' }}
        >
          <ChevronRight size={16} />
        </Link>
      )}
    </nav>
  );
}

export default function ArticleIndex({
  articles,
  page,
  totalPages,
  total,
  /** Published topic hubs, shown as chips above the list. Omitted on the
   *  paginated pages, where the chips would repeat on every page without
   *  adding a new crawl path. */
  topics = [],
}: {
  articles: ArticleSummary[];
  page: number;
  totalPages: number;
  total: number;
  topics?: TopicWithCount[];
}) {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#FDFCF8', color: '#1C1208' }}>
      <SiteHeader />

      <main className="flex-grow">
        <section className="pt-12 sm:pt-16 pb-16 sm:pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="mb-10">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
                style={{ backgroundColor: '#F0EBE1', color: '#C4622D', border: '1px solid #C4622D30' }}
              >
                Updated daily
              </div>
              <h1
                style={{
                  fontFamily: display,
                  fontSize: 'clamp(2rem, 5vw, 3rem)',
                  fontWeight: 700,
                  color: '#1C1208',
                  lineHeight: 1.15,
                  marginBottom: '1rem',
                }}
              >
                What you need to know<br />
                <em style={{ color: '#C4622D', fontStyle: 'italic' }}>about the tax.</em>
              </h1>
              <p style={{ color: '#9A8F83', fontSize: '1.05rem', maxWidth: '520px' }}>
                Practical UK tax guidance for freelancers and self-employed professionals — a new
                article every morning.
                {total > 0 && (
                  <>
                    {' '}
                    <span style={{ color: '#4A4035' }}>
                      {total} articles{totalPages > 1 ? `, page ${page} of ${totalPages}` : ''}.
                    </span>
                  </>
                )}
              </p>
            </div>

            {topics.length > 0 && (
              <nav className="mb-10" aria-label="Article topics">
                <h2 className="text-sm font-semibold mb-3" style={{ color: '#1C1208' }}>
                  Browse by topic
                </h2>
                <ul className="list-none p-0 m-0 flex flex-wrap gap-2">
                  {topics.map(t => (
                    <li key={t.slug}>
                      <Link
                        href={`/tax-tips/topics/${t.slug}`}
                        className="inline-flex items-center rounded-full px-4 text-sm"
                        style={{
                          minHeight: 44,
                          backgroundColor: '#F0EBE1',
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
              </nav>
            )}

            {articles.length === 0 ? (
              <div className="py-20 text-center" style={{ color: '#9A8F83' }}>
                <p className="text-lg font-medium mb-2">First article coming tomorrow at 8am.</p>
                <p className="text-sm">Check back soon.</p>
              </div>
            ) : (
              <>
                <ArticleCardList articles={articles} />

                <Pagination page={page} totalPages={totalPages} />
              </>
            )}
          </div>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid #2E2418', backgroundColor: '#1C1208', padding: '2rem 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div style={{ fontFamily: display, fontSize: '1rem', color: '#9A8F83' }}>
            Finance Panda Limited. Built in London.
          </div>
          <div className="flex gap-6 text-sm" style={{ color: '#9A8F83' }}>
            <Link href="/trust" className="hover:text-[#C4622D] transition-colors" style={{ color: '#9A8F83', textDecoration: 'none' }}>Trust</Link>
            <Link href="/privacy" className="hover:text-[#C4622D] transition-colors" style={{ color: '#9A8F83', textDecoration: 'none' }}>Privacy</Link>
            <Link href="/terms" className="hover:text-[#C4622D] transition-colors" style={{ color: '#9A8F83', textDecoration: 'none' }}>Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

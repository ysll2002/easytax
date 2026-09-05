import Link from 'next/link';
import { Calendar } from 'lucide-react';
import type { ArticleSummary } from '../_lib/articles';

const display = 'var(--font-display), Playfair Display, Georgia, serif';

// The list of article cards, on its own.
//
// Extracted from ArticleIndex, which is a whole page — it renders the site
// header, its own <h1> and the footer, so it cannot be dropped inside another
// page. The topic hubs need the same cards under a different heading, and two
// copies of this markup would drift.

export default function ArticleCardList({
  articles,
  /** Heading level for each card title. The index page has one <h1> and these
   *  sit under it as <h2>; on a topic hub the same is true. Kept configurable
   *  so a future caller nesting them deeper does not break the outline. */
  as: Heading = 'h2',
}: {
  articles: ArticleSummary[];
  as?: 'h2' | 'h3';
}) {
  return (
    <div className="space-y-4">
      {articles.map(a => (
        <Link key={a.slug} href={`/tax-tips/${a.slug}`} style={{ textDecoration: 'none' }}>
          <div
            className="p-5 sm:p-6 rounded-2xl transition-all hover:shadow-md"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2DA' }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar size={12} color="#9A8F83" />
              <span className="text-xs" style={{ color: '#9A8F83' }}>
                {new Date(a.published_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <Heading
              className="font-bold mb-2"
              style={{ fontFamily: display, fontSize: '1.1rem', color: '#1C1208', lineHeight: 1.35 }}
            >
              {a.title}
            </Heading>
            <p className="text-sm leading-relaxed" style={{ color: '#4A4035' }}>{a.excerpt}</p>
            <p className="text-sm font-medium mt-3" style={{ color: '#C4622D' }}>Read more →</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

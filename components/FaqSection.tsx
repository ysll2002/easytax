import { HelpCircle } from 'lucide-react';

// One FAQ block that renders the questions and marks them up at the same time.
//
// Why this exists. `/hmrc-signed-me-up-for-mtd` was built on 2026-09-11 around
// six hand-written questions — "Can I opt out?", "What is qualifying income?
// Is it my profit?" — because those are the words the cohort HMRC auto-enrolled
// is actually typing. They render as prose and nothing else. Meanwhile the
// 2026-09-12 round taught the *archive* to emit FAQPage from its `<h2>`s, so
// the model-drafted articles are eligible for a rich result and the two
// hand-written landing pages that were built specifically to catch demand are
// not. That is the wrong way round.
//
// The reason it is a component rather than another `faqJsonLd()` call is that
// Google's structured data policy requires the marked-up answer to be visible
// on the page. Keeping the render and the JSON-LD as two expressions of the
// same array makes that true by construction — there is no way to add a
// question to the schema without it appearing on the page, or to edit an
// answer and leave the markup behind. lib/article-structure.ts has to *parse*
// its way to the same guarantee because its input is a blob of stored HTML;
// here we own the data, so we can simply not have the problem.
//
// The same policy is why there is no `minimum` fudge: two genuine pairs or it
// emits nothing. An `mainEntity: []` claims the page is an FAQ with no
// questions on it, and a manual action for misapplied markup is a real cost to
// a site whose entire pitch is that it is trustworthy about tax.

export type Faq = { q: string; a: string };

/** Below this a page is not an FAQ, it is a page with a question on it. Matches
 *  MIN_FAQ_PAIRS in lib/article-structure.ts deliberately — one threshold for
 *  the archive and the landing pages, or the two drift. */
export const MIN_FAQ_PAIRS = 2;

/** The FAQPage object, or null when the page does not genuinely qualify.
 *
 *  Exported separately from the component because a page may want it merged
 *  into a `@graph` alongside its Article or SoftwareApplication node rather
 *  than emitted as a second script tag. */
export function faqPageJsonLd(faqs: Faq[], pageUrl: string): Record<string, unknown> | null {
  const pairs = faqs.filter(f => f.q.trim() && f.a.trim());
  if (pairs.length < MIN_FAQ_PAIRS) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    inLanguage: 'en-GB',
    mainEntity: pairs.map(p => ({
      '@type': 'Question',
      name: p.q,
      acceptedAnswer: { '@type': 'Answer', text: p.a },
    })),
  };
}

export default function FaqSection({
  faqs,
  pageUrl,
  heading = 'Questions people ask',
  intro,
  /** Set when the page already folds `faqPageJsonLd` into its own graph, so
   *  the block renders without emitting a second, duplicate FAQPage. */
  schema = true,
}: {
  faqs: Faq[];
  pageUrl: string;
  heading?: string;
  intro?: string;
  schema?: boolean;
}) {
  if (faqs.length === 0) return null;
  const jsonLd = schema ? faqPageJsonLd(faqs, pageUrl) : null;

  return (
    <section className="mt-12">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <h2
        className="mb-2"
        style={{
          fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#1C1208',
        }}
      >
        {heading}
      </h2>
      {intro && (
        <p className="text-sm mb-5" style={{ color: '#9A8F83', lineHeight: 1.6 }}>
          {intro}
        </p>
      )}

      <div className="flex flex-col gap-5 mt-5">
        {faqs.map(({ q, a }) => (
          <div key={q}>
            <p className="font-semibold mb-1.5 flex items-start gap-2" style={{ color: '#1C1208' }}>
              <HelpCircle size={16} color="#6B8E6E" strokeWidth={2} className="flex-shrink-0 mt-1" />
              <span>{q}</span>
            </p>
            <p
              className="text-sm"
              style={{ color: '#4A4035', lineHeight: 1.7, paddingLeft: '1.5rem' }}
            >
              {a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

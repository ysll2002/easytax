import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import TrackEvent from '@/components/TrackEvent';
import { AlertTriangle, Bot, CheckCircle2, Mail, ScrollText } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';

// Who writes the Tax Tips archive, how, and what that is and is not worth.
//
// This page exists because the honest answer was not written down anywhere. A
// cron asks a model for a topic, asks a model for 500-700 words, and inserts
// the result straight into the table that the site, the sitemap and the topic
// hubs all read from. Nobody read it in between. For 140 pages about people's
// tax bills that is a real editorial gap, and pretending otherwise on a page
// headed "our expert team" would make it worse rather than better.
//
// So the page says what actually happens, what changed on 6 September 2026,
// what is still true of the older articles, and how to tell us we got
// something wrong.

export const metadata: Metadata = {
  title: 'Editorial standards — how EasyTax writes and checks its tax guides',
  description:
    'How the EasyTax Tax Tips archive is produced: AI-drafted from HMRC guidance and UK legislation, human-reviewed before publication, corrected when wrong. What we check, what we do not, and how to report an error.',
  alternates: { canonical: 'https://easytax.vip/editorial-standards' },
  openGraph: {
    type: 'article',
    url: 'https://easytax.vip/editorial-standards',
    title: 'Editorial standards — how EasyTax writes and checks its tax guides',
    description:
      'AI-drafted, human-reviewed, corrected when wrong. The full process, including what we have not checked yet.',
  },
};

const ACCENT = '#C4622D';
const INK = '#1C1208';
const BODY = '#4A4035';
const MUTED = '#9A8F83';

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
        fontSize: 'clamp(1.25rem, 3vw, 1.6rem)',
        fontWeight: 700,
        color: INK,
        marginBottom: '0.75rem',
      }}
    >
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-base mb-4" style={{ color: BODY, lineHeight: 1.7 }}>
      {children}
    </p>
  );
}

export default function EditorialStandardsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Editorial standards',
    url: 'https://easytax.vip/editorial-standards',
    description:
      'How the EasyTax Tax Tips archive is produced, reviewed and corrected.',
    inLanguage: 'en-GB',
    publisher: {
      '@type': 'Organization',
      '@id': 'https://easytax.vip/#organization',
      name: 'Finance Panda Limited',
      url: 'https://easytax.vip',
    },
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#FDFCF8', color: INK }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TrackEvent name="editorial_standards_viewed" />
      <SiteHeader />

      <main className="flex-grow">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-20">
          <div className="flex items-center gap-2 mb-3">
            <ScrollText size={16} color={ACCENT} />
            <span className="text-xs uppercase tracking-wider" style={{ color: MUTED, letterSpacing: '0.08em' }}>
              Editorial standards
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
              fontSize: 'clamp(1.85rem, 5vw, 2.75rem)',
              fontWeight: 700,
              color: INK,
              lineHeight: 1.15,
              marginBottom: '1rem',
            }}
          >
            How we write and check our tax guides
          </h1>

          <p className="text-lg mb-10" style={{ color: BODY, lineHeight: 1.65 }}>
            EasyTax publishes a large archive of UK tax guidance. You are about to make decisions
            about your own money using it, so you should know exactly how it is made — including
            the parts we are not happy with yet.
          </p>

          {/* ── The honest summary ─────────────────────────────────────── */}
          <section
            className="p-5 sm:p-6 rounded-2xl mb-10"
            style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}
          >
            <div className="flex items-start gap-2.5 mb-3">
              <Bot size={17} color={ACCENT} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
              <p className="text-base font-semibold m-0" style={{ color: INK }}>
                The short version
              </p>
            </div>
            <ul className="list-none p-0 m-0 space-y-2.5">
              {[
                'Our articles are drafted by an AI research pipeline, not typed by a journalist.',
                'The pipeline is instructed to work from HMRC guidance and UK legislation, and to record which references it used.',
                'Since 6 September 2026, a new article is not published until a person at Finance Panda Limited has read it.',
                'Articles published before that date went live automatically, without a person reading them first. We say so on each one.',
                'None of it is tax advice, and none of it is a substitute for an accountant who knows your situation.',
              ].map(line => (
                <li key={line} className="flex items-start gap-2.5 text-sm" style={{ color: BODY, lineHeight: 1.6 }}>
                  <CheckCircle2 size={15} color="#6B8E6E" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ── How an article is made ─────────────────────────────────── */}
          <section className="mb-10">
            <H2>How an article is made</H2>
            <P>
              A scheduled job picks a subject that the archive has not covered recently, then asks a
              large language model to write it. The model is prompted to be specific to UK rules, to
              stay inside the areas we actually serve — Self Assessment, Making Tax Digital for
              Income Tax, allowable expenses, VAT, Corporation Tax and small company accounts — and
              to cite the HMRC manuals or the legislation it is relying on.
            </P>
            <P>
              The draft then waits. It is not on the site, not in our sitemap and not linked from
              anywhere until somebody at Finance Panda Limited opens it, checks the figures, dates
              and thresholds against the current HMRC position, and either publishes it or throws it
              away. Rejected drafts are kept so the same subject is not generated again next week.
            </P>
          </section>

          {/* ── What review actually covers ────────────────────────────── */}
          <section className="mb-10">
            <H2>What a review does and does not cover</H2>
            <P>
              Review means a person has checked that the rates, thresholds, deadlines and legal
              references in the article match HMRC&apos;s current published position, that the
              article is about UK rules rather than a plausible-sounding blend of several countries,
              and that it does not tell you to do something that would put you offside.
            </P>
            <P>
              It does not mean a chartered accountant has signed the article off, and we will not
              claim that until it is true. It does not mean the article covers your circumstances —
              tax outcomes turn on details a general guide cannot know. Where a subject is genuinely
              contested or turns on facts, we try to say so in the article rather than pick a side.
            </P>
          </section>

          {/* ── The older archive ──────────────────────────────────────── */}
          <section
            className="p-5 sm:p-6 rounded-2xl mb-10"
            style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E8E2DA' }}
          >
            <div className="flex items-start gap-2.5 mb-2">
              <AlertTriangle size={17} color="#B3261E" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
              <p className="text-base font-semibold m-0" style={{ color: INK }}>
                About the articles published before 6 September 2026
              </p>
            </div>
            <p className="text-sm" style={{ color: BODY, lineHeight: 1.7 }}>
              They were generated and published automatically on the same day, with no human step in
              between. We are not going to quietly leave that impression uncorrected: every one of
              those pages now carries a notice saying it has not been individually checked, and we
              are working back through the archive in order. As each is reviewed, the notice on that
              page changes to name the review date. If a page still shows the notice, it still has
              not been read by a person.
            </p>
          </section>

          {/* ── Corrections ────────────────────────────────────────────── */}
          <section className="mb-10">
            <H2>Corrections</H2>
            <P>
              Tax guidance goes stale — rates change every year and MTD thresholds are still moving.
              If you find something wrong or out of date, tell us and we will fix or withdraw the
              page. We would rather have a smaller archive that is right.
            </P>
            <a
              href="mailto:hello@easytax.vip?subject=Correction%20to%20an%20EasyTax%20article"
              className="inline-flex items-center gap-2 text-sm font-medium"
              style={{
                color: '#FDFCF8',
                backgroundColor: ACCENT,
                textDecoration: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '50px',
                minHeight: '44px',
              }}
            >
              <Mail size={15} /> Report an error
            </a>
          </section>

          {/* ── Who we are ─────────────────────────────────────────────── */}
          <section className="mb-10">
            <H2>Who publishes this</H2>
            <P>
              EasyTax is a product of <strong style={{ color: INK }}>Finance Panda Limited</strong>,
              a company registered in England and Wales and registered with the Information
              Commissioner&apos;s Office under reference ZA540758. More about what we store, what we
              can and cannot see, and where our HMRC approval currently stands is on the{' '}
              <Link href="/trust" style={{ color: ACCENT, textDecoration: 'none' }}>
                trust page
              </Link>
              .
            </P>
            <P>
              Nothing on this site is tax advice, and reading it does not make us your accountant or
              your agent. For a decision that matters, get advice from someone who can look at your
              actual numbers.
            </P>
          </section>

          <div className="pt-8" style={{ borderTop: '1px solid #E8E2DA' }}>
            <Link
              href="/tax-tips"
              className="inline-flex items-center gap-1 text-sm font-medium"
              style={{ color: ACCENT, textDecoration: 'none' }}
            >
              ← Browse the Tax Tips archive
            </Link>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}

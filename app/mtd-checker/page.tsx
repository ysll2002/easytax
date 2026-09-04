import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import MtdChecker from './MtdChecker';
import { MANDATION_BANDS, formatDeadlineDate } from '@/lib/mtd-deadlines';

// "Does MTD apply to me, and from when?" is the question the whole MTD ITSA
// search market is asking, and the site had no page that answered it — only
// /timetable, which lists every date and leaves the reader to work out which
// ones are theirs. This page answers it in three clicks and captures a
// deadline reminder, which is the only conversion worth having while HMRC
// production approval is pending.

export const metadata: Metadata = {
  title: 'MTD Checker — Do I Need Making Tax Digital for Income Tax?',
  description:
    'Free MTD ITSA checker. Answer two questions to find out whether Making Tax Digital for Income Tax applies to you, which threshold you fall under (£50,000, £30,000 or £20,000), the exact date it starts, and your first quarterly deadline.',
  alternates: { canonical: 'https://easytax.vip/mtd-checker' },
  openGraph: {
    title: 'MTD Checker — Do I Need Making Tax Digital for Income Tax?',
    description:
      'Answer two questions to find out if MTD ITSA applies to you, from what date, and when your first quarterly update is due.',
    url: 'https://easytax.vip/mtd-checker',
  },
};

const display = 'var(--font-display), Playfair Display, Georgia, serif';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Who has to use Making Tax Digital for Income Tax?',
    a: 'Sole traders and landlords whose gross income from self-employment and UK property is over £50,000 must use MTD for Income Tax from 6 April 2026. The threshold falls to over £30,000 from 6 April 2027 and over £20,000 from 6 April 2028.',
  },
  {
    q: 'Is the threshold based on profit or turnover?',
    a: 'Turnover. HMRC uses qualifying income — your gross self-employment turnover plus gross property rents, before you deduct any expenses. Someone with £60,000 of turnover and £45,000 of costs is over the £50,000 threshold even though their taxable profit is £15,000.',
  },
  {
    q: 'Which tax year does HMRC look at?',
    a: 'The Self Assessment return for the tax year two years before mandation starts. For the April 2026 start HMRC looks at your 2024/25 return, for April 2027 at 2025/26, and for April 2028 at 2026/27.',
  },
  {
    q: 'What do I actually have to do under MTD?',
    a: 'Keep digital records of your income and expenses, send HMRC a quarterly update from compatible software four times a year, and submit a final declaration after the tax year ends — five submissions a year instead of one Self Assessment return.',
  },
  {
    q: 'Does MTD for Income Tax apply to limited companies?',
    a: 'No. MTD for Income Tax covers self-employment and property income reported through Self Assessment. A limited company files a CT600 Corporation Tax return, and separately files VAT under MTD for VAT if it is VAT registered.',
  },
  {
    q: 'What happens if I miss a quarterly update?',
    a: 'HMRC operates a points-based penalty system for MTD. Each missed submission deadline earns a penalty point, and a financial penalty applies once you reach the threshold for your submission frequency.',
  },
];

export default function MtdCheckerPage() {
  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://easytax.vip' },
      { '@type': 'ListItem', position: 2, name: 'MTD Checker', item: 'https://easytax.vip/mtd-checker' },
    ],
  };

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: '#FDFCF8', color: '#1C1208', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />

      <SiteHeader />

      <main className="flex-grow">
        <section className="pt-10 sm:pt-14 pb-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{ backgroundColor: '#F0EBE1', color: '#C4622D', border: '1px solid #C4622D30' }}
            >
              Free · No account needed
            </div>
            <h1
              style={{
                fontFamily: display,
                fontSize: 'clamp(1.9rem, 5vw, 2.9rem)',
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                marginBottom: '1rem',
              }}
            >
              Do I need Making Tax Digital<br />
              <em style={{ color: '#C4622D', fontStyle: 'italic' }}>for Income Tax?</em>
            </h1>
            <p style={{ color: '#4A4035', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: '58ch' }}>
              MTD for Income Tax is being phased in between 2026 and 2028, and which year applies to
              you depends on your gross income — not your profit, and not what you earn today.
              Answer two questions and get your start date and first deadline.
            </p>
          </div>
        </section>

        <section className="pb-12 sm:pb-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <MtdChecker />
          </div>
        </section>

        {/* ── Threshold table ── */}
        <section
          className="py-12 sm:py-16"
          style={{ backgroundColor: '#F8F5F0', borderTop: '1px solid #E8E2DA', borderBottom: '1px solid #E8E2DA' }}
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700, marginBottom: '1.25rem' }}>
              The MTD ITSA thresholds in full
            </h2>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E8E2DA' }}>
              <div
                className="hidden sm:grid px-5 py-3"
                style={{ gridTemplateColumns: '1fr 1fr 1fr', backgroundColor: '#1C1208' }}
              >
                {['Qualifying income', 'HMRC assesses', 'MTD starts'].map(h => (
                  <p key={h} className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#DDD5C8' }}>
                    {h}
                  </p>
                ))}
              </div>
              {MANDATION_BANDS.map((b, i) => (
                <div
                  key={b.startDate}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-0 px-5 py-4"
                  style={{
                    backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FDFCF8',
                    borderTop: i === 0 ? 'none' : '1px solid #F0EBE1',
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: '#1C1208' }}>
                    Over £{b.threshold.toLocaleString('en-GB')}
                  </p>
                  <p className="text-sm" style={{ color: '#4A4035' }}>
                    <span className="sm:hidden" style={{ color: '#9A8F83' }}>Assessed on: </span>
                    Your {b.assessedTaxYear} return
                  </p>
                  <p className="text-sm" style={{ color: '#4A4035' }}>
                    <span className="sm:hidden" style={{ color: '#9A8F83' }}>Starts: </span>
                    {formatDeadlineDate(b.startDate)}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: '#9A8F83', lineHeight: 1.7 }}>
              Qualifying income is gross self-employment turnover plus gross UK property rents, added
              together, before expenses. Full deadline list on our{' '}
              <Link href="/timetable" style={{ color: '#C4622D' }}>MTD timetable</Link>.
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-12 sm:py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700, marginBottom: '1rem' }}>
              Common questions
            </h2>
            <div style={{ borderTop: '1px solid #DDD5C8' }}>
              {FAQS.map(item => (
                <details key={item.q} className="group py-4 sm:py-5" style={{ borderBottom: '1px solid #DDD5C8' }}>
                  <summary
                    className="flex justify-between items-center cursor-pointer list-none font-semibold text-sm sm:text-base"
                    style={{ color: '#1C1208' }}
                  >
                    {item.q}
                    <span style={{ color: '#C4622D', fontSize: '1.25rem', lineHeight: 1, flexShrink: 0, marginLeft: '1rem' }}>+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: '#4A4035' }}>{item.a}</p>
                </details>
              ))}
            </div>
            <p className="text-xs mt-5" style={{ color: '#9A8F83', lineHeight: 1.7 }}>
              This checker is general guidance based on HMRC&apos;s published thresholds and does not
              constitute tax advice. Exemptions and special cases exist — check{' '}
              <a
                href="https://www.gov.uk/guidance/find-out-if-and-when-you-need-to-use-making-tax-digital-for-income-tax"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#C4622D' }}
              >
                HMRC&apos;s own guidance
              </a>{' '}
              or speak to an accountant about your situation.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

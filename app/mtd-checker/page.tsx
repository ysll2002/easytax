import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import MtdChecker from '@/components/MtdChecker';
import { getNextDeadline, formatDeadlineDate, formatPeriod } from '@/lib/mtd-deadlines';

export const metadata: Metadata = {
  title: 'Does Making Tax Digital Apply to Me? Free MTD ITSA Checker 2026–2028',
  description: 'Answer two questions to find out if — and when — Making Tax Digital for Income Tax applies to you. Thresholds: £50k from April 2026, £30k from April 2027, £20k from April 2028. Shows your quarterly deadlines.',
  alternates: { canonical: 'https://easytax.vip/mtd-checker' },
  openGraph: {
    title: 'Does MTD apply to me? Free Making Tax Digital checker',
    description: 'Two questions. Instant answer. See if you must send quarterly updates to HMRC and exactly when they are due.',
    url: 'https://easytax.vip/mtd-checker',
    type: 'website',
    locale: 'en_GB',
    siteName: 'EasyTax',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Does MTD apply to me? Free checker',
    description: 'Find out in 30 seconds whether Making Tax Digital for Income Tax applies to you, and your quarterly deadlines.',
  },
};

const display = 'var(--font-display), Playfair Display, Georgia, serif';

const faqs = [
  {
    q: 'Who has to use Making Tax Digital for Income Tax?',
    a: 'Sole traders and landlords whose combined gross income from self-employment and property is over £50,000 from 6 April 2026, over £30,000 from 6 April 2027, and over £20,000 from 6 April 2028. Income is measured on the tax return filed two years earlier and re-checked every year.',
  },
  {
    q: 'What counts as qualifying income for MTD?',
    a: 'Your gross income — turnover or total rent before any expenses — from all self-employment and property sources added together. Employment (PAYE), pensions, savings, dividends and limited-company profits do not count.',
  },
  {
    q: 'When are MTD quarterly updates due?',
    a: 'Quarterly updates are due on 7 August (6 Apr–5 Jul), 7 November (6 Jul–5 Oct), 7 February (6 Oct–5 Jan) and 7 May (6 Jan–5 Apr). A final declaration for the whole year is due by 31 January following the tax year.',
  },
  {
    q: 'What happens if I miss an MTD quarterly deadline?',
    a: 'HMRC uses a points system: each late quarterly update earns one penalty point, and reaching four points triggers a £200 penalty. Points expire after two years of on-time submissions.',
  },
  {
    q: 'Does MTD ITSA apply to limited company directors?',
    a: 'Not for company salary or dividends. MTD for Income Tax only covers self-employment and property income. A director with rental income or a side sole-trader business is assessed on that income alone.',
  },
];

export default function MtdCheckerPage() {
  const next = getNextDeadline();

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'EasyTax MTD ITSA checker',
    url: 'https://easytax.vip/mtd-checker',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
    description: 'Free two-question tool that tells UK sole traders and landlords whether and when Making Tax Digital for Income Tax applies to them.',
    publisher: { '@type': 'Organization', name: 'Finance Panda Limited' },
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />

      <SiteHeader />

      <main className="flex-grow">
        {/* Hero + tool */}
        <section className="pt-10 sm:pt-16 pb-12 sm:pb-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 lg:items-start">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-5" style={{ backgroundColor: '#F0EBE1', color: '#C4622D', border: '1px solid #C4622D30' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ backgroundColor: '#C4622D' }} />
                  Free · 30 seconds · no sign-up
                </div>
                <h1 style={{ fontFamily: display, fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 700, color: '#1C1208', lineHeight: 1.12, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
                  Does Making Tax Digital<br />
                  <em style={{ color: '#C4622D', fontStyle: 'italic' }}>apply to me?</em>
                </h1>
                <p className="text-base sm:text-lg leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '480px' }}>
                  MTD for Income Tax is rolling out in three waves — April 2026, 2027 and 2028 — based on your gross income. Answer two questions to see your wave and your exact quarterly deadlines.
                </p>
                <div className="p-4 rounded-2xl inline-flex items-start gap-3" style={{ backgroundColor: '#F8F5F0', border: '1px solid #E8E2DA' }}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9A8F83' }}>Next deadline for everyone already in MTD</p>
                    <p className="font-semibold text-sm mt-0.5" style={{ color: '#1C1208' }}>
                      Q{next.quarter} update ({formatPeriod(next)}) due <span style={{ color: '#C4622D' }}>{formatDeadlineDate(next.due)}</span> · {next.daysLeft} days
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0 w-full lg:max-w-xl">
                <MtdChecker />
              </div>
            </div>
          </div>
        </section>

        {/* Thresholds */}
        <section className="py-14 sm:py-20" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.6rem, 4vw, 2.25rem)', fontWeight: 700, color: '#1C1208', marginBottom: '0.75rem' }}>
              The three MTD ITSA waves
            </h2>
            <p className="text-sm sm:text-base mb-8" style={{ color: '#4A4035', lineHeight: 1.7, maxWidth: '640px' }}>
              HMRC looks at the gross income (before expenses) from self-employment and property on your latest filed tax return. Cross a threshold and you join from the April two years later.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { year: 'April 2026', threshold: 'over £50,000', note: 'Live now. First quarterly update was due 7 Aug 2026.', live: true },
                { year: 'April 2027', threshold: 'over £30,000', note: 'Assessed on your 2025/26 return (filed by 31 Jan 2027).', live: false },
                { year: 'April 2028', threshold: 'over £20,000', note: 'Assessed on your 2026/27 return. Under £20k: to be decided.', live: false },
              ].map(w => (
                <div key={w.year} className="p-5 rounded-2xl" style={{ backgroundColor: w.live ? '#1C1208' : '#FFFFFF', border: `1px solid ${w.live ? '#2E2418' : '#E8E2DA'}` }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#9A8F83' }}>{w.year}</p>
                  <p style={{ fontFamily: display, fontSize: '1.5rem', fontWeight: 700, color: w.live ? '#FDFCF8' : '#1C1208', marginBottom: '0.5rem' }}>{w.threshold}</p>
                  <p className="text-xs" style={{ color: '#9A8F83', lineHeight: 1.6 }}>{w.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-center mb-8" style={{ fontFamily: display, fontSize: 'clamp(1.6rem, 4vw, 2.25rem)', fontWeight: 700, color: '#1C1208' }}>
              MTD checker <em style={{ color: '#C4622D', fontStyle: 'italic' }}>questions</em>
            </h2>
            <div style={{ borderTop: '1px solid #DDD5C8' }}>
              {faqs.map(f => (
                <details key={f.q} className="group py-5" style={{ borderBottom: '1px solid #DDD5C8' }}>
                  <summary className="flex justify-between items-center cursor-pointer list-none font-semibold text-sm sm:text-base" style={{ color: '#1C1208' }}>
                    {f.q}
                    <span style={{ color: '#C4622D', fontSize: '1.25rem', lineHeight: 1, flexShrink: 0, marginLeft: '1rem' }}>+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: '#4A4035' }}>{f.a}</p>
                </details>
              ))}
            </div>
            <p className="text-center text-sm mt-8" style={{ color: '#9A8F83' }}>
              Want the full calendar? See the <Link href="/timetable" style={{ color: '#C4622D' }}>MTD deadlines timetable</Link> or compare <Link href="/mtd-software" style={{ color: '#C4622D' }}>MTD ITSA software</Link>.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#1C1208' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: '#FDFCF8', marginBottom: '1rem' }}>
              In scope? File each quarter for <em style={{ color: '#C4622D', fontStyle: 'italic' }}>£24</em>.
            </h2>
            <p style={{ color: '#9A8F83', fontSize: '1rem', maxWidth: '460px', margin: '0 auto 2rem' }}>
              No subscription. Connect your bank, let AI categorise, review and send. Free to set up — you only pay when you file.
            </p>
            <Link href="/register?ref=mtd-checker" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm" style={{ backgroundColor: '#C4622D', color: '#FDFCF8', textDecoration: 'none' }}>
              Get MTD-ready free →
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

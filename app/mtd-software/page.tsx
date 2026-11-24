import type { Metadata } from 'next';
import { pageTitle } from '@/lib/seo-meta';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { auth } from '@/auth';
import SiteFooter from '@/components/SiteFooter';
import { OFFER_JSONLD, PRICE_CHIP } from '@/lib/pricing';

export const metadata: Metadata = {
  title: pageTitle('MTD Software UK — Making Tax Digital for Income Tax'),
  description: 'MTD ITSA software on the HMRC MTD API for UK sole traders and the self-employed. Quarterly updates and VAT returns — free, no subscription, no filing fee.',
  alternates: { canonical: 'https://mtdbuddy.com/mtd-software' },
  openGraph: {
    title: 'MTD ITSA Software — MTD Buddy, Free, No Subscription',
    description: 'Making Tax Digital software built on the HMRC MTD API for sole traders and the self-employed. Quarterly updates and VAT returns — free, no monthly fee.',
    url: 'https://mtdbuddy.com/mtd-software',
    type: 'article',
    locale: 'en_GB',
    siteName: 'MTD Buddy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MTD ITSA Software — MTD Buddy, Free to Use',
    description: 'Making Tax Digital software built on the HMRC MTD API. Free — no subscription, no filing fee.',
  },
};

const display = 'var(--font-display), Playfair Display, Georgia, serif';

export default async function MtdSoftware() {
  const session = await auth();
  const ctaHref = session ? '/dashboard' : '/register';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MTD Buddy',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description: 'MTD ITSA software built on the HMRC MTD API for UK sole traders and the self-employed. File Making Tax Digital quarterly updates and VAT returns directly to HMRC.',
    url: 'https://mtdbuddy.com',
    offers: OFFER_JSONLD,
    publisher: { '@type': 'Organization', name: 'Finance Panda Limited' },
    mainEntityOfPage: 'https://mtdbuddy.com/mtd-software',
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is MTD ITSA software?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'MTD ITSA software is a digital tool recognised by HMRC that lets sole traders and landlords submit quarterly income and expense updates — and an end-of-year final declaration — as required by Making Tax Digital for Income Tax Self Assessment. This has been mandatory since 6 April 2026 for those earning over £50,000.',
        },
      },
      {
        '@type': 'Question',
        name: 'When does MTD ITSA become mandatory?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'From 6 April 2026 for sole traders and landlords with combined income above £50,000. The threshold drops to £30,000 from April 2027.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does MTD Buddy cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Nothing. MTD Buddy is free to use: there is no monthly subscription and no per-filing fee. Connecting HMRC and importing your records is free too.',
        },
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <SiteHeader />

      <main id="main-content" className="flex-grow">

        {/* ── Hero ── */}
        <section className="pt-12 sm:pt-16 pb-10 sm:pb-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-5" style={{ backgroundColor: '#F0EBE1', color: '#A04E1C', border: '1px solid #A04E1C30' }}>
              <Sparkles size={12} /> MTD ITSA software built on the HMRC MTD API
            </div>
            <h1 style={{ fontFamily: display, fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              MTD software for UK sole traders and the self-employed — <em style={{ color: '#4B6A4E', fontStyle: 'italic' }}>free, no subscription</em>
            </h1>
            <p className="text-base sm:text-xl leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              MTD Buddy is <strong style={{ color: '#1C1208' }}>Making Tax Digital software built on the HMRC MTD API</strong> built for UK sole traders and the self-employed. Submit quarterly MTD ITSA updates and MTD VAT returns directly to HMRC — and it is <strong style={{ color: '#4B6A4E' }}>free</strong>. No monthly subscription, no per-filing fee, no card to sign up.
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#4B6A4E', color: '#FDFCF8' }}>{PRICE_CHIP}</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>Built on the HMRC MTD API</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>MTD ITSA ready</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>No subscription</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#A04E1C', color: '#FDFCF8' }}>
                Get started free →
              </Link>
              <a href="mailto:hello@mtdbuddy.com?subject=MTD%20ITSA%20software%20question" className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', border: '1.5px solid #DDD5C8' }}>
                Ask us a question
              </a>
            </div>
          </div>
        </section>

        {/* ── What is MTD ITSA ── */}
        <section className="py-12 sm:py-14" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700, marginBottom: '1.25rem' }}>
              What is Making Tax Digital for Income Tax (MTD ITSA)?
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              MTD ITSA — Making Tax Digital for Income Tax Self Assessment — is HMRC&rsquo;s new digital filing system that replaces the annual Self Assessment return for most self-employed people and landlords. Instead of one big submission in January, you send <strong>four quarterly updates</strong> throughout the year plus a <strong>final declaration</strong> at year-end. All submissions must go through HMRC-compatible software — you cannot file on paper or via the old HMRC portal.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: '6 April 2026', title: 'MTD ITSA — £50k+', body: 'Mandatory for sole traders and landlords earning above £50,000. Quarterly updates replace the annual SA100.' },
                { label: '6 April 2027', title: 'MTD ITSA — £30k+', body: 'Threshold drops to £30,000. Around 1.4 million more taxpayers enter the quarterly MTD cycle.' },
                { label: 'Already live', title: 'MTD VAT — £90k+', body: 'If you are VAT-registered above the £90,000 threshold, MTD VAT filing is already mandatory. MTD Buddy covers this too.' },
              ].map(item => (
                <div key={item.label} className="p-5 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDD5C8' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#A04E1C' }}>{item.label}</p>
                  <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>{item.title}</p>
                  <p className="text-sm" style={{ color: '#4A4035' }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What MTD Buddy files ── */}
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '0.75rem' }}>
              Everything MTD Buddy files to HMRC
            </h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: '#4A4035', maxWidth: '640px' }}>
              Your quarterly MTD updates and VAT returns, and the records behind them, in one place. Not yet available in MTD Buddy: the year-end final declaration, property income (landlords) and CT600 Corporation Tax. For those, use other HMRC-recognised software from the list on GOV.UK.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'MTD ITSA quarterly updates',
                  body: 'Submit income and expenses each quarter directly to HMRC. Import a CSV statement from your bank and MTD Buddy AI-categorises it against HMRC allowable expenses — so each quarter takes minutes, not hours.',
                },
                {
                  title: 'MTD VAT return',
                  body: 'If you are VAT-registered, MTD Buddy submits your MTD VAT return directly to HMRC. MTD VAT is already mandatory for businesses above £90,000 turnover.',
                },
                {
                  title: 'Bank statement import',
                  body: 'Import the CSV statement you download from your bank — Barclays, Lloyds, HSBC, NatWest, Monzo, Starling, Revolut and most others offer one. Every line is AI-categorised. MTD Buddy never needs your bank login.',
                },
              ].map(item => (
                <div key={item.title} className="p-6 rounded-2xl flex gap-4" style={{ backgroundColor: '#F8F5F0', border: '1px solid #E8E2DA' }}>
                  <Check size={20} color="#4B6A4E" strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>{item.title}</p>
                    <p className="text-sm leading-relaxed" style={{ color: '#4A4035' }}>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Who needs MTD software ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '0.75rem' }}>
              Who needs MTD ITSA software?
            </h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: '#4A4035', maxWidth: '640px' }}>
              Since 6 April 2026, MTD-compatible software has been required by law if you fall into any of these categories.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Sole traders', body: 'Self-employed people with annual self-employment income above £50,000 (2026) or £30,000 (2027). This includes contractors, consultants, freelancers and tradespeople.' },
                { title: 'Landlords', body: 'Property landlords with gross rental income (before expenses) above the threshold. Includes residential and commercial let income.' },
                { title: 'Both combined', body: 'The £50k / £30k threshold applies to your total income from self-employment and property combined, not each source separately.' },
                { title: 'VAT-registered businesses', body: 'If you are already VAT-registered above £90,000 turnover, MTD VAT is already mandatory regardless of ITSA thresholds.' },
                { title: 'Limited company directors', body: 'Directors taking self-employed income alongside a salary may be affected. MTD Buddy does not file CT600 or company accounts for the company itself.' },
                { title: 'Below-threshold earners (voluntarily)', body: 'You can join MTD voluntarily even below the threshold to simplify your record-keeping and get used to quarterly filing before it becomes mandatory.' },
              ].map(item => (
                <div key={item.title} className="p-5 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDD5C8' }}>
                  <p className="font-semibold mb-2" style={{ color: '#1C1208' }}>{item.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: '#4A4035' }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why MTD Buddy ── */}
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '0.75rem' }}>
              Why choose MTD Buddy?
            </h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: '#4A4035', maxWidth: '640px' }}>
              There are dozens of MTD-compatible products. Here is what makes MTD Buddy different.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                {
                  title: 'Free — no subscription, no filing fee',
                  body: 'Most MTD software charges £20–30 per month whether or not you do anything that month. A typical sole trader (4 quarterly updates + 1 final declaration) pays £240–360 a year for that. MTD Buddy costs nothing: no monthly fee, and no charge when you file.',
                },
                {
                  title: 'Built from the ground up for MTD ITSA',
                  body: 'MTD Buddy was designed specifically for the MTD ITSA quarterly cycle, not retrofitted from legacy bookkeeping software. The workflow follows exactly what HMRC requires — no features you do not need, no feature gaps you discover at quarter-end.',
                },
                {
                  title: 'AI bank reconciliation powered by Claude',
                  body: 'Import a CSV statement from your bank. MTD Buddy automatically categorises each line against HMRC allowable expense categories. Describe an unusual transaction in plain English and the AI resolves it — no manual coding needed.',
                },
                {
                  title: 'No card required to start',
                  body: 'Sign up with Google or email in under 60 seconds. Connect HMRC and import your records for free. Clicking Submit sends the filing to HMRC and costs nothing.',
                },
                {
                  title: 'Direct HMRC API connection',
                  body: 'MTD Buddy uses the official HMRC MTD ITSA and MTD VAT APIs. Submissions go directly to HMRC — no intermediary agent, no manual re-keying. You receive an HMRC confirmation receipt.',
                },
                {
                  title: 'Simple enough to file yourself',
                  body: 'MTD Buddy is designed for people who want to file their own taxes, not for accountants. The step-by-step interface guides you from bank import to HMRC submission — no accounting knowledge required.',
                },
              ].map(item => (
                <div key={item.title} className="flex gap-4">
                  <ArrowRight size={20} color="#A04E1C" strokeWidth={2} className="flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>{item.title}</p>
                    <p className="text-sm leading-relaxed" style={{ color: '#4A4035' }}>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              How to file your MTD ITSA quarterly update with MTD Buddy
            </h2>
            <ol className="space-y-5">
              {[
                {
                  title: 'Create your free account',
                  body: 'Sign up with Google or email — no payment details required. Your account is ready in under 60 seconds.',
                },
                {
                  title: 'Add your income and expenses',
                  body: 'From the dashboard, go to Records. Import a CSV statement downloaded from your bank, or add records by hand, and MTD Buddy AI-categorises them against HMRC allowable expenses.',
                },
                {
                  title: 'Review your categorised transactions',
                  body: 'MTD Buddy AI categorises each bank transaction against HMRC allowable expense categories. Review, approve or correct any line — or use the chat to describe a transaction in plain English and let the AI resolve it.',
                },
                {
                  title: 'Connect to HMRC',
                  body: 'Authorise MTD Buddy with your HMRC Government Gateway account via the official OAuth flow. MTD Buddy never stores your HMRC password.',
                },
                {
                  title: 'Submit your quarterly update',
                  body: 'MTD Buddy computes your income and expense totals and submits the quarterly update directly to HMRC via the MTD ITSA API. You receive an HMRC acknowledgment and submission ID as confirmation.',
                },
              ].map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold" style={{ backgroundColor: '#A04E1C', color: '#FDFCF8' }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>{step.title}</p>
                    <p className="text-sm leading-relaxed" style={{ color: '#4A4035' }}>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#FDFCF8' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              MTD software — frequently asked questions
            </h2>
            <div style={{ borderTop: '1px solid #DDD5C8' }}>
              {[
                {
                  q: 'Is MTD Buddy recognised by HMRC for MTD ITSA?',
                  a: 'Yes. HMRC granted Finance Panda Limited production access on 11 November 2026, covering MTD ITSA quarterly updates and MTD VAT returns. One thing to know: you also have to be signed up for Making Tax Digital with HMRC in your own right. Until you are, HMRC will not release your obligations to any software — ours or anyone else\'s. See our HMRC status page for exactly what our access covers.',
                },
                {
                  q: 'What does MTD ITSA software actually do?',
                  a: 'It connects to HMRC on your behalf and sends your income and expense data as required by Making Tax Digital. With MTD Buddy, you import your bank statement or add records, review the AI categorisation each quarter, and press Submit. The software handles the HMRC API call, submission formatting, and receipt.',
                },
                {
                  q: 'When does Making Tax Digital for Income Tax start?',
                  a: 'From 6 April 2026 for sole traders and landlords with combined income above £50,000. The threshold drops to £30,000 from 6 April 2027. MTD VAT is already mandatory for businesses above £90,000 turnover.',
                },
                {
                  q: 'How much does MTD software cost with MTD Buddy?',
                  a: 'Nothing. There is no monthly subscription and no per-filing fee. Most sole traders file 4 quarterly updates plus 1 final declaration a year; with MTD Buddy that costs £0. Connecting HMRC and importing your records is free too.',
                },
                {
                  q: 'Can I use MTD Buddy for Self Assessment as well as quarterly updates?',
                  a: 'Not yet. MTD Buddy files your MTD ITSA quarterly updates. The year-end final declaration (which replaces the annual Self Assessment return under MTD) is not available in MTD Buddy yet, and nor is property income (SA105). For the year-end step, use other HMRC-recognised software from the list on GOV.UK.',
                },
                {
                  q: 'Does MTD Buddy work for limited companies?',
                  a: 'Only for VAT. MTD Buddy files MTD VAT returns for VAT-registered businesses, including limited companies. It does not file CT600 Corporation Tax or prepare company accounts. Directors who also have self-employment income can file their own MTD ITSA quarterly updates with MTD Buddy.',
                },
                {
                  q: 'Can I import my bank statements?',
                  a: 'Yes. Download a CSV statement from your bank\'s website or app — Barclays, Lloyds, HSBC, NatWest, Santander, Nationwide, Monzo, Starling, Revolut, Tide and most others offer one — and import it on the Records page. MTD Buddy does not connect to your bank account.',
                },
                {
                  q: 'What if I already use accounting software?',
                  a: 'MTD Buddy can work alongside your existing bookkeeping tool — it focuses exclusively on HMRC submissions. Many users keep their invoicing and bookkeeping elsewhere and use MTD Buddy purely for the MTD quarterly filing step. Or you can switch entirely: import your bank statements as CSV and let MTD Buddy handle everything.',
                },
              ].map((item) => (
                <details key={item.q} className="group py-4" style={{ borderBottom: '1px solid #DDD5C8' }}>
                  <summary className="flex justify-between items-center cursor-pointer list-none font-semibold text-sm" style={{ color: '#1C1208' }}>
                    {item.q}
                    <span style={{ color: '#A04E1C', fontSize: '1.25rem', lineHeight: 1, flexShrink: 0, marginLeft: '1rem' }}>+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: '#4A4035' }}>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 sm:py-24" style={{ backgroundColor: '#1C1208' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 700, color: '#FDFCF8', lineHeight: 1.15, marginBottom: '1.25rem' }}>
              MTD ITSA software that charges you <em style={{ color: '#E8895A', fontStyle: 'italic' }}>nothing at all</em>.
            </h2>
            <p style={{ color: '#A89D90', fontSize: '1rem', marginBottom: '2rem' }}>
              No card required. Set up in under 5 minutes. Built on the HMRC MTD API.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: '#A04E1C', color: '#FDFCF8' }}>
                Get started free →
              </Link>
              <a href="mailto:hello@mtdbuddy.com?subject=MTD%20ITSA%20software%20question" className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: '#FDFCF8', color: '#1C1208' }}>
                Ask us a question
              </a>
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}

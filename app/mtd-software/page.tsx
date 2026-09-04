import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'MTD ITSA Software for UK Sole Traders & Landlords — EasyTax, £24 per Filing',
  description: 'EasyTax is MTD ITSA software built on the HMRC MTD API for UK sole traders, self-employed and landlords. File quarterly updates, Self Assessment, VAT and CT600 directly to HMRC for £20 + VAT per submission. No monthly subscription.',
  alternates: { canonical: 'https://easytax.vip/mtd-software' },
  openGraph: {
    title: 'MTD ITSA Software — EasyTax, £24 per Filing, No Subscription',
    description: 'Making Tax Digital software built on the HMRC MTD API for sole traders and landlords. Quarterly updates, Self Assessment, VAT, CT600 — £24 per filing, no monthly fee.',
    url: 'https://easytax.vip/mtd-software',
    type: 'article',
    locale: 'en_GB',
    siteName: 'EasyTax',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MTD ITSA Software — EasyTax, £24 per Filing',
    description: 'Making Tax Digital software built on the HMRC MTD API. No subscription — pay only when you file.',
  },
};

const display = 'var(--font-display), Playfair Display, Georgia, serif';

export default async function MtdSoftware() {
  const session = await auth();
  const ctaHref = session ? '/dashboard' : '/register';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'EasyTax',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description: 'MTD ITSA software built on the HMRC MTD API for UK sole traders, self-employed and landlords. File Making Tax Digital quarterly updates, Self Assessment, VAT and CT600 directly to HMRC.',
    url: 'https://easytax.vip',
    offers: {
      '@type': 'Offer',
      price: '24',
      priceCurrency: 'GBP',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '24',
        priceCurrency: 'GBP',
        unitText: 'per HMRC submission (inc. VAT)',
      },
    },
    publisher: { '@type': 'Organization', name: 'Finance Panda Limited' },
    mainEntityOfPage: 'https://easytax.vip/mtd-software',
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
          text: 'MTD ITSA software is a digital tool recognised by HMRC that lets sole traders and landlords submit quarterly income and expense updates — and an end-of-year final declaration — as required by Making Tax Digital for Income Tax Self Assessment. From April 2026, this is mandatory for those earning over £50,000.',
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
        name: 'How much does EasyTax MTD software cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'EasyTax charges £20 + VAT (£24 inc. VAT) per HMRC submission. There is no monthly subscription — you only pay when you actually file. Connecting your bank and HMRC accounts is always free.',
        },
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <SiteHeader />

      <main className="flex-grow">

        {/* ── Hero ── */}
        <section className="pt-12 sm:pt-16 pb-10 sm:pb-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-5" style={{ backgroundColor: '#F0EBE1', color: '#C4622D', border: '1px solid #C4622D30' }}>
              <Sparkles size={12} /> MTD ITSA software built on the HMRC MTD API
            </div>
            <h1 style={{ fontFamily: display, fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              MTD software for UK sole traders and landlords — <em style={{ color: '#6B8E6E', fontStyle: 'italic' }}>£24 per filing, no subscription</em>
            </h1>
            <p className="text-base sm:text-xl leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              EasyTax is <strong style={{ color: '#1C1208' }}>Making Tax Digital software built on the HMRC MTD API</strong> built specifically for UK sole traders, the self-employed and landlords. Submit quarterly MTD ITSA updates, Self Assessment, VAT returns and CT600 filings directly to HMRC — for <strong style={{ color: '#6B8E6E' }}>£20 + VAT (£24 inc. VAT) per submission</strong>. No monthly subscription. No card to sign up.
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#6B8E6E', color: '#FDFCF8' }}>£24 per filing</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>Built on the HMRC MTD API</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>MTD ITSA ready</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>No subscription</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                Get started free →
              </Link>
              <a href="mailto:hello@easytax.vip?subject=MTD%20ITSA%20software%20question" className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', border: '1.5px solid #DDD5C8' }}>
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
                { label: 'Already live', title: 'MTD VAT — £90k+', body: 'If you are VAT-registered above the £90,000 threshold, MTD VAT filing is already mandatory. EasyTax covers this too.' },
              ].map(item => (
                <div key={item.label} className="p-5 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDD5C8' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#C4622D' }}>{item.label}</p>
                  <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>{item.title}</p>
                  <p className="text-sm" style={{ color: '#4A4035' }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What EasyTax files ── */}
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '0.75rem' }}>
              Everything EasyTax files to HMRC
            </h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: '#4A4035', maxWidth: '640px' }}>
              One tool for all your HMRC digital filing obligations — quarterly MTD updates, Self Assessment, VAT and Corporation Tax.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'MTD ITSA quarterly updates',
                  body: 'Submit income and expenses each quarter directly to HMRC. EasyTax auto-imports bank transactions via Open Banking and AI-categorises them against HMRC allowable expenses — so each quarter takes minutes, not hours.',
                },
                {
                  title: 'MTD ITSA final declaration (crystallisation)',
                  body: 'The end-of-year confirmation that locks in your Self Assessment for the tax year. EasyTax handles this in the same flow as your quarterly updates.',
                },
                {
                  title: 'Self Assessment — SA100, SA103, SA105',
                  body: 'Full Self Assessment return including self-employment (SA103) and property income (SA105) supplementary pages, submitted directly to HMRC via the official API.',
                },
                {
                  title: 'MTD VAT return',
                  body: 'If you are VAT-registered, EasyTax submits your MTD VAT return directly to HMRC. MTD VAT is already mandatory for businesses above £90,000 turnover.',
                },
                {
                  title: 'CT600 Corporation Tax',
                  body: 'For limited companies, EasyTax files the CT600 Corporation Tax return directly to HMRC, alongside P&L and Balance Sheet preparation.',
                },
                {
                  title: 'Open Banking transaction import',
                  body: 'Connect any major UK bank — Barclays, Lloyds, HSBC, NatWest, Monzo, Starling, Revolut and more. Transactions import automatically and are AI-categorised. Read-only access — EasyTax can never move money.',
                },
              ].map(item => (
                <div key={item.title} className="p-6 rounded-2xl flex gap-4" style={{ backgroundColor: '#F8F5F0', border: '1px solid #E8E2DA' }}>
                  <Check size={20} color="#6B8E6E" strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />
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
              From April 2026, MTD-compatible software is required by law if you fall into any of these categories.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Sole traders', body: 'Self-employed people with annual self-employment income above £50,000 (2026) or £30,000 (2027). This includes contractors, consultants, freelancers and tradespeople.' },
                { title: 'Landlords', body: 'Property landlords with gross rental income (before expenses) above the threshold. Includes residential and commercial let income.' },
                { title: 'Both combined', body: 'The £50k / £30k threshold applies to your total income from self-employment and property combined, not each source separately.' },
                { title: 'VAT-registered businesses', body: 'If you are already VAT-registered above £90,000 turnover, MTD VAT is already mandatory regardless of ITSA thresholds.' },
                { title: 'Limited company directors', body: 'Directors taking self-employed income alongside a salary may be affected. EasyTax also files CT600 and P&L/Balance Sheet for the company.' },
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

        {/* ── Why EasyTax ── */}
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '0.75rem' }}>
              Why choose EasyTax?
            </h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: '#4A4035', maxWidth: '640px' }}>
              There are dozens of MTD-compatible products. Here is what makes EasyTax different.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                {
                  title: 'No subscription — pay only when you file',
                  body: 'Most MTD software charges £20–30 per month whether or not you do anything that month. EasyTax charges £20 + VAT per HMRC submission. For a typical sole trader (4 quarterly updates + 1 final declaration), that is around £120 per year — versus £240–360 with subscription tools.',
                },
                {
                  title: 'Built from the ground up for MTD ITSA',
                  body: 'EasyTax was designed specifically for the MTD ITSA quarterly cycle, not retrofitted from legacy bookkeeping software. The workflow follows exactly what HMRC requires — no features you do not need, no feature gaps you discover at quarter-end.',
                },
                {
                  title: 'AI bank reconciliation powered by Claude',
                  body: 'Connect your bank via Open Banking. EasyTax automatically categorises transactions against HMRC allowable expense categories. Describe an unusual transaction in plain English and the AI resolves it — no manual coding needed.',
                },
                {
                  title: 'No card required to start',
                  body: 'Sign up with Google or email in under 60 seconds. Connect your bank and HMRC accounts for free. You only pay when you click Submit and EasyTax sends a filing to HMRC.',
                },
                {
                  title: 'Direct HMRC API connection',
                  body: 'EasyTax uses the official HMRC MTD ITSA, Self Assessment, VAT and Corporation Tax APIs. Submissions go directly to HMRC — no intermediary agent, no manual re-keying. You receive an HMRC confirmation receipt.',
                },
                {
                  title: 'Simple enough to file yourself',
                  body: 'EasyTax is designed for people who want to file their own taxes, not for accountants. The step-by-step interface guides you from bank import to HMRC submission — no accounting knowledge required.',
                },
              ].map(item => (
                <div key={item.title} className="flex gap-4">
                  <ArrowRight size={20} color="#C4622D" strokeWidth={2} className="flex-shrink-0 mt-1" />
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
              How to file your MTD ITSA quarterly update with EasyTax
            </h2>
            <ol className="space-y-5">
              {[
                {
                  title: 'Create your free account',
                  body: 'Sign up with Google or email — no payment details required. Your account is ready in under 60 seconds.',
                },
                {
                  title: 'Connect your bank via Open Banking',
                  body: 'From the dashboard, go to Bank → Connect a bank. Pick your UK bank and authorise read-only access. Transactions import automatically from the day you connect.',
                },
                {
                  title: 'Review your categorised transactions',
                  body: 'EasyTax AI categorises each bank transaction against HMRC allowable expense categories. Review, approve or correct any line — or use the chat to describe a transaction in plain English and let the AI resolve it.',
                },
                {
                  title: 'Connect to HMRC',
                  body: 'Authorise EasyTax with your HMRC Government Gateway account via the official OAuth flow. EasyTax never stores your HMRC password.',
                },
                {
                  title: 'Submit your quarterly update',
                  body: 'EasyTax computes your income and expense totals and submits the quarterly update directly to HMRC via the MTD ITSA API. You receive an HMRC acknowledgment and submission ID as confirmation.',
                },
              ].map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
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
                  q: 'Is EasyTax recognised by HMRC for MTD ITSA?',
                  a: 'Yes — EasyTax (by Finance Panda Limited) is registered with HMRC as a software supplier for Making Tax Digital. We use the official HMRC MTD ITSA API to submit quarterly updates and final declarations directly.',
                },
                {
                  q: 'What does MTD ITSA software actually do?',
                  a: 'It connects to HMRC on your behalf and sends your income and expense data as required by Making Tax Digital. With EasyTax, you connect your bank once, review AI-categorised transactions each quarter, and press Submit. The software handles the HMRC API call, submission formatting, and receipt.',
                },
                {
                  q: 'When does Making Tax Digital for Income Tax start?',
                  a: 'From 6 April 2026 for sole traders and landlords with combined income above £50,000. The threshold drops to £30,000 from 6 April 2027. MTD VAT is already mandatory for businesses above £90,000 turnover.',
                },
                {
                  q: 'How much does MTD software cost with EasyTax?',
                  a: 'EasyTax charges £20 + VAT (£24 inc. VAT) per HMRC submission — no monthly subscription. Most sole traders file 4 quarterly updates plus 1 final declaration per year, coming to around £120. Connecting your bank and HMRC accounts is always free.',
                },
                {
                  q: 'Can I use EasyTax for Self Assessment as well as quarterly updates?',
                  a: 'Yes — EasyTax files both. Under MTD ITSA, the annual Self Assessment (the "final declaration" or "crystallisation") is part of the same workflow as your quarterly updates. EasyTax handles the full SA100 with supplementary pages SA103 (self-employment) and SA105 (property income).',
                },
                {
                  q: 'Does EasyTax work for limited companies?',
                  a: 'Yes — EasyTax files CT600 Corporation Tax, prepares P&L and Balance Sheet, and handles MTD VAT for limited companies. Directors who also have self-employment income can manage both through EasyTax.',
                },
                {
                  q: 'Which UK banks are supported for Open Banking?',
                  a: 'All major UK retail and business banks: Barclays, Lloyds, HSBC, NatWest, Santander, Nationwide, Monzo, Starling, Revolut, Tide, Mettle, and most others. Read-only access only — EasyTax can never move money from your account.',
                },
                {
                  q: 'What if I already use accounting software?',
                  a: 'EasyTax can work alongside your existing bookkeeping tool — it focuses exclusively on HMRC submissions. Many users keep their invoicing and bookkeeping elsewhere and use EasyTax purely for the MTD quarterly filing step. Or you can switch entirely and let EasyTax handle everything through Open Banking import.',
                },
              ].map((item) => (
                <details key={item.q} className="group py-4" style={{ borderBottom: '1px solid #DDD5C8' }}>
                  <summary className="flex justify-between items-center cursor-pointer list-none font-semibold text-sm" style={{ color: '#1C1208' }}>
                    {item.q}
                    <span style={{ color: '#C4622D', fontSize: '1.25rem', lineHeight: 1, flexShrink: 0, marginLeft: '1rem' }}>+</span>
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
              MTD ITSA software that charges you <em style={{ color: '#C4622D', fontStyle: 'italic' }}>per filing</em>, not per month.
            </h2>
            <p style={{ color: '#9A8F83', fontSize: '1rem', marginBottom: '2rem' }}>
              No card required. Set up in under 5 minutes. Built on the HMRC MTD API.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                Get started free →
              </Link>
              <a href="mailto:hello@easytax.vip?subject=MTD%20ITSA%20software%20question" className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: '#FDFCF8', color: '#1C1208' }}>
                Ask us a question
              </a>
            </div>
          </div>
        </section>

      </main>

      <footer style={{ borderTop: '1px solid #2E2418', backgroundColor: '#1C1208', padding: '3rem 0' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div style={{ fontFamily: display, fontSize: '1.1rem', color: '#4A4035' }}>
            EasyTax Ltd. Built in London.
          </div>
          <div className="flex gap-6 text-sm" style={{ color: '#4A4035' }}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

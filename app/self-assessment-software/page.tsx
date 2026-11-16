import type { Metadata } from 'next';
import { pageTitle } from '@/lib/seo-meta';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { auth } from '@/auth';
import SiteFooter from '@/components/SiteFooter';
import { OFFER_JSONLD, PRICE_CHIP, PRICE_TABLE_CELL } from '@/lib/pricing';

export const metadata: Metadata = {
  title: pageTitle('Self Assessment Software UK — Free, No Subscription'),
  description: 'MTD for Income Tax software on the HMRC MTD API for UK sole traders. File your Making Tax Digital quarterly updates and VAT returns directly to HMRC — free, no subscription, no filing fee.',
  alternates: { canonical: 'https://easytax.vip/self-assessment-software' },
  openGraph: {
    title: 'Self Assessment Software UK — EasyTax, Free',
    description: 'Making Tax Digital software for sole traders: MTD ITSA quarterly updates and VAT returns — free, no subscription.',
    url: 'https://easytax.vip/self-assessment-software',
    type: 'article',
    locale: 'en_GB',
    siteName: 'EasyTax',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Self Assessment Software UK — EasyTax, Free',
    description: 'Self Assessment software built on the HMRC MTD API. Free — no subscription, no filing fee.',
  },
};

const display = 'var(--font-display), Playfair Display, Georgia, serif';

export default async function SelfAssessmentSoftware() {
  const session = await auth();
  const ctaHref = session ? '/dashboard' : '/register';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'EasyTax',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description: 'Making Tax Digital software on the HMRC MTD API for UK sole traders and the self-employed. File MTD ITSA quarterly updates and VAT returns directly to HMRC.',
    url: 'https://easytax.vip',
    offers: OFFER_JSONLD,
    publisher: { '@type': 'Organization', name: 'Finance Panda Limited' },
    mainEntityOfPage: 'https://easytax.vip/self-assessment-software',
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is self assessment software?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Self assessment software is a tool that lets UK taxpayers file their Self Assessment tax return (SA100) directly to HMRC without using HMRC\'s own website or a paper form. It typically guides you through the return, calculates your tax liability, and submits the data via HMRC\'s API. Under Making Tax Digital, self-employed people also send quarterly updates through recognised software. EasyTax files those quarterly updates; it does not file the annual SA100 return yet.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need self assessment software if I already use HMRC\'s website?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'It depends which tax year. Your 2025/26 return is still an ordinary Self Assessment return and can still be filed on HMRC\'s website — it is due by 31 January 2027. But from 2026/27 onwards, if your combined self-employment and property income was over £50,000, you have been inside Making Tax Digital for Income Tax since 6 April 2026. Quarterly updates have to go through MTD-compatible software, and HMRC\'s own web portal is not one — which is what recognised software like EasyTax is for.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does EasyTax self assessment software cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Nothing. EasyTax is free to use — no monthly subscription and no per-filing fee. A sole trader filing 4 MTD ITSA quarterly updates a year pays £0. Connecting HMRC and importing your records is free too.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which Self Assessment pages does EasyTax file?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'None yet. EasyTax files MTD ITSA quarterly updates for self-employment and MTD VAT returns. EasyTax does not file the annual SA100 return, the SA105 property pages or the year-end final declaration yet; for those, use HMRC’s online service or other HMRC-recognised software.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is EasyTax recognised by HMRC for self assessment?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. HMRC granted Finance Panda Limited production access on 11 November 2026, covering MTD ITSA quarterly updates and MTD VAT returns. One thing to know: you also have to be signed up for Making Tax Digital with HMRC in your own right. Until you are, HMRC will not release your obligations to any software — ours or anyone else\'s.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is MTD ITSA and how does it affect my self assessment?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'MTD ITSA (Making Tax Digital for Income Tax Self Assessment) replaces the annual SA return with four quarterly income/expense updates plus a final year-end declaration, all via recognised software. From 6 April 2026, this is mandatory if your combined self-employment and property income exceeds £50,000. The threshold drops to £30,000 from April 2027. EasyTax files the quarterly updates; the year-end final declaration is not available in EasyTax yet.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I use EasyTax alongside my existing bookkeeping software?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. EasyTax focuses on HMRC submissions. Many users keep their invoicing and bookkeeping elsewhere (Xero, FreeAgent, spreadsheets) and use EasyTax purely for the HMRC filing step — quarterly MTD updates or VAT returns. Alternatively, you can import your bank statements as CSV and let EasyTax handle everything.',
        },
      },
      {
        '@type': 'Question',
        name: 'When is the self assessment deadline?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The online self assessment deadline is 31 January following the end of the tax year (5 April). For the 2024-25 tax year, the online deadline is 31 January 2026. Under MTD ITSA, you will also have four quarterly submission deadlines: 7 August (Q1), 7 November (Q2), 7 February (Q3), and 7 May (Q4), plus a final declaration by 31 January.',
        },
      },
    ],
  };

  const comparisonRows = [
    { feature: 'Self Assessment SA100', easytax: false, taxcalc: true, taxfiler: true, hmrcPortal: true },
    { feature: 'SA103 (self-employment)', easytax: false, taxcalc: true, taxfiler: true, hmrcPortal: true },
    { feature: 'SA105 (property income)', easytax: false, taxcalc: true, taxfiler: true, hmrcPortal: true },
    { feature: 'MTD ITSA quarterly updates', easytax: true, taxcalc: true, taxfiler: false, hmrcPortal: false },
    { feature: 'MTD ITSA final declaration', easytax: false, taxcalc: true, taxfiler: false, hmrcPortal: false },
    { feature: 'MTD VAT return', easytax: true, taxcalc: true, taxfiler: false, hmrcPortal: false },
    { feature: 'CT600 Corporation Tax', easytax: false, taxcalc: true, taxfiler: true, hmrcPortal: false },
    { feature: 'AI expense categorisation', easytax: true, taxcalc: false, taxfiler: false, hmrcPortal: false },
    { feature: 'No monthly subscription', easytax: true, taxcalc: false, taxfiler: false, hmrcPortal: true },
    { feature: 'No card required to start', easytax: true, taxcalc: false, taxfiler: false, hmrcPortal: true },
    { feature: 'Pricing', easytax: PRICE_TABLE_CELL, taxcalc: '£99–£199 / yr', taxfiler: '£50–£130 / yr', hmrcPortal: 'Free (basic)' },
  ];

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
              <Sparkles size={12} /> Self Assessment software built on the HMRC MTD API
            </div>
            <h1 style={{ fontFamily: display, fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              Self assessment software for UK sole traders — <em style={{ color: '#4B6A4E', fontStyle: 'italic' }}>free, no subscription</em>
            </h1>
            <p className="text-base sm:text-xl leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              EasyTax is <strong style={{ color: '#1C1208' }}>Self Assessment software built on the HMRC MTD API</strong> built for UK sole traders and the self-employed. File your quarterly MTD ITSA updates and VAT returns directly to HMRC — <strong style={{ color: '#4B6A4E' }}>free</strong>. No monthly subscription, no per-filing fee, no card to start.
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#4B6A4E', color: '#FDFCF8' }}>{PRICE_CHIP}</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>Built on the HMRC MTD API</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>MTD ITSA ready</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>MTD ITSA quarterly updates</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#A04E1C', color: '#FDFCF8' }}>
                Get started free →
              </Link>
              <a href="mailto:hello@easytax.vip?subject=Self%20assessment%20software%20question" className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', border: '1.5px solid #DDD5C8' }}>
                Ask us a question
              </a>
            </div>
          </div>
        </section>

        {/* ── What SA software does ── */}
        <section className="py-12 sm:py-14" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700, marginBottom: '1.25rem' }}>
              What does self assessment software do?
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              Self assessment software connects to HMRC on your behalf and submits your tax return digitally — more reliably and with better guidance than HMRC&rsquo;s own web portal. EasyTax goes further: import a CSV statement from your bank or add records by hand, and it AI-categorises them against HMRC allowable expenses and builds your quarterly update in real time. You review, approve, and submit in minutes.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'Annual SA filing', title: 'SA100 + supplementary pages', body: 'The annual return for the 2025/26 tax year and earlier. EasyTax does not file it yet — use HMRC’s online service or other HMRC-recognised software.' },
                { label: 'Since April 2026', title: 'MTD ITSA quarterly updates', body: 'For those earning over £50,000, quarterly income and expense submissions are now mandatory. EasyTax files the quarterly updates; the annual final declaration is not available in EasyTax yet.' },
                { label: 'Already mandatory', title: 'MTD VAT', body: 'If you are VAT-registered above £90,000 turnover, MTD VAT is already required. EasyTax files VAT returns directly to HMRC alongside your quarterly updates.' },
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

        {/* ── What EasyTax files ── */}
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '0.75rem' }}>
              What EasyTax files to HMRC
            </h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: '#4A4035', maxWidth: '640px' }}>
              Your MTD ITSA quarterly updates and VAT returns, and the records behind them. EasyTax does not file the annual SA100 return, the SA105 property pages or the year-end final declaration yet; for those, use HMRC’s online service or other HMRC-recognised software. CT600 Corporation Tax is not supported.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'MTD ITSA quarterly updates',
                  body: 'Four quarterly income and expense submissions per year as required by Making Tax Digital for Income Tax. Import a CSV statement from your bank and EasyTax AI-categorises it, so each quarter takes minutes not hours.',
                },
                {
                  title: 'MTD VAT return',
                  body: 'Submit your VAT return directly to HMRC via the MTD VAT API. Mandatory for VAT-registered businesses above the £90,000 threshold.',
                },
                {
                  title: 'Bank statement import',
                  body: 'Import the CSV statement you download from your bank — Barclays, Lloyds, HSBC, NatWest, Monzo, Starling, Revolut and most others offer one — and AI categorises every line. No bank login needed.',
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

        {/* ── Comparison table ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '0.75rem' }}>
              EasyTax vs other UK self assessment software
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: '#4A4035', maxWidth: '640px' }}>
              Most self assessment software charges a flat annual fee — even in years where you barely use it. EasyTax charges nothing at all, and has both MTD ITSA quarterly updates and AI categorisation built in.
            </p>
            <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid #DDD5C8' }}>
              <table className="w-full text-sm" style={{ backgroundColor: '#FFFFFF', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1C1208' }}>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: '#FDFCF8', minWidth: '200px' }}>Feature</th>
                    <th className="px-4 py-3 font-semibold text-center" style={{ color: '#E8895A' }}>EasyTax</th>
                    <th className="px-4 py-3 font-semibold text-center" style={{ color: '#C9BFB2' }}>TaxCalc</th>
                    <th className="px-4 py-3 font-semibold text-center" style={{ color: '#C9BFB2' }}>Taxfiler</th>
                    <th className="px-4 py-3 font-semibold text-center" style={{ color: '#C9BFB2' }}>HMRC portal</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={row.feature} style={{ backgroundColor: i % 2 === 0 ? '#FDFCF8' : '#F8F5F0', borderBottom: '1px solid #EDE8E2' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: '#1C1208' }}>{row.feature}</td>
                      {(['easytax', 'taxcalc', 'taxfiler', 'hmrcPortal'] as const).map(col => {
                        const val = row[col];
                        const isEasyTax = col === 'easytax';
                        if (typeof val === 'boolean') {
                          return (
                            <td key={col} className="px-4 py-3 text-center">
                              {val
                                ? <span style={{ color: isEasyTax ? '#4B6A4E' : '#4A4035', fontWeight: isEasyTax ? 700 : 400 }}>✓</span>
                                : <span style={{ color: '#C4A882' }}>—</span>
                              }
                            </td>
                          );
                        }
                        return (
                          <td key={col} className="px-4 py-3 text-center text-xs" style={{ color: isEasyTax ? '#4B6A4E' : '#4A4035', fontWeight: isEasyTax ? 700 : 400 }}>
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs mt-3" style={{ color: '#6B6256' }}>Prices approximate as of 2026. Always verify with each provider. TaxCalc Solo/Personal plan; Taxfiler personal plan. "—" means the feature is not available on the plan indicated.</p>
          </div>
        </section>

        {/* ── Why EasyTax ── */}
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '0.75rem' }}>
              Why choose EasyTax for self assessment?
            </h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: '#4A4035', maxWidth: '640px' }}>
              There is no shortage of self assessment software. Here is what EasyTax does differently.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                {
                  title: 'Free — no subscription, no filing fee',
                  body: 'Most self assessment software charges £50–£199 per year, whether you file once or use it every month. EasyTax charges nothing, whichever you do. That\'s it.',
                },
                {
                  title: 'MTD ITSA ready from day one',
                  body: 'Many legacy self assessment tools are retrofitting MTD support. EasyTax was built from scratch for the MTD ITSA quarterly cycle. When HMRC makes quarterly updates mandatory for you, EasyTax is already ready — same account, same workflow.',
                },
                {
                  title: 'AI bank categorisation — no bookkeeping needed',
                  body: 'Import a CSV statement from your bank or add records by hand. EasyTax AI-categorises them against HMRC allowable expenses. Describe an unusual transaction in plain English and the AI resolves it. No spreadsheets, no manual coding.',
                },
                {
                  title: 'Built around HMRC’s expense categories',
                  body: 'Every record is sorted into the same expense categories HMRC uses for self-employment, so each quarterly update adds up the way HMRC expects — with no separate paid add-on.',
                },
                {
                  title: 'Direct HMRC API — no middlemen',
                  body: 'EasyTax submits via the official HMRC MTD ITSA and MTD VAT APIs. No intermediary agent, no manual re-keying. You receive a real HMRC acknowledgment and submission ID as proof of receipt.',
                },
                {
                  title: 'Designed for self-filers, not accountants',
                  body: 'EasyTax is built for people who want to file their own taxes confidently. The guided workflow takes you from your first record to HMRC submission — no accounting knowledge required.',
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

        {/* ── MTD ITSA context ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '0.75rem' }}>
              Self assessment is changing — MTD ITSA explained
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: '#4A4035', maxWidth: '680px' }}>
              The annual January deadline is being replaced with a quarterly filing cycle. Here is what you need to know.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                { label: '6 April 2026', title: 'MTD ITSA — £50k+ income', body: 'Sole traders and landlords with combined self-employment and property income above £50,000 must switch to quarterly MTD filing. HMRC\'s own portal will not be an option.' },
                { label: '6 April 2027', title: 'MTD ITSA — £30k+ income', body: 'The threshold drops to £30,000. Around 1.4 million more taxpayers join the quarterly cycle.' },
                { label: 'Five submissions per year', title: 'The new filing calendar', body: 'Q1 by 7 Aug · Q2 by 7 Nov · Q3 by 7 Feb · Q4 by 7 May · Final declaration by 31 Jan. EasyTax files the four quarterly updates and shows their deadlines on your dashboard; the final declaration is not available in EasyTax yet.' },
                { label: 'Below the threshold?', title: 'The annual SA still applies', body: 'If your income is below the MTD threshold, you keep filing annually via software. The 31 January deadline stays the same. EasyTax covers both routes from one account.' },
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

        {/* ── How it works ── */}
        <section className="py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              How to file your MTD quarterly updates with EasyTax
            </h2>
            <ol className="space-y-5">
              {[
                {
                  title: 'Create your free account',
                  body: 'Sign up with Google or email — no payment details required. Ready in under 60 seconds.',
                },
                {
                  title: 'Add your income and expenses',
                  body: 'From the dashboard, go to Records. Import a CSV statement downloaded from your bank, or add records by hand, and EasyTax AI-categorises them against HMRC allowable expenses.',
                },
                {
                  title: 'Review your income and expenses',
                  body: 'Check the AI-categorised transactions, correct any line, or type a plain-English description and let the AI resolve it. Your quarterly figures build in real time.',
                },
                {
                  title: 'Connect to HMRC',
                  body: 'Authorise EasyTax with your HMRC Government Gateway account via the official OAuth flow. EasyTax never stores your password.',
                },
                {
                  title: 'Review and submit',
                  body: 'EasyTax shows you a summary of your income and expenses for the quarter. Click Submit — EasyTax sends your quarterly update directly to HMRC via the official API. You receive an HMRC acknowledgment receipt.',
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
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              Self assessment software — frequently asked questions
            </h2>
            <div style={{ borderTop: '1px solid #DDD5C8' }}>
              {[
                {
                  q: 'What is self assessment software?',
                  a: 'Self assessment software is a tool that lets UK taxpayers file their SA tax return (SA100) directly to HMRC without using HMRC\'s own website or a paper form. Under Making Tax Digital, self-employed people also send quarterly updates through recognised software. EasyTax files those quarterly updates; it does not file the annual SA100 return yet.',
                },
                {
                  q: 'Do I need self assessment software if I already use HMRC\'s website?',
                  a: 'It depends which tax year. Your 2025/26 return is still an ordinary Self Assessment return and can still be filed on HMRC\'s website, by 31 January 2027. But from 2026/27 onwards, if your combined self-employment and property income was over £50,000, you have been inside Making Tax Digital for Income Tax since 6 April 2026 — quarterly updates must go through MTD-compatible software, and HMRC\'s web portal is not one.',
                },
                {
                  q: 'How much does EasyTax self assessment software cost?',
                  a: 'Nothing. There is no monthly subscription and no per-filing fee. A sole trader filing 4 MTD ITSA quarterly updates a year pays £0. Connecting your bank and HMRC is free too.',
                },
                {
                  q: 'Which Self Assessment pages does EasyTax file?',
                  a: 'None yet. EasyTax files MTD ITSA quarterly updates for self-employment and MTD VAT returns. EasyTax does not file the annual SA100 return, the SA105 property pages or the year-end final declaration yet; for those, use HMRC’s online service or other HMRC-recognised software. Corporation Tax (CT600) is not supported either.',
                },
                {
                  q: 'Is EasyTax recognised by HMRC for self assessment?',
                  a: 'Yes. HMRC granted Finance Panda Limited production access on 11 November 2026, covering MTD ITSA quarterly updates and MTD VAT returns. One thing to know: you also have to be signed up for Making Tax Digital with HMRC in your own right. Until you are, HMRC will not release your obligations to any software — ours or anyone else\'s.',
                },
                {
                  q: 'What is MTD ITSA and how does it affect my self assessment?',
                  a: 'MTD ITSA replaces the annual SA return with four quarterly updates plus a year-end final declaration, all via recognised software. From 6 April 2026, mandatory for combined self-employment and property income over £50,000. EasyTax files the quarterly updates; the annual final declaration is not available in EasyTax yet.',
                },
                {
                  q: 'Can I use EasyTax alongside my existing bookkeeping software?',
                  a: 'Yes. EasyTax focuses on HMRC submissions. You can keep your invoicing or bookkeeping elsewhere and use EasyTax purely for the filing step — quarterly MTD updates or VAT returns.',
                },
                {
                  q: 'When is the self assessment deadline?',
                  a: 'The online SA deadline is 31 January following the end of the tax year. For the 2024-25 tax year, that is 31 January 2026. Under MTD ITSA, you will also have quarterly deadlines: 7 August (Q1), 7 November (Q2), 7 February (Q3), 7 May (Q4), plus a final declaration by 31 January.',
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
              Self assessment software that charges you <em style={{ color: '#E8895A', fontStyle: 'italic' }}>nothing</em>, per filing or per year.
            </h2>
            <p style={{ color: '#A89D90', fontSize: '1rem', marginBottom: '2rem' }}>
              No card required. MTD ITSA quarterly updates · MTD VAT. Built on the HMRC MTD API.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: '#A04E1C', color: '#FDFCF8' }}>
                Get started free →
              </Link>
              <Link href="/pricing" className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: 'transparent', color: '#FDFCF8', border: '1.5px solid #4A4035' }}>
                See pricing
              </Link>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}

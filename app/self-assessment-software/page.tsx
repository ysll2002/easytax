import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'Self Assessment Software UK — EasyTax, £24 per Filing, MTD ITSA Ready',
  description: 'EasyTax is Self Assessment software built on the HMRC MTD API for UK sole traders and the self-employed. File SA100, SA103, SA105 and MTD ITSA quarterly updates directly to HMRC for £20 + VAT per submission. No monthly subscription.',
  alternates: { canonical: 'https://easytax.vip/self-assessment-software' },
  openGraph: {
    title: 'Self Assessment Software UK — EasyTax, £24 per Filing',
    description: 'Self Assessment software built on the HMRC MTD API for sole traders. SA100, SA103, SA105, and MTD ITSA quarterly updates — £24 per filing, no subscription.',
    url: 'https://easytax.vip/self-assessment-software',
    type: 'article',
    locale: 'en_GB',
    siteName: 'EasyTax',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Self Assessment Software UK — EasyTax, £24 per Filing',
    description: 'Self Assessment software built on the HMRC MTD API. No subscription — pay only when you file.',
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
    description: 'Self Assessment software built on the HMRC MTD API for UK sole traders and the self-employed. File SA100, SA103, SA105 and MTD ITSA quarterly updates directly to HMRC.',
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
          text: 'Self assessment software is a tool that lets UK taxpayers file their Self Assessment tax return (SA100) directly to HMRC without using HMRC\'s own website or a paper form. It typically guides you through the return, calculates your tax liability, and submits the data via HMRC\'s API. Software like EasyTax, which connects to the HMRC MTD API, can also handle supplementary pages such as SA103 (self-employment) and SA105 (UK property income).',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need self assessment software if I already use HMRC\'s website?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'For now, you can still file directly on HMRC\'s website. However, from April 2026, Making Tax Digital for Income Tax (MTD ITSA) becomes mandatory for sole traders and landlords earning over £50,000 — and HMRC\'s own web portal will not be an MTD-compatible route. You will need recognised software like EasyTax to send quarterly updates and your annual final declaration.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does EasyTax self assessment software cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'EasyTax charges £20 + VAT (£24 inc. VAT) per HMRC submission — no monthly subscription. A sole trader who files one annual SA100 per year pays just £24. If you are also doing MTD ITSA quarterly updates, the full annual cycle (4 quarterly updates + 1 final declaration) costs around £120. Connecting your bank and HMRC accounts is always free.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which SA supplementary pages does EasyTax support?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'EasyTax supports SA100 (main return), SA103 (self-employment income and expenses), and SA105 (UK property income). CT600 Corporation Tax and MTD VAT are also supported for limited companies and VAT-registered businesses.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is EasyTax recognised by HMRC for self assessment?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. EasyTax (by Finance Panda Limited) is registered with HMRC as a software supplier. We use the official HMRC Self Assessment and MTD ITSA APIs to submit filings directly. You receive an HMRC acknowledgment and submission ID as proof of receipt.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is MTD ITSA and how does it affect my self assessment?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'MTD ITSA (Making Tax Digital for Income Tax Self Assessment) replaces the annual SA return with four quarterly income/expense updates plus a final year-end declaration, all via recognised software. From 6 April 2026, this is mandatory if your combined self-employment and property income exceeds £50,000. The threshold drops to £30,000 from April 2027. EasyTax handles both the quarterly updates and the final declaration in the same workflow.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I use EasyTax alongside my existing bookkeeping software?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. EasyTax focuses on HMRC submissions. Many users keep their invoicing and bookkeeping elsewhere (Xero, FreeAgent, spreadsheets) and use EasyTax purely for the HMRC filing step — SA100, quarterly MTD updates, or VAT returns. Alternatively, you can import transactions via Open Banking and let EasyTax handle everything.',
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
    { feature: 'Self Assessment SA100', easytax: true, taxcalc: true, taxfiler: true, hmrcPortal: true },
    { feature: 'SA103 (self-employment)', easytax: true, taxcalc: true, taxfiler: true, hmrcPortal: true },
    { feature: 'SA105 (property income)', easytax: true, taxcalc: true, taxfiler: true, hmrcPortal: true },
    { feature: 'MTD ITSA quarterly updates', easytax: true, taxcalc: true, taxfiler: false, hmrcPortal: false },
    { feature: 'MTD ITSA final declaration', easytax: true, taxcalc: true, taxfiler: false, hmrcPortal: false },
    { feature: 'MTD VAT return', easytax: true, taxcalc: true, taxfiler: false, hmrcPortal: false },
    { feature: 'CT600 Corporation Tax', easytax: true, taxcalc: true, taxfiler: true, hmrcPortal: false },
    { feature: 'Open Banking import', easytax: true, taxcalc: false, taxfiler: false, hmrcPortal: false },
    { feature: 'AI expense categorisation', easytax: true, taxcalc: false, taxfiler: false, hmrcPortal: false },
    { feature: 'No monthly subscription', easytax: true, taxcalc: false, taxfiler: false, hmrcPortal: true },
    { feature: 'No card required to start', easytax: true, taxcalc: false, taxfiler: false, hmrcPortal: true },
    { feature: 'Pricing', easytax: '£24 / filing', taxcalc: '£99–£199 / yr', taxfiler: '£50–£130 / yr', hmrcPortal: 'Free (basic)' },
  ];

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
              <Sparkles size={12} /> Self Assessment software built on the HMRC MTD API
            </div>
            <h1 style={{ fontFamily: display, fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              Self assessment software for UK sole traders — <em style={{ color: '#6B8E6E', fontStyle: 'italic' }}>£24 per filing, no subscription</em>
            </h1>
            <p className="text-base sm:text-xl leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              EasyTax is <strong style={{ color: '#1C1208' }}>Self Assessment software built on the HMRC MTD API</strong> built for UK sole traders, the self-employed, and landlords. File your SA100 (plus SA103 and SA105 supplementary pages), quarterly MTD ITSA updates, VAT returns and CT600 directly to HMRC — for <strong style={{ color: '#6B8E6E' }}>£20 + VAT (£24 inc. VAT) per submission</strong>. No monthly subscription. No card to start.
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#6B8E6E', color: '#FDFCF8' }}>£24 per filing</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>Built on the HMRC MTD API</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>MTD ITSA ready</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>SA103 · SA105 included</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
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
              Self assessment software connects to HMRC on your behalf and submits your tax return digitally — more reliably and with better guidance than HMRC&rsquo;s own web portal. EasyTax goes further: it imports your bank transactions automatically via Open Banking, AI-categorises them against HMRC allowable expenses, and builds your return in real time. You review, approve, and submit in minutes.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'Annual SA filing', title: 'SA100 + supplementary pages', body: 'File your full Self Assessment return — SA100 main form, SA103 (self-employment), SA105 (property income) — directly to HMRC via the official API.' },
                { label: 'From April 2026', title: 'MTD ITSA quarterly updates', body: 'For those earning over £50,000, quarterly income and expense submissions become mandatory. EasyTax handles both the quarterly cycle and the annual final declaration.' },
                { label: 'Already mandatory', title: 'MTD VAT', body: 'If you are VAT-registered above £90,000 turnover, MTD VAT is already required. EasyTax files VAT returns directly to HMRC alongside your SA.' },
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
              One tool covers your entire HMRC filing obligation — from the annual Self Assessment to quarterly MTD updates.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'SA100 — main Self Assessment return',
                  body: 'The full Self Assessment tax return for individuals, submitted directly to HMRC via the official API. EasyTax calculates your tax liability and sends a complete, HMRC-compliant SA100.',
                },
                {
                  title: 'SA103 — self-employment pages',
                  body: 'The supplementary pages for self-employment income and allowable expenses (Class 4 NIC, capital allowances, simplified expenses). Required for sole traders and freelancers.',
                },
                {
                  title: 'SA105 — UK property income pages',
                  body: 'The supplementary pages for UK residential and commercial property rental income, mortgage interest relief, and allowable property expenses. Required for landlords.',
                },
                {
                  title: 'MTD ITSA quarterly updates',
                  body: 'Four quarterly income and expense submissions per year as required by Making Tax Digital for Income Tax. EasyTax auto-imports bank transactions and AI-categorises them, so each quarter takes minutes not hours.',
                },
                {
                  title: 'MTD ITSA final declaration (crystallisation)',
                  body: 'The year-end confirmation that replaces the old January SA deadline under MTD ITSA. EasyTax handles this in the same workflow as your quarterly updates.',
                },
                {
                  title: 'MTD VAT return',
                  body: 'Submit your VAT return directly to HMRC via the MTD VAT API. Mandatory for VAT-registered businesses above the £90,000 threshold.',
                },
                {
                  title: 'CT600 Corporation Tax',
                  body: 'For limited company directors, EasyTax prepares and files the CT600 Corporation Tax return alongside P&L and Balance Sheet statements.',
                },
                {
                  title: 'Open Banking transaction import',
                  body: 'Connect any major UK bank — Barclays, Lloyds, HSBC, NatWest, Monzo, Starling, Revolut and more — for automatic read-only transaction import and AI categorisation.',
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

        {/* ── Comparison table ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '0.75rem' }}>
              EasyTax vs other UK self assessment software
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: '#4A4035', maxWidth: '640px' }}>
              Most self assessment software charges a flat annual fee — even in years where you barely use it. EasyTax charges per submission only, and is the only option with both MTD ITSA quarterly updates and AI Open Banking categorisation built in.
            </p>
            <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid #DDD5C8' }}>
              <table className="w-full text-sm" style={{ backgroundColor: '#FFFFFF', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1C1208' }}>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: '#FDFCF8', minWidth: '200px' }}>Feature</th>
                    <th className="px-4 py-3 font-semibold text-center" style={{ color: '#C4622D' }}>EasyTax</th>
                    <th className="px-4 py-3 font-semibold text-center" style={{ color: '#9A8F83' }}>TaxCalc</th>
                    <th className="px-4 py-3 font-semibold text-center" style={{ color: '#9A8F83' }}>Taxfiler</th>
                    <th className="px-4 py-3 font-semibold text-center" style={{ color: '#9A8F83' }}>HMRC portal</th>
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
                                ? <span style={{ color: isEasyTax ? '#6B8E6E' : '#4A4035', fontWeight: isEasyTax ? 700 : 400 }}>✓</span>
                                : <span style={{ color: '#C4A882' }}>—</span>
                              }
                            </td>
                          );
                        }
                        return (
                          <td key={col} className="px-4 py-3 text-center text-xs" style={{ color: isEasyTax ? '#6B8E6E' : '#4A4035', fontWeight: isEasyTax ? 700 : 400 }}>
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs mt-3" style={{ color: '#9A8F83' }}>Prices approximate as of 2026. Always verify with each provider. TaxCalc Solo/Personal plan; Taxfiler personal plan. "—" means the feature is not available on the plan indicated.</p>
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
                  title: 'Pay only when you file — no subscription',
                  body: 'Most self assessment software charges £50–£199 per year, whether you file once or use it every month. EasyTax charges £20 + VAT per HMRC submission. If you file one SA100 per year, you pay £24. That\'s it.',
                },
                {
                  title: 'MTD ITSA ready from day one',
                  body: 'Many legacy self assessment tools are retrofitting MTD support. EasyTax was built from scratch for the MTD ITSA quarterly cycle. When HMRC makes quarterly updates mandatory for you, EasyTax is already ready — same account, same workflow.',
                },
                {
                  title: 'AI bank categorisation — no bookkeeping needed',
                  body: 'Connect your UK bank via Open Banking. EasyTax imports your transactions automatically and AI-categorises them against HMRC allowable expenses. Describe an unusual transaction in plain English and the AI resolves it. No spreadsheets, no manual coding.',
                },
                {
                  title: 'SA103 and SA105 supplementary pages included',
                  body: 'EasyTax files the full self-employment supplementary page (SA103) and the property income page (SA105) as part of the same workflow — not as a separate paid add-on. Landlords who are also self-employed can file both in one submission.',
                },
                {
                  title: 'Direct HMRC API — no middlemen',
                  body: 'EasyTax submits via the official HMRC Self Assessment and MTD ITSA APIs. No intermediary agent, no manual re-keying. You receive a real HMRC acknowledgment and submission ID as proof of receipt.',
                },
                {
                  title: 'Designed for self-filers, not accountants',
                  body: 'EasyTax is built for people who want to file their own taxes confidently. The guided workflow takes you from bank connection to HMRC submission — no accounting knowledge required.',
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
                { label: 'Five submissions per year', title: 'The new filing calendar', body: 'Q1 by 7 Aug · Q2 by 7 Nov · Q3 by 7 Feb · Q4 by 7 May · Final declaration by 31 Jan. EasyTax tracks all five deadlines on your dashboard.' },
                { label: 'Below the threshold?', title: 'The annual SA still applies', body: 'If your income is below the MTD threshold, you keep filing annually via software. The 31 January deadline stays the same. EasyTax covers both routes from one account.' },
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

        {/* ── How it works ── */}
        <section className="py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              How to file your self assessment with EasyTax
            </h2>
            <ol className="space-y-5">
              {[
                {
                  title: 'Create your free account',
                  body: 'Sign up with Google or email — no payment details required. Ready in under 60 seconds.',
                },
                {
                  title: 'Connect your bank via Open Banking',
                  body: 'Pick your UK bank and authorise read-only access. Transactions import automatically. EasyTax AI categorises each one against HMRC allowable expenses.',
                },
                {
                  title: 'Review your income and expenses',
                  body: 'Check the AI-categorised transactions, correct any line, or type a plain-English description and let the AI resolve it. Your SA103 or SA105 figures build in real time.',
                },
                {
                  title: 'Connect to HMRC',
                  body: 'Authorise EasyTax with your HMRC Government Gateway account via the official OAuth flow. EasyTax never stores your password.',
                },
                {
                  title: 'Review and submit',
                  body: 'EasyTax shows you a summary of your income, expenses, and tax liability. Click Submit — EasyTax sends the SA100 (and supplementary pages) directly to HMRC via the official API. You receive an HMRC acknowledgment receipt.',
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
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              Self assessment software — frequently asked questions
            </h2>
            <div style={{ borderTop: '1px solid #DDD5C8' }}>
              {[
                {
                  q: 'What is self assessment software?',
                  a: 'Self assessment software is a tool that lets UK taxpayers file their SA tax return (SA100) directly to HMRC without using HMRC\'s own website or a paper form. Software like EasyTax, which connects to the HMRC MTD API, can also handle supplementary pages such as SA103 (self-employment) and SA105 (property income), and submit quarterly MTD ITSA updates.',
                },
                {
                  q: 'Do I need self assessment software if I already use HMRC\'s website?',
                  a: 'For now, you can still file directly on HMRC\'s website. However, from April 2026, Making Tax Digital for Income Tax becomes mandatory for sole traders and landlords earning over £50,000 — and HMRC\'s web portal will not be an MTD-compatible route. You will need recognised software like EasyTax.',
                },
                {
                  q: 'How much does EasyTax self assessment software cost?',
                  a: 'EasyTax charges £20 + VAT (£24 inc. VAT) per HMRC submission — no monthly subscription. A sole trader filing one annual SA100 pays £24. The full MTD ITSA annual cycle (4 quarterly updates + 1 final declaration) costs around £120. Connecting your bank and HMRC is always free.',
                },
                {
                  q: 'Which SA supplementary pages does EasyTax support?',
                  a: 'EasyTax supports SA100 (main return), SA103 (self-employment), and SA105 (property income). CT600 Corporation Tax and MTD VAT are also supported for limited companies and VAT-registered businesses.',
                },
                {
                  q: 'Is EasyTax recognised by HMRC for self assessment?',
                  a: 'Yes. EasyTax (by Finance Panda Limited) is registered with HMRC as a software supplier. We use the official HMRC Self Assessment and MTD ITSA APIs. You receive an HMRC acknowledgment and submission ID as proof.',
                },
                {
                  q: 'What is MTD ITSA and how does it affect my self assessment?',
                  a: 'MTD ITSA replaces the annual SA return with four quarterly updates plus a year-end final declaration, all via recognised software. From 6 April 2026, mandatory for combined self-employment and property income over £50,000. EasyTax handles both quarterly updates and the annual declaration in one workflow.',
                },
                {
                  q: 'Can I use EasyTax alongside my existing bookkeeping software?',
                  a: 'Yes. EasyTax focuses on HMRC submissions. You can keep your invoicing or bookkeeping elsewhere and use EasyTax purely for the filing step — SA100, quarterly MTD updates, or VAT returns.',
                },
                {
                  q: 'When is the self assessment deadline?',
                  a: 'The online SA deadline is 31 January following the end of the tax year. For the 2024-25 tax year, that is 31 January 2026. Under MTD ITSA, you will also have quarterly deadlines: 7 August (Q1), 7 November (Q2), 7 February (Q3), 7 May (Q4), plus a final declaration by 31 January.',
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
              Self assessment software that charges you <em style={{ color: '#C4622D', fontStyle: 'italic' }}>per filing</em>, not per year.
            </h2>
            <p style={{ color: '#9A8F83', fontSize: '1rem', marginBottom: '2rem' }}>
              No card required. SA100 · SA103 · SA105 · MTD ITSA. Built on the HMRC MTD API.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                Get started free →
              </Link>
              <Link href="/pricing" className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: 'transparent', color: '#FDFCF8', border: '1.5px solid #4A4035' }}>
                See pricing
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

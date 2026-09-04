import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { Check, X, Sparkles, ArrowRight } from 'lucide-react';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'Landlord Tax Software — MTD ITSA Filing for UK Landlords, £24 per Submission',
  description: 'MTD ITSA software built for UK landlords. File quarterly updates and Self Assessment (SA100 + SA105 property supplement) directly to HMRC for £20 + VAT (£24 inc. VAT) per submission — no monthly subscription, no accountant required.',
  alternates: { canonical: 'https://easytax.vip/landlord-tax-software' },
  openGraph: {
    title: 'Landlord Tax Software — MTD ITSA, SA100 + SA105, £24 per Filing',
    description: 'EasyTax files MTD ITSA quarterly updates and Self Assessment (including SA105 property income) for UK landlords. £24 per submission, no monthly subscription, no accountant needed.',
    url: 'https://easytax.vip/landlord-tax-software',
    type: 'article',
    locale: 'en_GB',
    siteName: 'EasyTax',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Landlord Tax Software — MTD ITSA + SA105, £24 per Filing | EasyTax',
    description: 'MTD ITSA quarterly updates and Self Assessment for UK landlords — £24 per submission, no subscription, no accountant required.',
  },
};

const display = 'var(--font-display), Playfair Display, Georgia, serif';

type Row = { feature: string; easytax: string | boolean; accountant: string | boolean; suite: string | boolean; note?: string };

const rows: Row[] = [
  { feature: 'Pricing model',                              easytax: '£24 per filing',   accountant: '£400–£1,200/yr',   suite: '£144–£708/yr',   note: 'EasyTax charges per HMRC submission; accountants charge annually; software suites charge monthly subscription' },
  { feature: 'MTD ITSA quarterly updates',                 easytax: true,               accountant: true,               suite: true },
  { feature: 'Self Assessment — SA100',                    easytax: true,               accountant: true,               suite: true },
  { feature: 'Property income supplement — SA105',         easytax: true,               accountant: true,               suite: true,             note: 'EasyTax files the SA105 property pages alongside the SA100 main return' },
  { feature: 'Open Banking auto-import of rental income',  easytax: true,               accountant: false,              suite: true,             note: 'Connect your UK bank via Open Banking — rental credits are imported automatically' },
  { feature: 'AI categorisation of rental expenses',       easytax: true,               accountant: false,              suite: false,            note: 'EasyTax uses Claude AI to categorise repairs, insurance, mortgage interest and agent fees against HMRC allowable expenses' },
  { feature: 'AI bank reconciliation chat',                easytax: true,               accountant: false,              suite: false },
  { feature: 'MTD VAT submission',                         easytax: true,               accountant: true,               suite: true },
  { feature: 'CT600 Corporation Tax (Ltd BTL)',            easytax: true,               accountant: true,               suite: true,             note: 'For landlords who hold property in a limited company (Buy-to-Let Ltd)' },
  { feature: 'No card to sign up',                         easytax: true,               accountant: false,              suite: false },
  { feature: 'No monthly subscription',                    easytax: true,               accountant: false,              suite: false },
  { feature: 'Capital Gains Tax (CGT) advice',             easytax: false,              accountant: true,               suite: false,            note: 'EasyTax covers income tax filings; CGT on property disposal requires a specialist' },
  { feature: 'Full bookkeeping / accounts preparation',    easytax: false,              accountant: true,               suite: true,             note: 'EasyTax focuses on HMRC filing; full bookkeeping is not included' },
  { feature: 'Payroll for portfolio companies',            easytax: false,              accountant: true,               suite: true },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true)  return <Check size={18} color="#6B8E6E" strokeWidth={2.5} className="mx-auto" />;
  if (value === false) return <X     size={18} color="#C46262" strokeWidth={2.5} className="mx-auto" />;
  return <span className="text-sm" style={{ color: '#1C1208' }}>{value}</span>;
}

export default async function LandlordTaxSoftware() {
  const session = await auth();
  const ctaHref = session ? '/dashboard' : '/register';

  const faqItems = [
    {
      q: 'When does MTD ITSA apply to landlords?',
      a: 'From 6 April 2026, landlords whose total property income (plus any self-employment income) exceeds £50,000 per year must use MTD-compatible software to file quarterly updates to HMRC. The threshold drops to £30,000 from 6 April 2027. If you are above the threshold, you are already required to file quarterly — EasyTax is built on the HMRC MTD API for this.',
    },
    {
      q: 'What is an SA105 and does EasyTax file it?',
      a: 'The SA105 is the property income supplementary page attached to your Self Assessment (SA100) return. It captures UK property rental income, allowable expenses (repairs, insurance, mortgage interest, letting agent fees), and calculates the taxable profit or loss. EasyTax files the SA105 as part of your full Self Assessment submission — no separate step required.',
    },
    {
      q: 'What rental expenses can I claim through EasyTax?',
      a: 'EasyTax supports all standard HMRC-allowable landlord expenses: mortgage interest (subject to Section 24 restrictions), letting agent fees, property management costs, repairs and maintenance (not capital improvements), buildings and contents insurance, ground rent and service charges, utility bills you pay, and accountancy fees. Our AI categorisation maps your bank transactions to the correct expense categories automatically.',
    },
    {
      q: 'Do I need an accountant if I use EasyTax?',
      a: 'For most straightforward landlords — those with one or a few buy-to-let properties, no complex structures, and no property disposals — EasyTax handles all the HMRC filings you need. If you have a large portfolio, properties held in a limited company, or are disposing of property (CGT), you may benefit from a specialist tax adviser alongside EasyTax for the filings.',
    },
    {
      q: 'I hold my property in a limited company. Can I use EasyTax?',
      a: 'Yes — EasyTax supports CT600 Corporation Tax filing and company accounts (P&L and Balance Sheet) for limited company landlords (buy-to-let Ltd). The MTD ITSA quarterly update requirement applies to the individual director\'s personal income, not the company itself.',
    },
    {
      q: 'How does Open Banking work for rental income?',
      a: 'Connect your UK bank account via Open Banking from the EasyTax dashboard. Rental payments credited to your account are automatically imported and tagged as property income. Expenses debited — insurance direct debits, maintenance payments, agent fees — are imported and AI-categorised. You review and confirm before any HMRC submission.',
    },
    {
      q: 'What happens between quarterly updates and the final Self Assessment?',
      a: 'Each quarter you file a short MTD ITSA update with your rental income and expenses — this takes about 5 minutes in EasyTax. At the end of the tax year you submit the full Self Assessment (SA100 + SA105), which consolidates the quarterly figures and calculates your final tax bill. You pay your tax bill directly to HMRC, not through EasyTax.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Landlord Tax Software — MTD ITSA Filing for UK Landlords, £24 per Submission',
    description: 'MTD ITSA quarterly updates and Self Assessment (SA100 + SA105 property supplement) filed directly to HMRC for UK landlords. £24 per submission, no subscription.',
    author: { '@type': 'Organization', name: 'EasyTax' },
    publisher: { '@type': 'Organization', name: 'Finance Panda Limited' },
    mainEntityOfPage: 'https://easytax.vip/landlord-tax-software',
  };

  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />

      <SiteHeader />

      <main className="flex-grow">

        {/* ── Hero ── */}
        <section className="pt-12 sm:pt-16 pb-10 sm:pb-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-5" style={{ backgroundColor: '#F0EBE1', color: '#C4622D', border: '1px solid #C4622D30' }}>
              <Sparkles size={12} /> MTD ITSA required from April 2026 — £50k+ landlords
            </div>
            <h1 style={{ fontFamily: display, fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              Landlord tax software.<br />
              <em style={{ color: '#C4622D', fontStyle: 'italic' }}>MTD ITSA + SA105. £24 per filing. No subscription.</em>
            </h1>
            <p className="text-base sm:text-xl leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              UK landlords with income above £50,000 must now file quarterly updates to HMRC under Making Tax Digital. EasyTax handles your <strong style={{ color: '#1C1208' }}>MTD ITSA quarterly updates</strong> and your <strong style={{ color: '#1C1208' }}>Self Assessment — including the SA105 property income supplement</strong> — for <strong style={{ color: '#6B8E6E' }}>£20 + VAT (£24 inc. VAT) per submission</strong>. No monthly subscription, no accountant required.
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#6B8E6E', color: '#FDFCF8' }}>£24 per filing</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>Built on the HMRC MTD API</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>MTD ITSA ready</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>SA105 property supplement</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                Get started →
              </Link>
              <a href="mailto:hello@easytax.vip?subject=Landlord%20MTD%20ITSA" className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', border: '1.5px solid #DDD5C8' }}>
                Ask us a question
              </a>
            </div>
          </div>
        </section>

        {/* ── MTD context ── */}
        <section className="py-12 sm:py-14" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700, marginBottom: '1.25rem' }}>
              MTD ITSA is mandatory for landlords from April 2026
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              Making Tax Digital for Income Tax Self Assessment (MTD ITSA) requires UK landlords and sole traders to send quarterly income and expense updates to HMRC digitally — in addition to the existing annual Self Assessment. If your total property income (plus any self-employment income) exceeds the threshold, you must use Software like EasyTax, which connects to the HMRC MTD API,.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'April 2026', title: 'MTD ITSA: £50k+', body: 'Quarterly updates now mandatory for landlords and sole traders with total income over £50,000 per year.' },
                { label: 'April 2027', title: 'MTD ITSA: £30k+', body: 'Threshold drops to £30,000. Around 1.4 million more landlords and sole traders join the quarterly filing cycle.' },
                { label: 'Ongoing', title: 'MTD VAT: £90k+', body: 'If you are VAT-registered (for furnished holiday lets or a trading business), MTD VAT is already mandatory.' },
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

        {/* ── Comparison table ── */}
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '0.5rem' }}>
              EasyTax vs an accountant vs a full accounting suite
            </h2>
            <p className="text-base mb-8" style={{ color: '#4A4035' }}>For a UK landlord who mainly needs MTD ITSA compliance and Self Assessment</p>
            <div className="rounded-2xl overflow-x-auto" style={{ border: '1px solid #E8E2DA', backgroundColor: '#FFFFFF' }}>
              <div style={{ minWidth: '640px' }}>
                <div className="grid grid-cols-[1.8fr_1fr_1fr_1fr]">
                  <div className="px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9A8F83', backgroundColor: '#F8F5F0', borderBottom: '1px solid #E8E2DA' }}>
                    Feature
                  </div>
                  <div className="px-3 py-4 text-center" style={{ backgroundColor: '#1C1208', borderBottom: '1px solid #E8E2DA' }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>EasyTax</p>
                    <p className="text-sm font-bold" style={{ color: '#FDFCF8' }}>£24 / filing</p>
                  </div>
                  <div className="px-3 py-4 text-center" style={{ backgroundColor: '#F8F5F0', borderBottom: '1px solid #E8E2DA' }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>Accountant</p>
                    <p className="text-sm font-bold" style={{ color: '#1C1208' }}>£400–£1,200/yr</p>
                  </div>
                  <div className="px-3 py-4 text-center" style={{ backgroundColor: '#F8F5F0', borderBottom: '1px solid #E8E2DA' }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>Suite (Xero etc.)</p>
                    <p className="text-sm font-bold" style={{ color: '#1C1208' }}>£144–£708/yr</p>
                  </div>

                  {rows.map((r, i) => (
                    <div key={r.feature} className="contents">
                      <div className="px-4 sm:px-6 py-4 text-sm" style={{ borderBottom: i === rows.length - 1 ? 'none' : '1px solid #F0EBE1', color: '#1C1208' }}>
                        <p className="font-medium">{r.feature}</p>
                        {r.note && <p className="text-xs mt-1" style={{ color: '#9A8F83' }}>{r.note}</p>}
                      </div>
                      <div className="px-3 py-4 text-center flex items-center justify-center" style={{ borderBottom: i === rows.length - 1 ? 'none' : '1px solid #F0EBE1', backgroundColor: '#FFFFFF' }}>
                        <Cell value={r.easytax} />
                      </div>
                      <div className="px-3 py-4 text-center flex items-center justify-center" style={{ borderBottom: i === rows.length - 1 ? 'none' : '1px solid #F0EBE1', backgroundColor: '#FAFAF7' }}>
                        <Cell value={r.accountant} />
                      </div>
                      <div className="px-3 py-4 text-center flex items-center justify-center" style={{ borderBottom: i === rows.length - 1 ? 'none' : '1px solid #F0EBE1', backgroundColor: '#FAFAF7' }}>
                        <Cell value={r.suite} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: '#9A8F83' }}>
              Accountant fees are indicative for simple landlord Self Assessment cases. Accounting suite pricing reflects Xero and similar mid-range plans as of mid-2026. EasyTax is not affiliated with any third party mentioned.
            </p>
          </div>
        </section>

        {/* ── How it works for landlords ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              How EasyTax works for landlords
            </h2>
            <ol className="space-y-5">
              {[
                {
                  title: 'Connect your bank via Open Banking',
                  body: 'Link your UK bank account in under 2 minutes. Rental payments are automatically imported as property income. Maintenance payments, insurance direct debits, and agent fees are imported and AI-categorised.',
                },
                {
                  title: 'Review and confirm your income and expenses',
                  body: 'EasyTax groups your transactions into HMRC categories — rental income, repairs, insurance, mortgage interest, agent fees. You review and confirm in a simple dashboard. The AI handles the categorisation; you stay in control.',
                },
                {
                  title: 'File your quarterly MTD ITSA update',
                  body: 'Once you have confirmed the quarter\'s figures, submit your update to HMRC with one click. EasyTax uses the official MTD ITSA API — you get a submission receipt. Typical time: under 5 minutes per quarter.',
                },
                {
                  title: 'File your Self Assessment at the end of the tax year',
                  body: 'At year end, EasyTax consolidates your four quarterly updates into the SA100 main return and the SA105 property income supplement. Review the figures, submit, and download your confirmation.',
                },
                {
                  title: 'Pay your tax bill directly to HMRC',
                  body: 'EasyTax shows you your estimated tax liability as the year progresses. When the final bill is confirmed after Self Assessment, you pay HMRC directly — not through EasyTax.',
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

        {/* ── Honest tradeoffs ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#FDFCF8' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              Honest tradeoffs
            </h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="p-6 rounded-2xl" style={{ backgroundColor: '#E2EDE2', border: '1px solid #6B8E6E30' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B8E6E' }}>EasyTax is the right fit if…</p>
                <ul className="space-y-2 text-sm" style={{ color: '#1C1208' }}>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>You have one to a handful of buy-to-let or residential rental properties.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>Your main goal is HMRC compliance at the lowest cost — not full bookkeeping software.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>You want Open Banking to automate income/expense tracking so you are not manually entering data.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>You are paying £400–£1,200/year for an accountant to do a straightforward landlord Self Assessment — and want to do it yourself for £120/year.</span></li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl" style={{ backgroundColor: '#F5E4D8', border: '1px solid #C4622D30' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#C4622D' }}>Consider a specialist if…</p>
                <ul className="space-y-2 text-sm" style={{ color: '#1C1208' }}>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>You are disposing of property and need Capital Gains Tax (CGT) calculations and reporting.</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>You have a large portfolio (10+ properties) with complex ownership structures or partnership arrangements.</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>You hold property in a limited company and need full company accounts prepared for Companies House as well as HMRC.</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>You need advice on tax planning, mortgage structuring, or portfolio optimisation.</span></li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              Landlord MTD ITSA — frequently asked questions
            </h2>
            <div style={{ borderTop: '1px solid #DDD5C8' }}>
              {faqItems.map((item) => (
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
              MTD ITSA is here for landlords.<br />
              <em style={{ color: '#C4622D', fontStyle: 'italic' }}>File for £24 a submission — not £1,000/year.</em>
            </h2>
            <p style={{ color: '#9A8F83', fontSize: '1rem', marginBottom: '2rem' }}>
              No card required. Connect your bank and file your first quarterly update in under 10 minutes.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                Get started →
              </Link>
              <a href="mailto:hello@easytax.vip?subject=Landlord%20MTD%20ITSA" className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: '#FDFCF8', color: '#1C1208' }}>
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

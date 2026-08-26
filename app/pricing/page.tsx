import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { Check, X, Sparkles, ArrowRight } from 'lucide-react';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'Pricing — MTD ITSA Filing Software, £24 per Submission | EasyTax',
  description: 'EasyTax charges £20 + VAT (£24 inc. VAT) per HMRC submission — MTD ITSA quarterly updates, Self Assessment, VAT returns and CT600. No monthly subscription. No card needed to sign up.',
  alternates: { canonical: 'https://easytax.vip/pricing' },
  openGraph: {
    title: 'EasyTax Pricing — £24 per Filing, No Subscription',
    description: 'File MTD ITSA, Self Assessment, VAT returns and CT600 to HMRC for £24 per submission (inc. VAT). No monthly subscription, no card needed to sign up.',
    url: 'https://easytax.vip/pricing',
    type: 'website',
    locale: 'en_GB',
    siteName: 'EasyTax',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EasyTax Pricing — £24 per HMRC Filing, No Subscription',
    description: 'MTD ITSA, Self Assessment, VAT, CT600 — £24 per submission (inc. VAT). No monthly fee.',
  },
};

const display = 'var(--font-display), Playfair Display, Georgia, serif';

type CompRow = { feature: string; included: boolean; note?: string };

const included: CompRow[] = [
  { feature: 'MTD ITSA quarterly updates (sole traders & landlords)', included: true },
  { feature: 'Self Assessment filing (SA100, SA103, SA105)', included: true },
  { feature: 'MTD VAT returns', included: true },
  { feature: 'CT600 Corporation Tax filing', included: true },
  { feature: 'Limited company P&L and Balance Sheet', included: true },
  { feature: 'Open Banking auto-import (Plaid)', included: true },
  { feature: 'AI expense categorisation (Claude)', included: true },
  { feature: 'AI bank reconciliation chat', included: true },
  { feature: 'No monthly subscription', included: true },
  { feature: 'No credit card to sign up', included: true },
  { feature: 'Founder price locked in for life', included: true, note: 'Early-access signups lock in £20+VAT per filing forever' },
];

type RivalRow = { name: string; model: string; typical: string };

const rivals: RivalRow[] = [
  { name: 'EasyTax',     model: '£24 per filing (inc. VAT)',     typical: '~£120 / year' },
  { name: 'FreeAgent',   model: '£19–£29 / month subscription',  typical: '£228–£348 / year' },
  { name: 'Xero',        model: '£16–£59 / month subscription',  typical: '£192–£708 / year' },
  { name: 'QuickBooks',  model: '£14–£90 / month subscription',  typical: '£168–£1,080 / year' },
  { name: 'Bokio',       model: '£10–£24 / month subscription',  typical: '£120–£288 / year' },
  { name: 'Sage',        model: '£15–£35 / month subscription',  typical: '£180–£420 / year' },
];

function Cell({ included: v }: { included: boolean }) {
  if (v) return <Check size={18} color="#6B8E6E" strokeWidth={2.5} className="mx-auto" />;
  return <X size={18} color="#C46262" strokeWidth={2.5} className="mx-auto" />;
}

export default async function PricingPage() {
  const session = await auth();
  const ctaHref = session ? '/dashboard' : '/register';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'EasyTax — MTD ITSA Filing Software',
    description: 'MTD ITSA quarterly updates, Self Assessment, VAT returns and CT600 filing for UK sole traders and limited companies. Pay per submission, no subscription.',
    brand: { '@type': 'Organization', name: 'Finance Panda Limited' },
    url: 'https://easytax.vip',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'GBP',
      price: '20.00',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '20.00',
        priceCurrency: 'GBP',
        referenceQuantity: { '@type': 'QuantitativeValue', value: '1', unitText: 'HMRC submission' },
      },
      description: '£20 + VAT (£24 inc. VAT) per HMRC submission. No monthly subscription.',
      availability: 'https://schema.org/PreOrder',
      url: 'https://easytax.vip/register',
    },
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How much does EasyTax cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'EasyTax charges £20 + VAT (£24 inc. VAT) per HMRC submission. There is no monthly subscription fee. For a typical sole trader with 4 quarterly MTD ITSA updates and 1 final declaration, the annual cost is approximately £120.',
        },
      },
      {
        '@type': 'Question',
        name: 'What does one "filing" mean?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'One filing = one HMRC submission: a quarterly MTD ITSA update, a Self Assessment return (SA100), a VAT return, or a CT600 Corporation Tax return. Bank connection and AI categorisation are included at no extra charge.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need a credit card to sign up?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. You can sign up, connect your bank, and categorise expenses for free. You only pay when you are ready to submit a return to HMRC.',
        },
      },
      {
        '@type': 'Question',
        name: 'Will the price go up in future?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Early-access signups lock in the £20 + VAT founder price for life. Sign up now to secure this rate before it rises.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does EasyTax support limited companies?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. EasyTax supports both sole traders / landlords (MTD ITSA, Self Assessment) and limited companies (VAT returns, CT600 Corporation Tax, Balance Sheet and P&L). The same £24 per filing price applies.',
        },
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <SiteHeader />

      <main className="flex-grow">

        {/* ── Hero ── */}
        <section className="pt-12 sm:pt-16 pb-12 sm:pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-5" style={{ backgroundColor: '#F0EBE1', color: '#C4622D', border: '1px solid #C4622D30' }}>
              <Sparkles size={12} /> Simple, pay-per-filing pricing
            </div>
            <h1 style={{ fontFamily: display, fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 700, color: '#1C1208', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              Pay per filing.<br />
              <em style={{ color: '#C4622D', fontStyle: 'italic' }}>Never per month.</em>
            </h1>
            <p className="text-base sm:text-lg leading-relaxed mb-8 mx-auto" style={{ color: '#4A4035', maxWidth: '560px' }}>
              EasyTax charges a flat <strong style={{ color: '#1C1208' }}>£24 per HMRC submission</strong> (inc. VAT). No subscription, no card needed to sign up. Bank connection and AI categorisation are always free.
            </p>
          </div>
        </section>

        {/* ── Price card ── */}
        <section className="pb-16 sm:pb-20">
          <div className="max-w-lg mx-auto px-4 sm:px-6">
            <div className="rounded-3xl overflow-hidden" style={{ border: '2px solid #C4622D', boxShadow: '0 20px 60px rgba(196,98,45,0.15)' }}>

              {/* header */}
              <div className="px-6 sm:px-8 py-6 sm:py-8" style={{ backgroundColor: '#1C1208' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#9A8F83' }}>Early access — founder price</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span style={{ fontFamily: display, fontSize: 'clamp(3rem, 8vw, 4.5rem)', fontWeight: 700, color: '#FDFCF8', lineHeight: 1 }}>£24</span>
                  <span className="text-base font-medium" style={{ color: '#9A8F83' }}>/ filing</span>
                </div>
                <p style={{ color: '#9A8F83', fontSize: '0.875rem' }}>£20 + VAT. Locked in for life for early-access signups.</p>
              </div>

              {/* features */}
              <div className="px-6 sm:px-8 py-6 sm:py-8" style={{ backgroundColor: '#FDFCF8' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: '#9A8F83' }}>Everything included</p>
                <ul className="space-y-3 mb-8">
                  {included.map((row) => (
                    <li key={row.feature} className="flex gap-3 text-sm" style={{ color: '#1C1208' }}>
                      <Check size={16} color="#6B8E6E" strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />
                      <span>
                        {row.feature}
                        {row.note && <span style={{ color: '#9A8F83', marginLeft: '0.25rem' }}>— {row.note}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href={ctaHref} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full font-semibold text-sm transition-all" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                  Get started free <ArrowRight size={16} />
                </Link>
                <p className="text-center text-xs mt-3" style={{ color: '#9A8F83' }}>No card required · Pay only when you file</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Annual cost comparison ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="mb-10 text-center">
              <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: '#1C1208', lineHeight: 1.2, marginBottom: '0.75rem' }}>
                How does it compare?
              </h2>
              <p style={{ color: '#4A4035', fontSize: '1rem', maxWidth: '480px', margin: '0 auto' }}>
                Based on a typical sole trader filing 4 quarterly updates + 1 final declaration per year.
              </p>
            </div>

            {/* mobile: stacked cards */}
            <div className="block sm:hidden space-y-3">
              {rivals.map((r) => (
                <div key={r.name} className="p-4 rounded-2xl" style={{ backgroundColor: r.name === 'EasyTax' ? '#1C1208' : '#FFFFFF', border: `1px solid ${r.name === 'EasyTax' ? '#C4622D' : '#E8E2DA'}` }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm" style={{ color: r.name === 'EasyTax' ? '#FDFCF8' : '#1C1208' }}>{r.name}</span>
                    {r.name === 'EasyTax' && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>Best value</span>}
                  </div>
                  <p className="text-xs mb-0.5" style={{ color: r.name === 'EasyTax' ? '#9A8F83' : '#4A4035' }}>{r.model}</p>
                  <p className="text-sm font-semibold" style={{ color: r.name === 'EasyTax' ? '#6B8E6E' : '#C4622D' }}>Typical: {r.typical}</p>
                </div>
              ))}
            </div>

            {/* desktop: table */}
            <div className="hidden sm:block overflow-x-auto rounded-2xl" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse', backgroundColor: '#FFFFFF' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1C1208' }}>
                    <th className="text-left px-6 py-4 font-semibold" style={{ color: '#9A8F83', width: '30%' }}>Software</th>
                    <th className="text-left px-6 py-4 font-semibold" style={{ color: '#9A8F83', width: '40%' }}>Pricing model</th>
                    <th className="text-left px-6 py-4 font-semibold" style={{ color: '#9A8F83', width: '30%' }}>Typical annual cost</th>
                  </tr>
                </thead>
                <tbody>
                  {rivals.map((r, i) => (
                    <tr key={r.name} style={{ borderBottom: i < rivals.length - 1 ? '1px solid #F0EBE1' : 'none', backgroundColor: r.name === 'EasyTax' ? '#F7F3EE' : 'transparent' }}>
                      <td className="px-6 py-4 font-bold" style={{ color: '#1C1208' }}>
                        {r.name}
                        {r.name === 'EasyTax' && <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#6B8E6E', color: '#FDFCF8' }}>Best value</span>}
                      </td>
                      <td className="px-6 py-4" style={{ color: '#4A4035' }}>{r.model}</td>
                      <td className="px-6 py-4 font-semibold" style={{ color: r.name === 'EasyTax' ? '#6B8E6E' : '#C4622D' }}>{r.typical}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-center mt-4" style={{ color: '#9A8F83' }}>Competitor prices as of August 2026. Subscription costs exclude VAT where applicable.</p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16 sm:py-24" style={{ backgroundColor: '#FDFCF8' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-center mb-10" style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: '#1C1208' }}>
              Pricing <em style={{ color: '#C4622D', fontStyle: 'italic' }}>questions</em>
            </h2>
            <div style={{ borderTop: '1px solid #DDD5C8' }}>
              {[
                {
                  q: 'How much does EasyTax cost?',
                  a: '£20 + VAT (£24 inc. VAT) per HMRC submission. There is no monthly subscription. A typical sole trader with 4 quarterly MTD ITSA updates and 1 final declaration per year pays approximately £120 in total.',
                },
                {
                  q: 'What counts as one filing?',
                  a: 'One filing = one HMRC submission: a quarterly MTD ITSA update, a Self Assessment return (SA100/SA103/SA105), a VAT return, or a CT600 Corporation Tax return. Bank connection and AI categorisation are always included at no extra charge.',
                },
                {
                  q: 'Do I need a credit card to sign up?',
                  a: 'No. You can create an account, connect your bank via Open Banking, and use AI categorisation for free. You only pay when you choose to submit a return to HMRC.',
                },
                {
                  q: 'Will the £24 price go up?',
                  a: 'Early-access signups lock in the £20 + VAT founder price for life. The price may increase for new signups in future, but your rate will never change.',
                },
                {
                  q: 'Does EasyTax work for limited companies?',
                  a: 'Yes. EasyTax supports both sole traders and landlords (MTD ITSA quarterly updates, Self Assessment) and limited companies (VAT returns, CT600 Corporation Tax, P&L and Balance Sheet). The same £24 per filing price applies to all submission types.',
                },
                {
                  q: 'Is there a free trial?',
                  a: 'The app is free to use until you submit a return to HMRC. Connect your bank, import transactions, and let AI categorise everything — then pay only when you are ready to file.',
                },
              ].map((item) => (
                <details key={item.q} className="group py-5 sm:py-6" style={{ borderBottom: '1px solid #DDD5C8' }}>
                  <summary className="flex justify-between items-center cursor-pointer list-none font-semibold text-sm sm:text-base" style={{ color: '#1C1208' }}>
                    {item.q}
                    <span style={{ color: '#C4622D', fontSize: '1.25rem', lineHeight: 1, flexShrink: 0, marginLeft: '1rem' }}>+</span>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed" style={{ color: '#4A4035' }}>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#1C1208' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: '#FDFCF8', marginBottom: '1rem' }}>
              Lock in your founder price today
            </h2>
            <p style={{ color: '#9A8F83', fontSize: '1rem', maxWidth: '460px', margin: '0 auto 2rem' }}>
              Sign up for free — no card required. Start filing MTD ITSA, Self Assessment, VAT and CT600 for £24 per submission.
            </p>
            <Link href={ctaHref} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm transition-all" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
              Get started free <ArrowRight size={16} />
            </Link>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="py-8 sm:py-10" style={{ backgroundColor: '#F0EBE1', borderTop: '1px solid #DDD5C8' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <p className="text-xs" style={{ color: '#9A8F83' }}>© 2026 Finance Panda Limited. All rights reserved.</p>
          <div className="flex gap-5 text-xs" style={{ color: '#9A8F83' }}>
            <Link href="/privacy" style={{ color: '#9A8F83', textDecoration: 'none' }}>Privacy</Link>
            <Link href="/terms"   style={{ color: '#9A8F83', textDecoration: 'none' }}>Terms</Link>
            <Link href="/freeagent-alternative" style={{ color: '#9A8F83', textDecoration: 'none' }}>vs FreeAgent</Link>
            <Link href="/xero-alternative"      style={{ color: '#9A8F83', textDecoration: 'none' }}>vs Xero</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

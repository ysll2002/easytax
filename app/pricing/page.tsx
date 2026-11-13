import type { Metadata } from 'next';
import { pageTitle } from '@/lib/seo-meta';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import NotifyMeForm from '@/components/NotifyMeForm';
import { Check, X, Sparkles, ArrowRight } from 'lucide-react';
import { auth } from '@/auth';
import SiteFooter from '@/components/SiteFooter';
import { OFFER_JSONLD, PRICE_DISPLAY, PRICE_MODEL, TYPICAL_ANNUAL_COST } from '@/lib/pricing';

export const metadata: Metadata = {
  title: pageTitle('Pricing — free, no subscription, no filing fee'),
  description: 'EasyTax is free. MTD ITSA quarterly updates, Self Assessment and VAT returns — no monthly subscription, no per-filing fee, no card needed to sign up.',
  alternates: { canonical: 'https://easytax.vip/pricing' },
  openGraph: {
    title: 'EasyTax Pricing — Free, No Subscription',
    description: 'File MTD ITSA, Self Assessment and VAT returns to HMRC for free. No monthly subscription, no per-filing fee, no card needed to sign up.',
    url: 'https://easytax.vip/pricing',
    type: 'website',
    locale: 'en_GB',
    siteName: 'EasyTax',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EasyTax Pricing — Free, No Subscription',
    description: 'MTD ITSA, Self Assessment and VAT — free. No monthly fee, no filing fee.',
  },
};

const display = 'var(--font-display), Playfair Display, Georgia, serif';

type CompRow = { feature: string; included: boolean; note?: string };

const included: CompRow[] = [
  { feature: 'MTD ITSA quarterly updates (sole traders & landlords)', included: true },
  { feature: 'Self Assessment filing (SA100, SA103, SA105)', included: true },
  { feature: 'MTD VAT returns', included: true },
  { feature: 'CT600 Corporation Tax filing', included: false, note: 'Filed through HMRC\'s Corporation Tax Online service, not the MTD APIs' },
  { feature: 'Limited company P&L and Balance Sheet', included: true },
  { feature: 'Open Banking auto-import (Plaid)', included: true },
  { feature: 'AI expense categorisation (Claude)', included: true },
  { feature: 'AI bank reconciliation chat', included: true },
  { feature: 'No monthly subscription', included: true },
  { feature: 'No per-filing fee', included: true },
  { feature: 'No credit card to sign up', included: true },
];

type RivalRow = { name: string; model: string; typical: string };

const rivals: RivalRow[] = [
  { name: 'EasyTax',     model: PRICE_MODEL,                    typical: TYPICAL_ANNUAL_COST },
  { name: 'FreeAgent',   model: '£19–£29 / month subscription',  typical: '£228–£348 / year' },
  { name: 'Xero',        model: '£16–£59 / month subscription',  typical: '£192–£708 / year' },
  { name: 'QuickBooks',  model: '£14–£90 / month subscription',  typical: '£168–£1,080 / year' },
  { name: 'Bokio',       model: '£10–£24 / month subscription',  typical: '£120–£288 / year' },
  { name: 'Sage',        model: '£15–£35 / month subscription',  typical: '£180–£420 / year' },
];

function Cell({ included: v }: { included: boolean }) {
  if (v) return <Check size={18} color="#4B6A4E" strokeWidth={2.5} className="mx-auto" />;
  return <X size={18} color="#C46262" strokeWidth={2.5} className="mx-auto" />;
}

export default async function PricingPage() {
  const session = await auth();
  const ctaHref = session ? '/dashboard' : '/register';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'EasyTax — MTD ITSA Filing Software',
    description: 'MTD ITSA quarterly updates, Self Assessment and VAT returns for UK sole traders and limited companies. Free — no subscription, no per-filing fee.',
    brand: { '@type': 'Organization', name: 'Finance Panda Limited' },
    url: 'https://easytax.vip',
    // Shares one Offer with the SoftwareApplication node in lib/site-entity.ts.
    // PreOrder, not InStock: the app is usable today but HMRC filing is still
    // waiting on production approval, so the thing this page offers is not yet
    // something a visitor can do.
    offers: {
      ...OFFER_JSONLD,
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
          text: 'Nothing. EasyTax is free to use: there is no monthly subscription and no per-filing fee. A sole trader filing 4 quarterly MTD ITSA updates and 1 final declaration pays £0 for the year.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is included?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Every HMRC submission type we support — quarterly MTD ITSA updates, Self Assessment (SA100, SA103, SA105) and VAT returns — plus Open Banking import, AI expense categorisation and the reconciliation chat. There is no paid tier. Corporation Tax (CT600) is not supported.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need a credit card to sign up?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. There is nothing to pay at any point, so EasyTax never asks for card details.',
        },
      },
      {
        '@type': 'Question',
        name: 'How is it free?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'EasyTax is built by Finance Panda Limited and is not yet monetised. HMRC filing is still going through production approval; getting the software used and the filings right matters more right now than charging for them. If that changes, existing accounts will be told before anything does.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does EasyTax support limited companies?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. EasyTax supports both sole traders / landlords (MTD ITSA, Self Assessment) and limited companies (VAT returns, Balance Sheet and P&L). All of it is free. Corporation Tax (CT600) is not supported.',
        },
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <SiteHeader />

      <main id="main-content" className="flex-grow">

        {/* ── Hero ── */}
        <section className="pt-12 sm:pt-16 pb-12 sm:pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-5" style={{ backgroundColor: '#F0EBE1', color: '#A04E1C', border: '1px solid #A04E1C30' }}>
              <Sparkles size={12} /> Free — no subscription, no filing fee
            </div>
            <h1 style={{ fontFamily: display, fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 700, color: '#1C1208', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              Nothing per month.<br />
              <em style={{ color: '#A04E1C', fontStyle: 'italic' }}>Nothing per filing.</em>
            </h1>
            <p className="text-base sm:text-lg leading-relaxed mb-8 mx-auto" style={{ color: '#4A4035', maxWidth: '560px' }}>
              EasyTax is <strong style={{ color: '#1C1208' }}>free to use</strong>. No subscription, no charge when you file, no card needed to sign up. Open Banking import and AI categorisation are included.
            </p>
          </div>
        </section>

        {/* ── Price card ── */}
        <section className="pb-16 sm:pb-20">
          <div className="max-w-lg mx-auto px-4 sm:px-6">
            <div className="rounded-3xl overflow-hidden" style={{ border: '2px solid #A04E1C', boxShadow: '0 20px 60px rgba(196,98,45,0.15)' }}>

              {/* header */}
              <div className="px-6 sm:px-8 py-6 sm:py-8" style={{ backgroundColor: '#1C1208' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#A89D90' }}>Every feature, every filing type</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span style={{ fontFamily: display, fontSize: 'clamp(3rem, 8vw, 4.5rem)', fontWeight: 700, color: '#FDFCF8', lineHeight: 1 }}>{PRICE_DISPLAY}</span>
                  <span className="text-base font-medium" style={{ color: '#A89D90' }}>/ filing</span>
                </div>
                <p style={{ color: '#A89D90', fontSize: '0.875rem' }}>No subscription, no per-filing fee. There is no paid tier to upgrade to.</p>
              </div>

              {/* features */}
              <div className="px-6 sm:px-8 py-6 sm:py-8" style={{ backgroundColor: '#FDFCF8' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: '#6B6256' }}>What you get</p>
                {/* The tick used to be unconditional, so `included: false` would
                    have rendered "CT600 — not supported" next to a green check.
                    The row now reads its own flag. */}
                <ul className="space-y-3 mb-8">
                  {included.map((row) => (
                    <li key={row.feature} className="flex gap-3 text-sm" style={{ color: row.included ? '#1C1208' : '#6B6256' }}>
                      {row.included
                        ? <Check size={16} color="#4B6A4E" strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />
                        : <X     size={16} color="#C46262" strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />}
                      <span>
                        {row.feature}
                        {row.note && <span style={{ color: '#6B6256', marginLeft: '0.25rem' }}>— {row.note}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href={ctaHref} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full font-semibold text-sm transition-all" style={{ backgroundColor: '#A04E1C', color: '#FDFCF8' }}>
                  Get started free <ArrowRight size={16} />
                </Link>
                <p className="text-center text-xs mt-3" style={{ color: '#6B6256' }}>No card required · Nothing to pay</p>
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
                The subscriptions below are charged whether you file once or twelve times.
              </p>
            </div>

            {/* mobile: stacked cards */}
            <div className="block sm:hidden space-y-3">
              {rivals.map((r) => (
                <div key={r.name} className="p-4 rounded-2xl" style={{ backgroundColor: r.name === 'EasyTax' ? '#1C1208' : '#FFFFFF', border: `1px solid ${r.name === 'EasyTax' ? '#A04E1C' : '#E8E2DA'}` }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm" style={{ color: r.name === 'EasyTax' ? '#FDFCF8' : '#1C1208' }}>{r.name}</span>
                    {r.name === 'EasyTax' && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#A04E1C', color: '#FDFCF8' }}>Free</span>}
                  </div>
                  <p className="text-xs mb-0.5" style={{ color: r.name === 'EasyTax' ? '#6B6256' : '#4A4035' }}>{r.model}</p>
                  <p className="text-sm font-semibold" style={{ color: r.name === 'EasyTax' ? '#4B6A4E' : '#A04E1C' }}>Typical: {r.typical}</p>
                </div>
              ))}
            </div>

            {/* desktop: table */}
            <div className="hidden sm:block overflow-x-auto rounded-2xl" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse', backgroundColor: '#FFFFFF' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1C1208' }}>
                    <th className="text-left px-6 py-4 font-semibold" style={{ color: '#C9BFB2', width: '30%' }}>Software</th>
                    <th className="text-left px-6 py-4 font-semibold" style={{ color: '#C9BFB2', width: '40%' }}>Pricing model</th>
                    <th className="text-left px-6 py-4 font-semibold" style={{ color: '#C9BFB2', width: '30%' }}>Typical annual cost</th>
                  </tr>
                </thead>
                <tbody>
                  {rivals.map((r, i) => (
                    <tr key={r.name} style={{ borderBottom: i < rivals.length - 1 ? '1px solid #F0EBE1' : 'none', backgroundColor: r.name === 'EasyTax' ? '#F7F3EE' : 'transparent' }}>
                      <td className="px-6 py-4 font-bold" style={{ color: '#1C1208' }}>
                        {r.name}
                        {r.name === 'EasyTax' && <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#4B6A4E', color: '#FDFCF8' }}>Free</span>}
                      </td>
                      <td className="px-6 py-4" style={{ color: '#4A4035' }}>{r.model}</td>
                      <td className="px-6 py-4 font-semibold" style={{ color: r.name === 'EasyTax' ? '#4B6A4E' : '#A04E1C' }}>{r.typical}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-center mt-4" style={{ color: '#6B6256' }}>Competitor prices as of August 2026. Subscription costs exclude VAT where applicable.</p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16 sm:py-24" style={{ backgroundColor: '#FDFCF8' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-center mb-10" style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: '#1C1208' }}>
              Pricing <em style={{ color: '#A04E1C', fontStyle: 'italic' }}>questions</em>
            </h2>
            <div style={{ borderTop: '1px solid #DDD5C8' }}>
              {[
                {
                  q: 'How much does EasyTax cost?',
                  a: 'Nothing. There is no monthly subscription and no per-filing fee. A sole trader filing 4 quarterly MTD ITSA updates and 1 final declaration pays £0 for the year.',
                },
                {
                  q: 'What is included?',
                  a: 'Every HMRC submission type we support — quarterly MTD ITSA updates, Self Assessment (SA100/SA103/SA105) and VAT returns — plus Open Banking import, AI expense categorisation and the reconciliation chat. There is no paid tier, so nothing is held back. Corporation Tax (CT600) is not supported: it is filed through HMRC\'s older Corporation Tax Online service, not the MTD APIs.',
                },
                {
                  q: 'Do I need a credit card to sign up?',
                  a: 'No. There is nothing to pay at any point, so EasyTax never asks for card details.',
                },
                {
                  q: 'How is it free? What is the catch?',
                  a: 'EasyTax is built by Finance Panda Limited and is not monetised. HMRC filing is still going through production approval; getting the software used and the filings right matters more right now than charging for them. Your data is not sold or shared — see /trust and /privacy for exactly what is stored and who it goes to. If the pricing ever changes, existing accounts will be told before it does.',
                },
                {
                  q: 'Does EasyTax work for limited companies?',
                  a: 'Yes. EasyTax supports both sole traders and landlords (MTD ITSA quarterly updates, Self Assessment) and limited companies (VAT returns, P&L and Balance Sheet). All of it is free. Corporation Tax (CT600) is the one thing we cannot file.',
                },
                {
                  q: 'Is there a free trial?',
                  a: 'There is nothing to trial — the whole product is free, with no time limit and no feature locked behind a plan.',
                },
              ].map((item) => (
                <details key={item.q} className="group py-5 sm:py-6" style={{ borderBottom: '1px solid #DDD5C8' }}>
                  <summary className="flex justify-between items-center cursor-pointer list-none font-semibold text-sm sm:text-base" style={{ color: '#1C1208' }}>
                    {item.q}
                    <span style={{ color: '#A04E1C', fontSize: '1.25rem', lineHeight: 1, flexShrink: 0, marginLeft: '1rem' }}>+</span>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed" style={{ color: '#4A4035' }}>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Launch list ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#F0EBE1', borderTop: '1px solid #DDD5C8' }}>
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <NotifyMeForm
              source="pricing"
              heading="Not filing yet?"
              blurb="Not signed up for Making Tax Digital yet? Leave your email and we'll remind you before each quarterly deadline — nothing else, unsubscribe in one click."
            />
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#1C1208' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: '#FDFCF8', marginBottom: '1rem' }}>
              Start filing without paying for it
            </h2>
            <p style={{ color: '#A89D90', fontSize: '1rem', maxWidth: '460px', margin: '0 auto 2rem' }}>
              Sign up free — no card required, nothing to pay. MTD ITSA, Self Assessment and VAT, all included.
            </p>
            <Link href={ctaHref} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm transition-all" style={{ backgroundColor: '#A04E1C', color: '#FDFCF8' }}>
              Get started free <ArrowRight size={16} />
            </Link>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <SiteFooter />
    </div>
  );
}

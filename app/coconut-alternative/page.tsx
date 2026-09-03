import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { Check, X, Sparkles, ArrowRight } from 'lucide-react';
import { auth } from '@/auth';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Coconut Alternative — MTD ITSA Software for UK Sole Traders',
  description: 'Looking for a Coconut alternative? EasyTax offers MTD ITSA quarterly updates, Self Assessment, VAT and CT600 for £20 + VAT (£24 inc. VAT) per submission — no subscription, no card to sign up. Built for UK sole traders, landlords and limited companies.',
  alternates: { canonical: 'https://easytax.vip/coconut-alternative' },
  openGraph: {
    title: 'Coconut Alternative — MTD ITSA Software for UK Sole Traders',
    description: 'MTD ITSA software for sole traders, landlords and limited companies. £24 per submission, no subscription.',
    url: 'https://easytax.vip/coconut-alternative',
    type: 'article',
    locale: 'en_GB',
    siteName: 'EasyTax',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coconut Alternative — MTD ITSA Software, £24 per Filing',
    description: 'MTD ITSA software for sole traders, landlords and limited companies. £24 per submission, no subscription.',
  },
};

const display = 'var(--font-display), Playfair Display, Georgia, serif';

type Row = { feature: string; easytax: string | boolean; coconut: string | boolean; note?: string };

const rows: Row[] = [
  { feature: 'Pricing model',                      easytax: '£24 per filing', coconut: 'Annual subscription' },
  { feature: 'Typical annual cost',                easytax: '~£120',          coconut: '£99.99 – £159.99' },
  { feature: 'No trial limit, no card needed',     easytax: true,           coconut: false,             note: 'Coconut is 14-day trial then paid' },
  { feature: 'MTD ITSA quarterly updates',         easytax: true,           coconut: true },
  { feature: 'Self Assessment (SA100)',            easytax: true,           coconut: true },
  { feature: 'VAT returns (MTD VAT)',              easytax: true,           coconut: false,             note: 'Coconut focuses on Income Tax, not VAT' },
  { feature: 'CT600 Corporation Tax',              easytax: true,           coconut: false,             note: 'Coconut does not file company tax' },
  { feature: 'Limited company accounts (P&L, Balance Sheet)', easytax: true, coconut: false },
  { feature: 'Open Banking auto-import',           easytax: true,           coconut: true },
  { feature: 'AI expense categorisation',          easytax: true,           coconut: false,             note: 'EasyTax uses Claude to categorise and reconcile' },
  { feature: 'AI bank reconciliation chat',        easytax: true,           coconut: false },
  { feature: 'CIS subcontractor support',          easytax: false,          coconut: true,              note: 'On EasyTax roadmap' },
  { feature: 'Mobile app',                         easytax: 'Web (mobile-optimised)', coconut: 'Native iOS/Android' },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true)  return <Check size={18} color="#6B8E6E" strokeWidth={2.5} className="mx-auto" />;
  if (value === false) return <X     size={18} color="#C46262" strokeWidth={2.5} className="mx-auto" />;
  return <span className="text-sm" style={{ color: '#1C1208' }}>{value}</span>;
}

export default async function CoconutAlternative() {
  const session = await auth();
  const ctaHref = session ? '/dashboard' : '/register';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Coconut Alternative — MTD ITSA Software for UK Sole Traders',
    description: 'Side-by-side comparison of EasyTax and Coconut for UK sole traders, landlords and limited companies looking for MTD ITSA software without a subscription.',
    author: { '@type': 'Organization', name: 'EasyTax' },
    publisher: { '@type': 'Organization', name: 'Finance Panda Limited' },
    mainEntityOfPage: 'https://easytax.vip/coconut-alternative',
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SiteHeader />

      <main className="flex-grow">

        {/* ── Hero ── */}
        <section className="pt-12 sm:pt-16 pb-10 sm:pb-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-5" style={{ backgroundColor: '#F0EBE1', color: '#C4622D', border: '1px solid #C4622D30' }}>
              <Sparkles size={12} /> Comparison
            </div>
            <h1 style={{ fontFamily: display, fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              Looking for a <em style={{ color: '#C4622D', fontStyle: 'italic' }}>Coconut alternative</em>?
            </h1>
            <p className="text-base sm:text-xl leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '640px' }}>
              Coconut starts at <strong style={{ color: '#1C1208' }}>£99.99/year</strong> and tops out at £159.99/year, billed whether you file or not. EasyTax charges <strong style={{ color: '#6B8E6E' }}>£20 + VAT (£24 inc. VAT) per HMRC submission</strong> with no subscription — and we cover limited companies, which Coconut doesn&apos;t.
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#6B8E6E', color: '#FDFCF8' }}>£24 per filing</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>No card to sign up</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>Sole traders + limited companies</span>
            </div>
          </div>
        </section>

        {/* ── Comparison table ── */}
        <section className="pb-16 sm:pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E8E2DA', backgroundColor: '#FFFFFF' }}>
              <div className="grid grid-cols-[1.6fr_1fr_1fr]">
                {/* header */}
                <div className="px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9A8F83', backgroundColor: '#F8F5F0', borderBottom: '1px solid #E8E2DA' }}>
                  Feature
                </div>
                <div className="px-4 py-4 text-center" style={{ backgroundColor: '#1C1208', borderBottom: '1px solid #E8E2DA' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>EasyTax</p>
                  <p className="text-sm font-bold" style={{ color: '#FDFCF8' }}>£24 / filing</p>
                </div>
                <div className="px-4 py-4 text-center" style={{ backgroundColor: '#F8F5F0', borderBottom: '1px solid #E8E2DA' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>Coconut</p>
                  <p className="text-sm font-bold" style={{ color: '#1C1208' }}>£99.99 – £159.99</p>
                </div>

                {rows.map((r, i) => (
                  <div key={r.feature} className="contents">
                    <div className="px-4 sm:px-6 py-4 text-sm" style={{ borderBottom: i === rows.length - 1 ? 'none' : '1px solid #F0EBE1', color: '#1C1208' }}>
                      <p className="font-medium">{r.feature}</p>
                      {r.note && <p className="text-xs mt-1" style={{ color: '#9A8F83' }}>{r.note}</p>}
                    </div>
                    <div className="px-4 py-4 text-center flex items-center justify-center" style={{ borderBottom: i === rows.length - 1 ? 'none' : '1px solid #F0EBE1', backgroundColor: '#FFFFFF' }}>
                      <Cell value={r.easytax} />
                    </div>
                    <div className="px-4 py-4 text-center flex items-center justify-center" style={{ borderBottom: i === rows.length - 1 ? 'none' : '1px solid #F0EBE1', backgroundColor: '#FAFAF7' }}>
                      <Cell value={r.coconut} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: '#9A8F83' }}>
              Pricing and features for Coconut are sourced from getcoconut.com and accurate as of June 2026. We are not affiliated with Coconut.
            </p>
          </div>
        </section>

        {/* ── Why switch ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '2rem' }}>
              Why people switch from <em style={{ color: '#C4622D', fontStyle: 'italic' }}>Coconut</em> to EasyTax
            </h2>

            <div className="grid sm:grid-cols-2 gap-5">
              {[
                {
                  title: 'It’s actually free — not a 14-day trial',
                  body: 'Coconut’s free tier is a 14-day trial. After that you’re on £99.99 – £159.99/year whether you file or not. EasyTax has no subscription at all — you pay £20 + VAT (£24 inc. VAT) only when you actually submit to HMRC, and nothing to sign up.',
                },
                {
                  title: 'You can file company tax (CT600), not just sole trader',
                  body: 'Coconut is built for sole traders, landlords and CIS subcontractors. If you have a limited company, you still need a separate tool for CT600, Balance Sheet and P&L. EasyTax does all of it in one place.',
                },
                {
                  title: 'VAT returns are first-class, not missing',
                  body: 'Coconut focuses on Income Tax. If you’re VAT-registered, EasyTax files MTD VAT returns directly to HMRC.',
                },
                {
                  title: 'AI does the reconciliation, not you',
                  body: 'EasyTax uses Claude to categorise every transaction and answer questions about your books in plain English. Coconut’s categorisation is rule-based.',
                },
              ].map((item) => (
                <div key={item.title} className="p-6 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2DA' }}>
                  <h3 className="font-semibold mb-2" style={{ fontFamily: display, fontSize: '1.1rem', color: '#1C1208' }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#4A4035' }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── When Coconut is the better fit ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#FDFCF8' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, marginBottom: '1.25rem' }}>
              When Coconut might be a better fit
            </h2>
            <p className="text-base leading-relaxed mb-4" style={{ color: '#4A4035' }}>
              We want to be honest: Coconut has been around longer and there are scenarios where it wins.
            </p>
            <ul className="space-y-3 mb-6">
              {[
                'You’re a CIS subcontractor and need CIS-specific tooling today (EasyTax is adding this).',
                'You want a polished native iOS/Android app (EasyTax is a mobile-optimised web app).',
                'You bank with Zempler — Coconut bundles 2 years free with a Zempler business account.',
                'Your accountant already uses Coconut’s accountant portal.',
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm" style={{ color: '#4A4035' }}>
                  <ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm" style={{ color: '#9A8F83' }}>
              For everyone else — especially sole traders who don’t want to pay £100+/year, and limited companies that need CT600 — EasyTax is the simpler, cheaper choice.
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="pb-16" style={{ backgroundColor: '#FDFCF8' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              FAQ
            </h2>
            <div style={{ borderTop: '1px solid #DDD5C8' }}>
              {[
                { q: 'How much does EasyTax cost?',                       a: 'EasyTax charges £20 + VAT (£24 inc. VAT) per HMRC submission. No monthly subscription — you only pay when you file. Early-access signups lock in this founder price for life. Connecting your bank and HMRC accounts is free.' },
                { q: 'Is EasyTax MTD ITSA-ready?',                        a: 'Yes. EasyTax sends quarterly updates and final declarations to HMRC via the official MTD ITSA API. We use the HMRC-recognised software route.' },
                { q: 'Can I migrate from Coconut?',                       a: 'Yes. Sign up free, connect your bank via Open Banking, and your transactions import automatically. There’s nothing to export from Coconut — you simply start fresh and we backfill from your bank.' },
                { q: 'Does EasyTax support Self Assessment (SA100)?',     a: 'Yes — including SA100, employment income, self-employment (SA103), property income (SA105), and dividends. We file directly to HMRC.' },
                { q: 'Does EasyTax support limited companies?',           a: 'Yes — that’s the biggest gap vs Coconut. EasyTax does VAT returns (MTD VAT), CT600 Corporation Tax, Balance Sheet, and P&L for UK limited companies.' },
                { q: 'Is the per-filing price locked in?',                 a: 'Yes. Users who sign up during the current early-access period lock in the £20+VAT founder price for life — even as we add features and the standard price increases. You pay nothing until you file.' },
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
              No subscription. Ever.<br />
              <em style={{ color: '#C4622D', fontStyle: 'italic' }}>Pay only when you file.</em>
            </h2>
            <p style={{ color: '#9A8F83', fontSize: '1rem', marginBottom: '2rem' }}>
              No card to sign up. No 14-day countdown. £24 per HMRC submission, and nothing until you file. Built for UK sole traders, landlords, and limited companies.
            </p>
            <Link href={ctaHref} className="inline-block px-10 py-4 rounded-full font-medium transition-all" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
              Get started →
            </Link>
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}

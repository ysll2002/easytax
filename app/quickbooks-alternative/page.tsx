import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { Check, X, Sparkles, ArrowRight } from 'lucide-react';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'QuickBooks Alternative UK — MTD ITSA Software for UK Sole Traders',
  description: 'Looking for a QuickBooks alternative in the UK? EasyTax files MTD ITSA quarterly updates, Self Assessment, VAT and CT600 directly to HMRC. £24 per filing — no monthly subscription.',
  alternates: { canonical: 'https://easytax.vip/quickbooks-alternative' },
  openGraph: {
    title: 'QuickBooks Alternative UK — MTD ITSA + Self Assessment + VAT',
    description: 'QuickBooks charges £30+/month. EasyTax files MTD ITSA, Self Assessment, VAT and CT600 to HMRC for £24 per submission — no subscription.',
    url: 'https://easytax.vip/quickbooks-alternative',
    type: 'article',
    locale: 'en_GB',
    siteName: 'EasyTax',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuickBooks Alternative UK — MTD ITSA Software',
    description: 'Switch from QuickBooks to EasyTax — file to HMRC for £24/submission, no monthly fee.',
  },
};

const display = 'var(--font-display), Playfair Display, Georgia, serif';

type Row = { feature: string; easytax: string | boolean; qb: string | boolean; note?: string };

const rows: Row[] = [
  { feature: 'Price',                                 easytax: '£24/submission',   qb: 'From £14/mo+VAT',        note: 'QuickBooks Simple Start billed monthly; higher tiers cost more' },
  { feature: 'No monthly subscription',               easytax: true,               qb: false,                    note: 'EasyTax is pay-per-submission, not a recurring fee' },
  { feature: 'No card required to sign up',           easytax: true,               qb: false },
  { feature: 'MTD ITSA quarterly updates',            easytax: true,               qb: true },
  { feature: 'Self Assessment (SA100, SA103, SA105)', easytax: true,               qb: true },
  { feature: 'MTD VAT submission',                    easytax: true,               qb: true },
  { feature: 'CT600 Corporation Tax filing',          easytax: true,               qb: true },
  { feature: 'Limited company P&L and Balance Sheet', easytax: true,               qb: true },
  { feature: 'Open Banking auto-import',              easytax: true,               qb: true },
  { feature: 'AI expense categorisation',             easytax: true,               qb: false,                    note: 'EasyTax uses Claude to categorise and reconcile' },
  { feature: 'AI bank reconciliation chat',           easytax: true,               qb: false },
  { feature: 'Full double-entry bookkeeping',         easytax: false,              qb: true,                     note: 'EasyTax focuses on tax filing, not a full ledger' },
  { feature: 'Built-in invoicing',                    easytax: false,              qb: true,                     note: 'EasyTax pairs with GrumpyWhales (free) for invoicing' },
  { feature: 'Payroll',                               easytax: false,              qb: true,                     note: 'Add-on in QuickBooks; not in EasyTax' },
  { feature: 'Inventory management',                  easytax: false,              qb: true },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true)  return <Check size={18} color="#6B8E6E" strokeWidth={2.5} className="mx-auto" />;
  if (value === false) return <X     size={18} color="#C46262" strokeWidth={2.5} className="mx-auto" />;
  return <span className="text-sm" style={{ color: '#1C1208' }}>{value}</span>;
}

export default async function QuickBooksAlternative() {
  const session = await auth();
  const ctaHref = session ? '/dashboard' : '/register';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'QuickBooks Alternative UK — MTD ITSA Software for UK Sole Traders',
    description: 'Side-by-side comparison of EasyTax and QuickBooks for UK sole traders, landlords and limited companies.',
    author: { '@type': 'Organization', name: 'EasyTax' },
    publisher: { '@type': 'Organization', name: 'Finance Panda Limited' },
    mainEntityOfPage: 'https://easytax.vip/quickbooks-alternative',
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
              <Sparkles size={12} /> The MTD-first QuickBooks alternative
            </div>
            <h1 style={{ fontFamily: display, fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              Paying <em style={{ color: '#C4622D', fontStyle: 'italic' }}>£14–£38/month</em> for QuickBooks? Switch to £24 per filing — no subscription.
            </h1>
            <p className="text-base sm:text-xl leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              QuickBooks is powerful — but if you are a UK sole trader who mainly needs <strong style={{ color: '#1C1208' }}>MTD ITSA filing</strong> and <strong style={{ color: '#1C1208' }}>Self Assessment</strong>, you are paying a monthly fee for features you don&apos;t use. EasyTax charges <strong style={{ color: '#C4622D' }}>£24 per HMRC submission</strong> — nothing else.
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>£24 per filing</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>No monthly subscription</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>HMRC-recognised</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>Sole traders + limited companies</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                Get started — no subscription →
              </Link>
              <a href="mailto:hello@easytax.vip?subject=QuickBooks%20migration" className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', border: '1.5px solid #DDD5C8' }}>
                Ask us a question
              </a>
            </div>
          </div>
        </section>

        {/* ── Price comparison ── */}
        <section className="py-12 sm:py-14" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700, marginBottom: '1.25rem' }}>
              What does QuickBooks actually cost a sole trader?
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              QuickBooks Simple Start starts at around £14/month + VAT. Most sole traders end up on Essentials (£28/month + VAT) for the features they actually need. That&apos;s <strong>£336–£403/year inc. VAT</strong> — before you factor in any add-ons. EasyTax charges £24 per HMRC submission. If you file quarterly and annually, that&apos;s <strong>5 submissions × £24 = £120/year total</strong>.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDD5C8' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#C4622D' }}>QuickBooks (est.)</p>
                <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>£336–£403 / year</p>
                <p className="text-sm" style={{ color: '#4A4035' }}>Monthly subscription regardless of whether you file. Charged even in quiet months.</p>
              </div>
              <div className="p-5 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDD5C8' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B8E6E' }}>EasyTax</p>
                <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>£24 per submission</p>
                <p className="text-sm" style={{ color: '#4A4035' }}>You only pay when you actually file with HMRC. Free to connect, free to use the dashboard.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Comparison table ── */}
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              Side-by-side: <em style={{ color: '#C4622D', fontStyle: 'italic' }}>QuickBooks</em> vs EasyTax
            </h2>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E8E2DA', backgroundColor: '#FFFFFF' }}>
              <div className="grid grid-cols-[1.6fr_1fr_1fr]">
                <div className="px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9A8F83', backgroundColor: '#F8F5F0', borderBottom: '1px solid #E8E2DA' }}>Feature</div>
                <div className="px-4 py-4 text-center" style={{ backgroundColor: '#1C1208', borderBottom: '1px solid #E8E2DA' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>EasyTax</p>
                  <p className="text-sm font-bold" style={{ color: '#FDFCF8' }}>£24 / filing</p>
                </div>
                <div className="px-4 py-4 text-center" style={{ backgroundColor: '#F8F5F0', borderBottom: '1px solid #E8E2DA' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>QuickBooks</p>
                  <p className="text-sm font-bold" style={{ color: '#1C1208' }}>£14–£38/mo+VAT</p>
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
                      <Cell value={r.qb} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: '#9A8F83' }}>
              QuickBooks pricing reflects standard UK plans as of mid-2026. We are not affiliated with QuickBooks or Intuit. QuickBooks is a registered trademark of Intuit Inc.
            </p>
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
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B8E6E' }}>Where EasyTax wins</p>
                <ul className="space-y-2 text-sm" style={{ color: '#1C1208' }}>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>Pay only when you file — no monthly commitment.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>AI bank reconciliation chat — describe a transaction in plain English.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>Built for MTD ITSA from day one — not a legacy product retrofitted for UK compliance.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>No card required to sign up and connect your accounts.</span></li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl" style={{ backgroundColor: '#F5E4D8', border: '1px solid #C4622D30' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#C4622D' }}>Where QuickBooks wins</p>
                <ul className="space-y-2 text-sm" style={{ color: '#1C1208' }}>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Full double-entry accounting ledger.</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Invoicing, quotes, and client management built in.</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Payroll and CIS.</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Inventory tracking for product businesses.</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Large ecosystem of accountant integrations.</span></li>
                </ul>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed" style={{ color: '#4A4035', maxWidth: '680px' }}>
              QuickBooks earns its subscription if you need invoicing, payroll, inventory, or a full ledger. But if you are a <strong>sole trader or landlord who mainly needs to stay HMRC-compliant</strong> — quarterly MTD updates and an annual Self Assessment — EasyTax gives you the same compliance at a fraction of the cost.
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, marginBottom: '1.5rem' }}>FAQ</h2>
            <div style={{ borderTop: '1px solid #DDD5C8' }}>
              {[
                {
                  q: 'How much does EasyTax cost?',
                  a: 'EasyTax charges £20 + VAT (£24 inc. VAT) per HMRC submission. No monthly subscription — you only pay when you file. Users who sign up during our early-access period lock in this founder price for life.',
                },
                {
                  q: 'Can EasyTax replace QuickBooks for a sole trader?',
                  a: "If you use QuickBooks mainly for MTD ITSA, Self Assessment, and bank reconciliation — yes, EasyTax covers all of that. If you also rely on QuickBooks for invoicing or payroll, you'd pair EasyTax with a specialist invoicing tool (we recommend GrumpyWhales, which is free) and a payroll tool.",
                },
                {
                  q: 'How do I migrate my QuickBooks data?',
                  a: "Export your transaction history and reports from QuickBooks Online (Reports → all transactions CSV). Email them to hello@easytax.vip and we'll load them into your account. Connect your bank via Open Banking and EasyTax starts auto-importing from today.",
                },
                {
                  q: 'Does EasyTax support MTD VAT and CT600?',
                  a: 'Yes — EasyTax files MTD VAT returns and CT600 Corporation Tax directly to HMRC, and produces P&L and Balance Sheet for limited companies.',
                },
                {
                  q: 'When does MTD ITSA become mandatory?',
                  a: 'From 6 April 2026 for sole traders and landlords with income over £50,000. From 6 April 2027 for income over £30,000.',
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
              Stop paying £300+/year for features you don&apos;t use.<br />
              <em style={{ color: '#C4622D', fontStyle: 'italic' }}>Pay £24 when you file. Nothing else.</em>
            </h2>
            <p style={{ color: '#9A8F83', fontSize: '1rem', marginBottom: '2rem' }}>No card required to start. Early signups lock in the founder price.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                Get started — no subscription →
              </Link>
              <a href="mailto:hello@easytax.vip?subject=QuickBooks%20migration" className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: '#FDFCF8', color: '#1C1208' }}>
                Ask us a question
              </a>
            </div>
          </div>
        </section>

      </main>

      <footer style={{ borderTop: '1px solid #2E2418', backgroundColor: '#1C1208', padding: '3rem 0' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div style={{ fontFamily: display, fontSize: '1.1rem', color: '#4A4035' }}>EasyTax Ltd. Built in London.</div>
          <div className="flex gap-6 text-sm" style={{ color: '#4A4035' }}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

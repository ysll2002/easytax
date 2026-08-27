import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { Check, X, Sparkles, ArrowRight } from 'lucide-react';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'Sage Alternative — MTD ITSA Software for UK Sole Traders, £24 per Filing',
  description: 'Looking for a Sage Accounting alternative? EasyTax files MTD ITSA quarterly updates, Self Assessment, VAT and CT600 directly to HMRC for £20 + VAT (£24 inc. VAT) per submission — no monthly subscription, no card to sign up.',
  alternates: { canonical: 'https://easytax.vip/sage-alternative' },
  openGraph: {
    title: 'Sage Accounting Alternative — MTD ITSA + Self Assessment + VAT',
    description: 'Sage Accounting charges up to £336+/year on subscription. EasyTax files MTD ITSA, Self Assessment, VAT and CT600 to HMRC for £24 per submission — no subscription.',
    url: 'https://easytax.vip/sage-alternative',
    type: 'article',
    locale: 'en_GB',
    siteName: 'EasyTax',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sage Accounting Alternative — MTD ITSA Software, £24 per Filing',
    description: 'Sage Accounting charges £336+/year. EasyTax charges £24 per submission, no subscription.',
  },
};

const display = 'var(--font-display), Playfair Display, Georgia, serif';

type Row = { feature: string; easytax: string | boolean; sage: string | boolean; note?: string };

const rows: Row[] = [
  { feature: 'Pricing model',                         easytax: '£24 per filing', sage: 'From £144+VAT/yr',   note: 'Sage Accounting charges monthly; EasyTax charges £20+VAT per HMRC submission' },
  { feature: 'Typical annual cost',                   easytax: '~£120',          sage: '£144–£336+',         note: 'Based on 4 quarterly MTD updates + 1 final declaration vs Sage Start/Standard plans' },
  { feature: 'No card to sign up',                    easytax: true,             sage: false },
  { feature: 'MTD ITSA quarterly updates',            easytax: true,             sage: true },
  { feature: 'Self Assessment (SA100, SA103, SA105)', easytax: true,             sage: true },
  { feature: 'MTD VAT submission',                    easytax: true,             sage: true },
  { feature: 'CT600 Corporation Tax filing',          easytax: true,             sage: true },
  { feature: 'Limited company P&L and Balance Sheet', easytax: true,             sage: true },
  { feature: 'Open Banking auto-import',              easytax: true,             sage: true },
  { feature: 'AI expense categorisation',             easytax: true,             sage: false,                note: 'EasyTax uses Claude AI to categorise and reconcile bank transactions' },
  { feature: 'AI bank reconciliation chat',           easytax: true,             sage: false },
  { feature: 'Full double-entry bookkeeping',         easytax: false,            sage: true,                 note: 'EasyTax focuses on tax filing; Sage is a full accounting ledger' },
  { feature: 'Built-in invoicing',                    easytax: false,            sage: true,                 note: 'EasyTax pairs with GrumpyWhales (free) for invoicing' },
  { feature: 'Payroll',                               easytax: false,            sage: true,                 note: 'Sage Payroll available as an add-on or bundle' },
  { feature: 'Stock / inventory management',          easytax: false,            sage: true },
  { feature: 'Multi-currency support',                easytax: false,            sage: true },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true)  return <Check size={18} color="#6B8E6E" strokeWidth={2.5} className="mx-auto" />;
  if (value === false) return <X     size={18} color="#C46262" strokeWidth={2.5} className="mx-auto" />;
  return <span className="text-sm" style={{ color: '#1C1208' }}>{value}</span>;
}

export default async function SageAlternative() {
  const session = await auth();
  const ctaHref = session ? '/dashboard' : '/register';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Sage Accounting Alternative — MTD ITSA Software for UK Sole Traders',
    description: 'Side-by-side comparison of EasyTax and Sage Accounting for UK sole traders and limited companies. EasyTax files MTD ITSA, Self Assessment, VAT and CT600 for £24 per submission with no subscription.',
    author: { '@type': 'Organization', name: 'EasyTax' },
    publisher: { '@type': 'Organization', name: 'Finance Panda Limited' },
    mainEntityOfPage: 'https://easytax.vip/sage-alternative',
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
              <Sparkles size={12} /> The no-subscription Sage Accounting alternative
            </div>
            <h1 style={{ fontFamily: display, fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              Paying <em style={{ color: '#C4622D', fontStyle: 'italic' }}>£336/year</em> for Sage? EasyTax files the same HMRC returns for £24 each.
            </h1>
            <p className="text-base sm:text-xl leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              Sage Accounting is a powerful platform — but if you are a UK sole trader, landlord, or small limited company mainly needing <strong style={{ color: '#1C1208' }}>MTD ITSA quarterly updates</strong> and <strong style={{ color: '#1C1208' }}>Self Assessment</strong>, you are paying for a full accounting suite you will never fully use. EasyTax covers all the same HMRC filings for <strong style={{ color: '#6B8E6E' }}>£20 + VAT (£24 inc. VAT) per submission</strong> — no monthly fee, so you only pay when you actually file.
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#6B8E6E', color: '#FDFCF8' }}>£24 per filing</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>HMRC-recognised</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>MTD ITSA ready</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>Sole traders + limited companies</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                Get started →
              </Link>
              <a href="mailto:hello@easytax.vip?subject=Sage%20migration" className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', border: '1.5px solid #DDD5C8' }}>
                Ask us a question
              </a>
            </div>
          </div>
        </section>

        {/* ── MTD context ── */}
        <section className="py-12 sm:py-14" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700, marginBottom: '1.25rem' }}>
              MTD ITSA is now mandatory — do you really need a £336/year accounting suite?
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              From <strong>6 April 2026</strong>, every UK sole trader or landlord with income above <strong>£50,000</strong> must file quarterly updates through MTD-compatible software. The threshold drops to <strong>£30,000</strong> in April 2027. Sage Accounting supports MTD ITSA — but if compliance is your main goal, EasyTax gives you the same HMRC filings at a fraction of the cost.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'April 2026', title: 'MTD ITSA: £50k+', body: 'Quarterly updates mandatory for sole traders and landlords earning over £50,000.' },
                { label: 'April 2027', title: 'MTD ITSA: £30k+', body: 'Threshold drops to £30,000. Around 1.4 million more taxpayers join the quarterly cycle.' },
                { label: 'Always', title: 'MTD VAT: £90k+', body: 'If you are VAT-registered above the £90,000 threshold, MTD VAT is already mandatory.' },
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
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              Side-by-side: <em style={{ color: '#C4622D', fontStyle: 'italic' }}>Sage Accounting</em> vs EasyTax
            </h2>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E8E2DA', backgroundColor: '#FFFFFF' }}>
              <div className="grid grid-cols-[1.6fr_1fr_1fr]">
                <div className="px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9A8F83', backgroundColor: '#F8F5F0', borderBottom: '1px solid #E8E2DA' }}>
                  Feature
                </div>
                <div className="px-4 py-4 text-center" style={{ backgroundColor: '#1C1208', borderBottom: '1px solid #E8E2DA' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>EasyTax</p>
                  <p className="text-sm font-bold" style={{ color: '#FDFCF8' }}>£24 / filing</p>
                </div>
                <div className="px-4 py-4 text-center" style={{ backgroundColor: '#F8F5F0', borderBottom: '1px solid #E8E2DA' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>Sage</p>
                  <p className="text-sm font-bold" style={{ color: '#1C1208' }}>£144–£336+ / year</p>
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
                      <Cell value={r.sage} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: '#9A8F83' }}>
              Sage Accounting pricing reflects the standard and start plans as of mid-2026. We are not affiliated with Sage. Sage is a registered trademark of The Sage Group plc.
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
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>No subscription — pay only when you file. Typical saving vs Sage: £100–£200+/year for a sole trader.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>AI bank reconciliation chat powered by Claude — categorise transactions in plain English instead of navigating a complex interface.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>Built from scratch for MTD ITSA — not a legacy desktop product moved to the cloud.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>Simple, focused interface for freelancers who just want to stay HMRC-compliant.</span></li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl" style={{ backgroundColor: '#F5E4D8', border: '1px solid #C4622D30' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#C4622D' }}>Where Sage wins</p>
                <ul className="space-y-2 text-sm" style={{ color: '#1C1208' }}>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Full double-entry bookkeeping and accounting ledger with multi-currency support.</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Built-in invoicing, quotes, and client management.</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Sage Payroll integration for businesses with employees.</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Stock and inventory management for product-based businesses.</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Decades-old product with a large UK accountant ecosystem.</span></li>
                </ul>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed" style={{ color: '#4A4035', maxWidth: '680px' }}>
              If you have employees, manage stock, or need a full accounting ledger in the same product — Sage may justify its subscription. But if you are a <strong>freelancer, contractor, or landlord who mainly needs to stay HMRC-compliant at low cost</strong>, EasyTax is the better fit.
            </p>
          </div>
        </section>

        {/* ── How to switch ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              How to switch from Sage Accounting
            </h2>
            <ol className="space-y-5">
              {[
                {
                  title: 'Export your Sage data',
                  body: 'In Sage Accounting: go to Reports → Export to download your transactions and reports as CSV for your records. Keep copies of all filed VAT returns and Self Assessment submissions.',
                },
                {
                  title: 'Create your EasyTax account',
                  body: 'Sign up with Google or email in under 60 seconds — no card required.',
                },
                {
                  title: 'Connect your bank (Open Banking)',
                  body: 'From the dashboard, go to Bank → Connect a bank. Pick your UK bank, authorise via Open Banking, and your transactions auto-import and get AI-categorised against HMRC allowable expenses.',
                },
                {
                  title: 'Connect to HMRC',
                  body: 'Authorise EasyTax with your HMRC Government Gateway credentials. We use the official OAuth flow — we never store your HMRC password.',
                },
                {
                  title: 'File your next quarterly update or Self Assessment',
                  body: 'EasyTax submits directly to HMRC via the official MTD ITSA and Self Assessment APIs. You get a confirmation receipt for every submission.',
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
        <section className="pb-16" style={{ backgroundColor: '#FDFCF8' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              FAQ
            </h2>
            <div style={{ borderTop: '1px solid #DDD5C8' }}>
              {[
                {
                  q: 'How much does EasyTax cost compared to Sage?',
                  a: 'EasyTax charges £20 + VAT (£24 inc. VAT) per HMRC submission — no monthly subscription. A typical sole trader filing 4 quarterly MTD updates and 1 Self Assessment pays around £120/year. Sage Accounting Start costs £12/mo (£144/year) for basic features; the standard plan is £28/mo (£336/year). EasyTax saves most sole traders £24–£216/year.',
                },
                {
                  q: 'I use Sage for invoicing. What do I do?',
                  a: "EasyTax doesn't include built-in invoicing. We pair with GrumpyWhales — a free UK invoicing tool — for that. Many sole traders run two lightweight tools rather than one expensive all-in-one suite.",
                },
                {
                  q: 'Does EasyTax support VAT returns like Sage does?',
                  a: 'Yes — EasyTax files MTD VAT returns directly to HMRC via the official Making Tax Digital API. It also handles CT600 Corporation Tax and Self Assessment (SA100 with SA103 and SA105 supplementary pages).',
                },
                {
                  q: 'I have employees — can I use EasyTax instead of Sage?',
                  a: 'EasyTax does not include payroll. If you need payroll, Sage Payroll or a dedicated payroll service is the right fit. EasyTax is best for self-employed individuals and owner-managed limited companies without payroll requirements.',
                },
                {
                  q: 'What about MTD ITSA — when does it apply to me?',
                  a: 'From 6 April 2026 if your total self-employment + property income exceeds £50,000. From 6 April 2027 if it exceeds £30,000. EasyTax is HMRC-recognised for MTD ITSA quarterly updates and the final declaration.',
                },
                {
                  q: 'Which UK banks does Open Banking auto-import support?',
                  a: 'Every major UK retail and business bank: Barclays, Lloyds, HSBC, NatWest, Santander, Nationwide, Monzo, Starling, Revolut, Tide, Mettle and most others. Read-only access only — EasyTax can never move money.',
                },
                {
                  q: 'Do I lose my Sage history when I cancel?',
                  a: 'Export all your reports and transaction CSVs from Sage before cancelling. EasyTax keeps your filing history permanently. HMRC records your submissions independently of your software.',
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
              Stop paying £336/year just to stay HMRC-compliant.<br />
              <em style={{ color: '#C4622D', fontStyle: 'italic' }}>EasyTax does it for £24 a filing.</em>
            </h2>
            <p style={{ color: '#9A8F83', fontSize: '1rem', marginBottom: '2rem' }}>
              No card required. Set up in under 5 minutes.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                Get started →
              </Link>
              <a href="mailto:hello@easytax.vip?subject=Sage%20migration" className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: '#FDFCF8', color: '#1C1208' }}>
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

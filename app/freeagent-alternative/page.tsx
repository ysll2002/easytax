import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { Check, X, Sparkles, ArrowRight } from 'lucide-react';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'FreeAgent Alternative — MTD ITSA Software for UK Sole Traders, £24 per Filing',
  description: 'Looking for a FreeAgent alternative? EasyTax files MTD ITSA quarterly updates, Self Assessment, VAT and CT600 directly to HMRC for £20 + VAT (£24 inc. VAT) per submission — no monthly subscription, no card to sign up.',
  alternates: { canonical: 'https://easytax.vip/freeagent-alternative' },
  openGraph: {
    title: 'FreeAgent Alternative — MTD ITSA + Self Assessment + VAT',
    description: 'FreeAgent charges £228+/year on subscription. EasyTax files MTD ITSA, Self Assessment, VAT and CT600 to HMRC for £24 per submission — no subscription.',
    url: 'https://easytax.vip/freeagent-alternative',
    type: 'article',
    locale: 'en_GB',
    siteName: 'EasyTax',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FreeAgent Alternative — MTD ITSA Software, £24 per Filing',
    description: 'FreeAgent charges £228+/year. EasyTax charges £24 per submission, no subscription.',
  },
};

const display = 'var(--font-display), Playfair Display, Georgia, serif';

type Row = { feature: string; easytax: string | boolean; freeagent: string | boolean; note?: string };

const rows: Row[] = [
  { feature: 'Pricing model',                         easytax: '£24 per filing', freeagent: 'From £228+VAT/yr',   note: 'FreeAgent is a monthly subscription; EasyTax charges £20+VAT per HMRC submission' },
  { feature: 'Typical annual cost',                   easytax: '~£120',       freeagent: '£228+',              note: 'Based on 4 quarterly updates + 1 final declaration' },
  { feature: 'No card to sign up',                    easytax: true,        freeagent: false },
  { feature: 'MTD ITSA quarterly updates',            easytax: true,        freeagent: true },
  { feature: 'Self Assessment (SA100, SA103, SA105)', easytax: true,        freeagent: true },
  { feature: 'MTD VAT submission',                    easytax: true,        freeagent: true },
  { feature: 'CT600 Corporation Tax filing',          easytax: true,        freeagent: true },
  { feature: 'Limited company P&L and Balance Sheet', easytax: true,        freeagent: true },
  { feature: 'Open Banking auto-import',              easytax: true,        freeagent: true },
  { feature: 'AI expense categorisation',             easytax: true,        freeagent: false,                 note: 'EasyTax uses Claude to categorise and reconcile' },
  { feature: 'AI bank reconciliation chat',           easytax: true,        freeagent: false },
  { feature: 'Full double-entry bookkeeping',         easytax: false,       freeagent: true,                  note: 'EasyTax focuses on tax filing, not a full ledger' },
  { feature: 'Built-in invoicing',                    easytax: false,       freeagent: true,                  note: 'EasyTax pairs with GrumpyWhales (free) for invoicing' },
  { feature: 'Payroll',                               easytax: false,       freeagent: true,                  note: 'Included in FreeAgent standard plan' },
  { feature: 'Project time tracking',                 easytax: false,       freeagent: true },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true)  return <Check size={18} color="#6B8E6E" strokeWidth={2.5} className="mx-auto" />;
  if (value === false) return <X     size={18} color="#C46262" strokeWidth={2.5} className="mx-auto" />;
  return <span className="text-sm" style={{ color: '#1C1208' }}>{value}</span>;
}

export default async function FreeAgentAlternative() {
  const session = await auth();
  const ctaHref = session ? '/dashboard' : '/register';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'FreeAgent Alternative — MTD ITSA Software for UK Sole Traders',
    description: 'Side-by-side comparison of EasyTax and FreeAgent for UK sole traders, landlords and limited companies. EasyTax files MTD ITSA, Self Assessment, VAT and CT600 for £24 per submission with no subscription.',
    author: { '@type': 'Organization', name: 'EasyTax' },
    publisher: { '@type': 'Organization', name: 'Finance Panda Limited' },
    mainEntityOfPage: 'https://easytax.vip/freeagent-alternative',
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
              <Sparkles size={12} /> The no-subscription FreeAgent alternative
            </div>
            <h1 style={{ fontFamily: display, fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              Paying <em style={{ color: '#C4622D', fontStyle: 'italic' }}>£228/year</em> for FreeAgent? EasyTax files the same returns for £24 each.
            </h1>
            <p className="text-base sm:text-xl leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              FreeAgent is a fine product — but if you are a UK sole trader or landlord who mainly needs to file <strong style={{ color: '#1C1208' }}>MTD ITSA quarterly updates</strong> and <strong style={{ color: '#1C1208' }}>Self Assessment</strong>, you are paying for a lot of features you will never use. EasyTax covers all the same HMRC filings for <strong style={{ color: '#6B8E6E' }}>£20 + VAT (£24 inc. VAT) per submission</strong> — no monthly subscription, so you only pay when you actually file.
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#6B8E6E', color: '#FDFCF8' }}>£24 per filing</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>Built on HMRC&apos;s MTD API</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>MTD ITSA ready</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>Sole traders + limited companies</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                Get started →
              </Link>
              <a href="mailto:hello@easytax.vip?subject=FreeAgent%20migration" className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', border: '1.5px solid #DDD5C8' }}>
                Ask us a question
              </a>
            </div>
          </div>
        </section>

        {/* ── MTD context ── */}
        <section className="py-12 sm:py-14" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700, marginBottom: '1.25rem' }}>
              MTD ITSA is now mandatory — do you really need to pay £228/year for it?
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              From <strong>6 April 2026</strong>, every UK sole trader or landlord with income above <strong>£50,000</strong> must file quarterly updates through MTD-compatible software. The threshold drops to <strong>£30,000</strong> in April 2027. If your main reason for using FreeAgent is to stay HMRC-compliant, EasyTax gives you the same compliance at a fraction of the cost.
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
              Side-by-side: <em style={{ color: '#C4622D', fontStyle: 'italic' }}>FreeAgent</em> vs EasyTax
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
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>FreeAgent</p>
                  <p className="text-sm font-bold" style={{ color: '#1C1208' }}>£228+ / year</p>
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
                      <Cell value={r.freeagent} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: '#9A8F83' }}>
              FreeAgent pricing reflects the standard plan as of mid-2026. We are not affiliated with FreeAgent. FreeAgent is a registered trademark of FreeAgent Central Ltd.
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
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>Free — no monthly subscription, no card required to start.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>AI bank reconciliation chat powered by Claude — describe a transaction in plain English and it gets categorised correctly.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>Built from the ground up for MTD ITSA — not a legacy product retrofitted for MTD.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>Simple interface for sole traders who just need to file — no feature overload.</span></li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl" style={{ backgroundColor: '#F5E4D8', border: '1px solid #C4622D30' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#C4622D' }}>Where FreeAgent wins</p>
                <ul className="space-y-2 text-sm" style={{ color: '#1C1208' }}>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Full double-entry bookkeeping and ledger (EasyTax does P&L and Balance Sheet for Ltd companies, not a full ledger).</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Native invoicing with client management and payment links.</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Built-in payroll and CIS.</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Project time tracking for client billing.</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>More mature product with a larger ecosystem.</span></li>
                </ul>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed" style={{ color: '#4A4035', maxWidth: '680px' }}>
              If you run a small agency, have employees to pay, or need invoicing in the same tool — FreeAgent may be worth the subscription. But if you are a <strong>freelancer or landlord who mainly wants to stay HMRC-compliant at zero cost</strong>, EasyTax is the better fit.
            </p>
          </div>
        </section>

        {/* ── How to switch ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              How to switch from FreeAgent
            </h2>
            <ol className="space-y-5">
              {[
                {
                  title: 'Export your FreeAgent data',
                  body: 'In FreeAgent: Account Settings → Export. Download your transactions, bills, invoices and journal entries as CSV or PDF for your records.',
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
                  body: 'EasyTax submits directly to HMRC via the official MTD ITSA and Self Assessment APIs. You get a confirmation receipt.',
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
                  q: 'How much does EasyTax cost?',
                  a: 'EasyTax charges £20 + VAT (£24 inc. VAT) per HMRC submission — no monthly subscription. You only pay when you actually file. Users who sign up during the current early-access period lock in this founder price for life. There is no charge to connect your bank or HMRC accounts.',
                },
                {
                  q: 'I use FreeAgent for invoicing. What do I do?',
                  a: "EasyTax doesn't have a built-in invoicing module. We pair with GrumpyWhales — a free UK invoicing tool — for that. If invoicing inside the same product is important to you, EasyTax may not fully replace FreeAgent. But many sole traders run two lightweight free tools rather than one £228/year bundle.",
                },
                {
                  q: 'Do I lose access to my FreeAgent history when I cancel?',
                  a: 'FreeAgent gives you a 6-month read-only period after cancellation. Export your CSVs and PDFs before that window closes. EasyTax keeps your filing history permanently.',
                },
                {
                  q: 'I get FreeAgent free through my NatWest/RBS account. Why would I switch?',
                  a: "That's a genuinely good deal — if you're already getting FreeAgent free, stick with it. EasyTax is the right fit if you're paying the standard subscription or if your bank has changed its bundling terms.",
                },
                {
                  q: 'Can EasyTax handle VAT and CT600 as well as Self Assessment?',
                  a: 'Yes — EasyTax files MTD VAT returns, CT600 Corporation Tax, and Self Assessment (SA100 with SA103 and SA105 supplementary pages) directly to HMRC. It also supports P&L and Balance Sheet for limited companies.',
                },
                {
                  q: 'What about MTD ITSA — when does it apply to me?',
                  a: 'From 6 April 2026 if your total self-employment + property income exceeds £50,000. From 6 April 2027 if it exceeds £30,000. EasyTax files MTD ITSA quarterly updates and the final declaration (crystallisation) through the official HMRC MTD API. HMRC production approval is pending — see our trust page for live status.',
                },
                {
                  q: 'Which UK banks does Open Banking auto-import support?',
                  a: 'Every major UK retail and business bank: Barclays, Lloyds, HSBC, NatWest, Santander, Nationwide, Monzo, Starling, Revolut, Tide, Mettle and most others. Read-only access only — EasyTax can never move money.',
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
              Stop paying £228/year just to stay HMRC-compliant.<br />
              <em style={{ color: '#C4622D', fontStyle: 'italic' }}>EasyTax does it for £24 a filing.</em>
            </h2>
            <p style={{ color: '#9A8F83', fontSize: '1rem', marginBottom: '2rem' }}>
              No card required. Set up in under 5 minutes.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                Get started →
              </Link>
              <a href="mailto:hello@easytax.vip?subject=FreeAgent%20migration" className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: '#FDFCF8', color: '#1C1208' }}>
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

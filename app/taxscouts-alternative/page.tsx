import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { Check, X, Sparkles, ArrowRight } from 'lucide-react';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'TaxScouts Alternative — MTD ITSA Software for UK Sole Traders, £24 per Filing',
  description: 'Looking for a TaxScouts alternative? EasyTax files MTD ITSA quarterly updates, Self Assessment, VAT and CT600 directly to HMRC for £20 + VAT (£24 inc. VAT) per submission — software you control, no waiting for an accountant.',
  alternates: { canonical: 'https://easytax.vip/taxscouts-alternative' },
  openGraph: {
    title: 'TaxScouts Alternative — MTD ITSA + Self Assessment, £24 per Filing',
    description: 'TaxScouts charges £119–169+ per year and assigns you an accountant. EasyTax lets you file MTD ITSA quarterly updates and Self Assessment yourself for £24 per submission.',
    url: 'https://easytax.vip/taxscouts-alternative',
    type: 'article',
    locale: 'en_GB',
    siteName: 'EasyTax',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaxScouts Alternative — MTD ITSA Software, £24 per Filing',
    description: 'TaxScouts uses an accountant. EasyTax is software — file MTD ITSA and Self Assessment yourself for £24.',
  },
};

const display = 'var(--font-display), Playfair Display, Georgia, serif';

type Row = { feature: string; easytax: string | boolean; taxscouts: string | boolean; note?: string };

const rows: Row[] = [
  { feature: 'Pricing model',                         easytax: '£24 per filing',  taxscouts: 'From £119/year',      note: 'EasyTax charges £20+VAT per HMRC submission; TaxScouts charges a fixed annual fee per return' },
  { feature: 'Typical annual cost',                   easytax: '~£120',            taxscouts: '£119–169+',           note: 'EasyTax: 4 quarterly MTD updates + 1 final declaration; TaxScouts: one Self Assessment filing per year' },
  { feature: 'No card to sign up',                    easytax: true,               taxscouts: false },
  { feature: 'MTD ITSA quarterly updates',            easytax: true,               taxscouts: false,                 note: 'TaxScouts focuses on annual Self Assessment; EasyTax is built for the new mandatory quarterly MTD cycle' },
  { feature: 'Self Assessment (SA100, SA103, SA105)', easytax: true,               taxscouts: true },
  { feature: 'MTD VAT submission',                    easytax: true,               taxscouts: false },
  { feature: 'CT600 Corporation Tax filing',          easytax: true,               taxscouts: false },
  { feature: 'Limited company P&L and Balance Sheet', easytax: true,               taxscouts: false },
  { feature: 'Open Banking auto-import',              easytax: true,               taxscouts: false,                 note: 'EasyTax connects directly to your UK bank account and auto-imports transactions' },
  { feature: 'AI expense categorisation',             easytax: true,               taxscouts: false,                 note: 'EasyTax uses Claude AI to categorise and reconcile transactions against HMRC allowable expenses' },
  { feature: 'AI bank reconciliation chat',           easytax: true,               taxscouts: false },
  { feature: 'File in your own time, instantly',      easytax: true,               taxscouts: false,                 note: 'TaxScouts assigns you an accountant — filing depends on their availability' },
  { feature: 'Human accountant reviews your return',  easytax: false,              taxscouts: true,                  note: 'EasyTax is self-serve software; TaxScouts provides a qualified accountant' },
  { feature: 'Tax advice and planning',               easytax: false,              taxscouts: true,                  note: 'TaxScouts accountants can advise on allowances; EasyTax does not give tax advice' },
  { feature: 'Complex employment + self-employment',  easytax: 'Basic',            taxscouts: true,                  note: 'TaxScouts handles more complex mixed-income returns with human review' },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true)  return <Check size={18} color="#6B8E6E" strokeWidth={2.5} className="mx-auto" />;
  if (value === false) return <X     size={18} color="#C46262" strokeWidth={2.5} className="mx-auto" />;
  return <span className="text-sm" style={{ color: '#1C1208' }}>{value}</span>;
}

export default async function TaxScoutsAlternative() {
  const session = await auth();
  const ctaHref = session ? '/dashboard' : '/register';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'TaxScouts Alternative — MTD ITSA Software for UK Sole Traders',
    description: 'Side-by-side comparison of EasyTax and TaxScouts for UK sole traders and landlords. EasyTax files MTD ITSA quarterly updates, Self Assessment, VAT and CT600 for £24 per submission — no waiting for an accountant.',
    author: { '@type': 'Organization', name: 'EasyTax' },
    publisher: { '@type': 'Organization', name: 'Finance Panda Limited' },
    mainEntityOfPage: 'https://easytax.vip/taxscouts-alternative',
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
              <Sparkles size={12} /> File MTD ITSA yourself — no accountant queue
            </div>
            <h1 style={{ fontFamily: display, fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              Paying <em style={{ color: '#C4622D', fontStyle: 'italic' }}>£119+ for TaxScouts</em>? EasyTax files the same returns for £24 each — instantly.
            </h1>
            <p className="text-base sm:text-xl leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              TaxScouts is a great service — but from <strong style={{ color: '#1C1208' }}>6 April 2026</strong>, UK sole traders must file <strong style={{ color: '#1C1208' }}>quarterly MTD ITSA updates</strong>, not just one annual return. TaxScouts currently focuses on Self Assessment; EasyTax is built for the new quarterly cycle. File directly to HMRC for <strong style={{ color: '#6B8E6E' }}>£20 + VAT (£24 inc. VAT) per submission</strong> — no subscription, no waiting for an accountant.
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#6B8E6E', color: '#FDFCF8' }}>£24 per filing</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>HMRC-recognised</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>MTD ITSA ready</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>File on your own schedule</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                Get started →
              </Link>
              <a href="mailto:hello@easytax.vip?subject=TaxScouts%20migration" className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', border: '1.5px solid #DDD5C8' }}>
                Ask us a question
              </a>
            </div>
          </div>
        </section>

        {/* ── MTD context ── */}
        <section className="py-12 sm:py-14" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700, marginBottom: '1.25rem' }}>
              Annual Self Assessment is changing — quarterly MTD filings are now mandatory
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              From <strong>6 April 2026</strong>, UK sole traders and landlords earning over <strong>£50,000</strong> must submit four quarterly updates to HMRC each year, plus a final declaration — replacing the single annual Self Assessment. The threshold drops to <strong>£30,000</strong> in April 2027. TaxScouts currently handles the annual return; EasyTax is built for this new quarterly cycle from day one.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'April 2026', title: 'MTD ITSA: £50k+', body: 'Four quarterly updates + a final declaration replace the annual Self Assessment for sole traders and landlords earning over £50,000.' },
                { label: 'April 2027', title: 'MTD ITSA: £30k+', body: 'Threshold drops to £30,000. Around 1.4 million more taxpayers join the new quarterly reporting cycle.' },
                { label: 'Already mandatory', title: 'MTD VAT: £90k+', body: 'If you are VAT-registered above the £90,000 threshold, MTD VAT digital filing is already required.' },
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
              Side-by-side: <em style={{ color: '#C4622D', fontStyle: 'italic' }}>TaxScouts</em> vs EasyTax
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
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>TaxScouts</p>
                  <p className="text-sm font-bold" style={{ color: '#1C1208' }}>£119+ / year</p>
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
                      <Cell value={r.taxscouts} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: '#9A8F83' }}>
              TaxScouts pricing reflects public plans as of mid-2026. We are not affiliated with TaxScouts. TaxScouts is a trademark of TaxScouts Ltd.
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
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>Built for MTD ITSA quarterly updates — the mandatory new filing cycle from April 2026.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>File on your own schedule, any time — no waiting for an accountant to become available.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>Open Banking auto-import: connect your UK bank and transactions flow in automatically, categorised by AI.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>Covers VAT returns and CT600 Corporation Tax — not just Self Assessment.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>No card required to sign up. Try before you pay.</span></li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl" style={{ backgroundColor: '#F5E4D8', border: '1px solid #C4622D30' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#C4622D' }}>Where TaxScouts wins</p>
                <ul className="space-y-2 text-sm" style={{ color: '#1C1208' }}>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>A qualified accountant reviews your return before it is submitted — peace of mind for complex situations.</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Active tax advice and planning — an accountant can flag allowances you may have missed.</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Better suited to complex mixed-income returns (employment + self-employment + property + dividends).</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Human support if HMRC queries your return.</span></li>
                </ul>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed" style={{ color: '#4A4035', maxWidth: '680px' }}>
              If your tax situation is complex — multiple income streams, significant capital gains, or you simply want an expert to check your numbers — TaxScouts or a traditional accountant may be the right call. But if you are a <strong>straightforward sole trader or landlord who wants to stay HMRC-compliant at the lowest possible cost and on your own schedule</strong>, EasyTax is built for you.
            </p>
          </div>
        </section>

        {/* ── How to switch ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              How to switch from TaxScouts
            </h2>
            <ol className="space-y-5">
              {[
                {
                  title: 'Download your previous returns from TaxScouts',
                  body: 'Log in to TaxScouts and download PDFs of your previous Self Assessment submissions for your records. HMRC also holds copies in your Government Gateway account.',
                },
                {
                  title: 'Create your EasyTax account',
                  body: 'Sign up with Google or email in under 60 seconds — no card required.',
                },
                {
                  title: 'Connect your bank (Open Banking)',
                  body: 'From the dashboard, go to Bank → Connect a bank. Pick your UK bank, authorise via Open Banking, and your transactions auto-import. EasyTax uses Claude AI to categorise them against HMRC allowable expenses — no manual spreadsheets.',
                },
                {
                  title: 'Connect to HMRC',
                  body: 'Authorise EasyTax with your HMRC Government Gateway credentials. We use the official OAuth flow — we never store your HMRC password.',
                },
                {
                  title: 'File your first quarterly MTD update or Self Assessment',
                  body: 'EasyTax submits directly to HMRC via the official MTD ITSA and Self Assessment APIs. You get a confirmation receipt instantly — no waiting for an accountant to review and submit.',
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
                  a: 'EasyTax charges £20 + VAT (£24 inc. VAT) per HMRC submission — no monthly subscription, no annual fee. You only pay when you actually file. Users who sign up during the current early-access period lock in this founder price for life.',
                },
                {
                  q: 'Does EasyTax replace a human accountant?',
                  a: "No — EasyTax is self-serve software, not an accountancy service. If your tax situation is straightforward (sole trader or landlord income, standard allowances), EasyTax handles it. If you have complex mixed income, significant capital gains, or want human oversight, you may prefer TaxScouts or a traditional accountant. Both can co-exist: some EasyTax users keep an accountant for advice but file directly.",
                },
                {
                  q: "Can EasyTax handle MTD ITSA quarterly updates as well as annual Self Assessment?",
                  a: 'Yes — MTD ITSA quarterly updates are at the core of what EasyTax is built for. You submit four quarterly updates to HMRC each tax year, then a final declaration. EasyTax manages the full cycle. TaxScouts currently focuses on the annual Self Assessment return.',
                },
                {
                  q: 'What if HMRC has a question about my filing?',
                  a: "EasyTax gives you a submission receipt and a full audit trail of what was sent to HMRC. If HMRC contacts you, EasyTax's support team can help you understand the query. We do not provide tax advice, but we can help with the technical filing side.",
                },
                {
                  q: 'Can EasyTax handle VAT and Corporation Tax as well as Self Assessment?',
                  a: 'Yes — EasyTax files MTD VAT returns, CT600 Corporation Tax, and Self Assessment (SA100 with SA103 and SA105 supplementary pages) directly to HMRC. It also supports P&L and Balance Sheet for limited companies.',
                },
                {
                  q: 'What about MTD ITSA — when does it apply to me?',
                  a: 'From 6 April 2026 if your total self-employment + property income exceeds £50,000. From 6 April 2027 if it exceeds £30,000. EasyTax is HMRC-recognised for MTD ITSA quarterly updates and the final declaration.',
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
              MTD ITSA is quarterly now — file yourself, instantly.<br />
              <em style={{ color: '#C4622D', fontStyle: 'italic' }}>EasyTax does it for £24 a filing.</em>
            </h2>
            <p style={{ color: '#9A8F83', fontSize: '1rem', marginBottom: '2rem' }}>
              No card required. Set up in under 5 minutes.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                Get started →
              </Link>
              <a href="mailto:hello@easytax.vip?subject=TaxScouts%20migration" className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: '#FDFCF8', color: '#1C1208' }}>
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

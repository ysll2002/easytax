import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { Check, X, Sparkles, ArrowRight } from 'lucide-react';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'Xero Alternative UK — MTD ITSA Software for UK Sole Traders',
  description: 'Looking for a Xero alternative in the UK? EasyTax files MTD ITSA quarterly updates, Self Assessment, VAT and CT600 directly to HMRC. £24 per filing — no monthly subscription.',
  alternates: { canonical: 'https://easytax.vip/xero-alternative' },
  openGraph: {
    title: 'Xero Alternative UK — MTD ITSA + Self Assessment + VAT',
    description: 'Xero charges £16–£47/month. EasyTax files MTD ITSA, Self Assessment, VAT and CT600 to HMRC for £24 per submission — no subscription.',
    url: 'https://easytax.vip/xero-alternative',
    type: 'article',
    locale: 'en_GB',
    siteName: 'EasyTax',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Xero Alternative UK — MTD ITSA Software',
    description: 'Switch from Xero to EasyTax — file to HMRC for £24/submission, no monthly fee.',
  },
};

const display = 'var(--font-display), Playfair Display, Georgia, serif';

type Row = { feature: string; easytax: string | boolean; xero: string | boolean; note?: string };

const rows: Row[] = [
  { feature: 'Price',                                 easytax: '£24/submission',   xero: 'From £16/mo+VAT',      note: 'Xero Starter billed monthly; Standard £33/mo, Premium £47/mo' },
  { feature: 'No monthly subscription',               easytax: true,               xero: false,                  note: 'EasyTax is pay-per-submission, not a recurring fee' },
  { feature: 'No card required to sign up',           easytax: true,               xero: false },
  { feature: 'MTD ITSA quarterly updates',            easytax: true,               xero: true },
  { feature: 'Self Assessment (SA100, SA103, SA105)', easytax: true,               xero: true },
  { feature: 'MTD VAT submission',                    easytax: true,               xero: true },
  { feature: 'CT600 Corporation Tax filing',          easytax: true,               xero: true },
  { feature: 'Limited company P&L and Balance Sheet', easytax: true,               xero: true },
  { feature: 'Open Banking auto-import',              easytax: true,               xero: true },
  { feature: 'AI expense categorisation',             easytax: true,               xero: false,                  note: 'EasyTax uses Claude to categorise and reconcile' },
  { feature: 'AI bank reconciliation chat',           easytax: true,               xero: false },
  { feature: 'Full double-entry bookkeeping',         easytax: false,              xero: true,                   note: 'EasyTax focuses on tax filing, not a full ledger' },
  { feature: 'Built-in invoicing',                    easytax: false,              xero: true,                   note: 'EasyTax pairs with GrumpyWhales (free) for invoicing' },
  { feature: 'Payroll (Xero Payroll)',                easytax: false,              xero: true,                   note: 'Add-on in Xero; not in EasyTax' },
  { feature: 'Multi-currency',                        easytax: false,              xero: true,                   note: 'Xero Premium only' },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true)  return <Check size={18} color="#6B8E6E" strokeWidth={2.5} className="mx-auto" />;
  if (value === false) return <X     size={18} color="#C46262" strokeWidth={2.5} className="mx-auto" />;
  return <span className="text-sm" style={{ color: '#1C1208' }}>{value}</span>;
}

export default async function XeroAlternative() {
  const session = await auth();
  const ctaHref = session ? '/dashboard' : '/register';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Xero Alternative UK — MTD ITSA Software for UK Sole Traders',
    description: 'Side-by-side comparison of EasyTax and Xero for UK sole traders, landlords and limited companies.',
    author: { '@type': 'Organization', name: 'EasyTax' },
    publisher: { '@type': 'Organization', name: 'Finance Panda Limited' },
    mainEntityOfPage: 'https://easytax.vip/xero-alternative',
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
              <Sparkles size={12} /> The pay-per-filing Xero alternative
            </div>
            <h1 style={{ fontFamily: display, fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              Paying <em style={{ color: '#C4622D', fontStyle: 'italic' }}>£16–£47/month</em> for Xero? Switch to £24 per HMRC filing.
            </h1>
            <p className="text-base sm:text-xl leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              Xero is a strong product — but for a UK sole trader who needs <strong style={{ color: '#1C1208' }}>MTD ITSA quarterly updates</strong> and <strong style={{ color: '#1C1208' }}>Self Assessment</strong>, you&apos;re paying £192–£564/year for functionality you may never use. EasyTax charges <strong style={{ color: '#C4622D' }}>£24 per HMRC submission</strong> — nothing more.
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>£24 per filing</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>No monthly subscription</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>Built on the HMRC MTD API</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>Sole traders + limited companies</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                Get started — no subscription →
              </Link>
              <a href="mailto:hello@easytax.vip?subject=Xero%20migration" className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', border: '1.5px solid #DDD5C8' }}>
                Ask us a question
              </a>
            </div>
          </div>
        </section>

        {/* ── Price comparison ── */}
        <section className="py-12 sm:py-14" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700, marginBottom: '1.25rem' }}>
              What does Xero actually cost a sole trader?
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              Xero Starter costs £16/month + VAT but limits you to 20 bank transactions per month — most sole traders quickly move to Standard at £33/month + VAT. That&apos;s <strong>£475/year inc. VAT</strong>. EasyTax charges £24 per HMRC submission. Four MTD quarterly updates plus one Self Assessment = <strong>5 submissions × £24 = £120/year total</strong>.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDD5C8' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#C4622D' }}>Xero Standard (est.)</p>
                <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>£475 / year</p>
                <p className="text-sm" style={{ color: '#4A4035' }}>Monthly subscription. Starter tier limits you to 20 bank transactions/month — most sole traders need Standard or above.</p>
              </div>
              <div className="p-5 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDD5C8' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B8E6E' }}>EasyTax</p>
                <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>£24 per submission</p>
                <p className="text-sm" style={{ color: '#4A4035' }}>You only pay when you file with HMRC. Free to connect your bank and HMRC accounts, free to use the dashboard.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Comparison table ── */}
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              Side-by-side: <em style={{ color: '#C4622D', fontStyle: 'italic' }}>Xero</em> vs EasyTax
            </h2>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E8E2DA', backgroundColor: '#FFFFFF' }}>
              <div className="grid grid-cols-[1.6fr_1fr_1fr]">
                <div className="px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9A8F83', backgroundColor: '#F8F5F0', borderBottom: '1px solid #E8E2DA' }}>Feature</div>
                <div className="px-4 py-4 text-center" style={{ backgroundColor: '#1C1208', borderBottom: '1px solid #E8E2DA' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>EasyTax</p>
                  <p className="text-sm font-bold" style={{ color: '#FDFCF8' }}>£24 / filing</p>
                </div>
                <div className="px-4 py-4 text-center" style={{ backgroundColor: '#F8F5F0', borderBottom: '1px solid #E8E2DA' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>Xero</p>
                  <p className="text-sm font-bold" style={{ color: '#1C1208' }}>£16–£47/mo+VAT</p>
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
                      <Cell value={r.xero} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: '#9A8F83' }}>
              Xero pricing reflects standard UK plans as of mid-2026. We are not affiliated with Xero. Xero is a registered trademark of Xero Limited.
            </p>
          </div>
        </section>

        {/* ── Honest tradeoffs ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#FDFCF8' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, marginBottom: '1.5rem' }}>Honest tradeoffs</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="p-6 rounded-2xl" style={{ backgroundColor: '#E2EDE2', border: '1px solid #6B8E6E30' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B8E6E' }}>Where EasyTax wins</p>
                <ul className="space-y-2 text-sm" style={{ color: '#1C1208' }}>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>Pay only when you file — no monthly commitment.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>AI bank reconciliation chat — type what the transaction was, it gets categorised.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>No bank transaction limits — connect and import as many transactions as you need.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>Simpler interface — built for tax filing, not for accountants.</span></li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl" style={{ backgroundColor: '#F5E4D8', border: '1px solid #C4622D30' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#C4622D' }}>Where Xero wins</p>
                <ul className="space-y-2 text-sm" style={{ color: '#1C1208' }}>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Full double-entry accounting and detailed trial balance.</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Professional invoicing with payment links and automated reminders.</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Xero Payroll add-on for managing employees.</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Multi-currency support on Premium.</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Large accountant ecosystem — most UK accountants know Xero.</span></li>
                </ul>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed" style={{ color: '#4A4035', maxWidth: '680px' }}>
              Xero is worth the subscription if your accountant uses it, if you need multi-currency, or if you have employees to pay. But if you are a <strong>sole trader or landlord who mainly needs to file quarterly and annually with HMRC</strong>, EasyTax does that job for a fraction of the cost.
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
                  q: 'My accountant uses Xero. Can I still use EasyTax?',
                  a: "If your accountant needs Xero access for year-end work, you may want to keep Xero for that relationship. EasyTax is the right fit if you want to handle your own quarterly MTD updates and Self Assessment without paying a monthly subscription — or if you're looking for a simpler tool alongside a Xero-using accountant.",
                },
                {
                  q: 'How do I migrate from Xero?',
                  a: "Export your transaction history from Xero (Accounting → Reports → Account Transactions, export to CSV). Email them to hello@easytax.vip and we'll load them into your account. Connect your bank via Open Banking and EasyTax starts auto-importing from today.",
                },
                {
                  q: "Xero Starter is £16/month — isn't that almost as cheap?",
                  a: "Xero Starter limits you to 20 bank transactions per month. Most sole traders have more than that and quickly move to Standard (£33/month + VAT = £475/year). EasyTax has no transaction limits and charges per submission, not per month.",
                },
                {
                  q: 'When does MTD ITSA become mandatory?',
                  a: 'From 6 April 2026 for sole traders and landlords with income over £50,000. From 6 April 2027 for income over £30,000. EasyTax is built on the HMRC MTD API for MTD ITSA quarterly updates and the final declaration.',
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
              Stop the monthly subscription.<br />
              <em style={{ color: '#C4622D', fontStyle: 'italic' }}>Pay £24 when you file. Not before.</em>
            </h2>
            <p style={{ color: '#9A8F83', fontSize: '1rem', marginBottom: '2rem' }}>No card required to start. Early signups lock in the founder price.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                Get started — no subscription →
              </Link>
              <a href="mailto:hello@easytax.vip?subject=Xero%20migration" className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: '#FDFCF8', color: '#1C1208' }}>
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

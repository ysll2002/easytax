import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { Check, X, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { auth } from '@/auth';

export const revalidate = 86400; // refresh daily so the countdown updates

const BOKIO_END_DATE_ISO = '2026-07-07';
const BOKIO_END_DATE_HUMAN = '7 July 2026';

function daysUntilBokioCloses(): number {
  const now = new Date();
  const end = new Date(BOKIO_END_DATE_ISO + 'T00:00:00Z');
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

export const metadata: Metadata = {
  title: 'Bokio Alternative — Free MTD ITSA Software for UK Sole Traders & Ltd Companies',
  description: 'Bokio UK closes 7 July 2026. Migrate to EasyTax — free MTD ITSA quarterly updates, Self Assessment, VAT and CT600 for UK sole traders, landlords and limited companies. £0/year, no card needed.',
  alternates: { canonical: 'https://easytax.vip/bokio-alternative' },
  openGraph: {
    title: 'Bokio Alternative — Free MTD ITSA + Self Assessment + VAT',
    description: 'Bokio is closing 7 July 2026. EasyTax is the free MTD-ready alternative for UK sole traders, landlords and limited companies.',
    url: 'https://easytax.vip/bokio-alternative',
    type: 'article',
    locale: 'en_GB',
    siteName: 'EasyTax',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bokio Alternative — Free MTD ITSA Software',
    description: 'Bokio closes 7 July 2026. Migrate to EasyTax for free.',
  },
};

const display = 'var(--font-display), Playfair Display, Georgia, serif';

type Row = { feature: string; easytax: string | boolean; bokio: string | boolean; note?: string };

const rows: Row[] = [
  { feature: 'Available in the UK',                  easytax: true,                    bokio: 'Closing 7 July 2026',  note: 'Bokio is winding down UK operations' },
  { feature: 'Price (annual)',                       easytax: '£0',                    bokio: '£299.40 (£24.95/mo)' },
  { feature: 'No card required to sign up',          easytax: true,                    bokio: false },
  { feature: 'MTD ITSA quarterly updates',           easytax: true,                    bokio: false,                  note: 'Bokio never built MTD ITSA' },
  { feature: 'Self Assessment (SA100, SA103, SA105)',easytax: true,                    bokio: false,                  note: 'Bokio did not file SA' },
  { feature: 'MTD VAT submission',                   easytax: true,                    bokio: true },
  { feature: 'CT600 Corporation Tax filing',         easytax: true,                    bokio: false,                  note: 'Bokio supports CT prep but not filing' },
  { feature: 'Limited company P&L and Balance Sheet',easytax: true,                    bokio: true },
  { feature: 'Open Banking auto-import',             easytax: true,                    bokio: true },
  { feature: 'AI expense categorisation',            easytax: true,                    bokio: false,                  note: 'EasyTax uses Claude to categorise and reconcile' },
  { feature: 'AI bank reconciliation chat',          easytax: true,                    bokio: false },
  { feature: 'Full double-entry bookkeeping',        easytax: false,                   bokio: true,                   note: 'EasyTax focuses on tax filing, not full ledger' },
  { feature: 'Invoicing built in',                   easytax: false,                   bokio: true,                   note: 'EasyTax pairs with GrumpyWhales (also free) for invoicing' },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true)  return <Check size={18} color="#6B8E6E" strokeWidth={2.5} className="mx-auto" />;
  if (value === false) return <X     size={18} color="#C46262" strokeWidth={2.5} className="mx-auto" />;
  return <span className="text-sm" style={{ color: '#1C1208' }}>{value}</span>;
}

export default async function BokioAlternative() {
  const session = await auth();
  const ctaHref = session ? '/dashboard' : '/register';
  const daysLeft = daysUntilBokioCloses();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Bokio Alternative — Free MTD ITSA Software for UK Sole Traders & Ltd Companies',
    description: 'Bokio UK is closing on 7 July 2026. Side-by-side comparison of EasyTax and Bokio for UK sole traders, landlords and limited companies.',
    author: { '@type': 'Organization', name: 'EasyTax' },
    publisher: { '@type': 'Organization', name: 'Finance Panda Limited' },
    mainEntityOfPage: 'https://easytax.vip/bokio-alternative',
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SiteHeader />

      {/* ── Urgency banner ── */}
      {daysLeft > 0 && (
        <div style={{ backgroundColor: '#C4622D', color: '#FDFCF8', padding: '0.75rem 1rem', textAlign: 'center' }}>
          <p className="text-sm font-medium" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <AlertCircle size={14} />
            <span>Bokio UK closes <strong>{BOKIO_END_DATE_HUMAN}</strong> — <strong>{daysLeft} {daysLeft === 1 ? 'day' : 'days'} left</strong> to migrate</span>
          </p>
        </div>
      )}

      <main className="flex-grow">

        {/* ── Hero ── */}
        <section className="pt-12 sm:pt-16 pb-10 sm:pb-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-5" style={{ backgroundColor: '#F0EBE1', color: '#C4622D', border: '1px solid #C4622D30' }}>
              <Sparkles size={12} /> The free Bokio alternative
            </div>
            <h1 style={{ fontFamily: display, fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              Bokio is closing on <em style={{ color: '#C4622D', fontStyle: 'italic' }}>{BOKIO_END_DATE_HUMAN}</em>. Move to EasyTax in minutes.
            </h1>
            <p className="text-base sm:text-xl leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              You are paying <strong style={{ color: '#1C1208' }}>£24.95/month</strong> for a tool that is being switched off. EasyTax files MTD ITSA, Self Assessment, VAT and CT600 directly to HMRC for <strong style={{ color: '#6B8E6E' }}>£0/year</strong> — and from April 2026 you legally have to file quarterly anyway.
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#6B8E6E', color: '#FDFCF8' }}>£0 / year</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>HMRC-recognised</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>MTD ITSA ready for April 2026</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>Sole traders + limited companies</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                Start migration — free →
              </Link>
              <a href="mailto:hello@easytax.vip?subject=Bokio%20CSV%20migration" className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', border: '1.5px solid #DDD5C8' }}>
                Email us your Bokio CSV
              </a>
            </div>
          </div>
        </section>

        {/* ── Two-deadline callout ── */}
        <section className="py-12 sm:py-14" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700, marginBottom: '1.25rem' }}>
              Two deadlines, one move.
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              Whichever Bokio alternative you pick, you are not just replacing Bokio. From <strong>April 2026</strong>, HMRC will require every UK sole trader or landlord earning over <strong>£50,000</strong> to file <strong>quarterly</strong> updates through MTD-compatible software. From April 2027, the threshold drops to £30,000. EasyTax is built for that mandate from day one.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDD5C8' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#C4622D' }}>Deadline 1</p>
                <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>{BOKIO_END_DATE_HUMAN}</p>
                <p className="text-sm" style={{ color: '#4A4035' }}>Bokio UK shuts down. Export your data before this date.</p>
              </div>
              <div className="p-5 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDD5C8' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#C4622D' }}>Deadline 2</p>
                <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>6 April 2026</p>
                <p className="text-sm" style={{ color: '#4A4035' }}>MTD ITSA mandatory for self-employment / property income &gt; £50k.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Comparison table ── */}
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              Side-by-side: <em style={{ color: '#C4622D', fontStyle: 'italic' }}>Bokio</em> vs EasyTax
            </h2>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E8E2DA', backgroundColor: '#FFFFFF' }}>
              <div className="grid grid-cols-[1.6fr_1fr_1fr]">
                {/* header */}
                <div className="px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9A8F83', backgroundColor: '#F8F5F0', borderBottom: '1px solid #E8E2DA' }}>
                  Feature
                </div>
                <div className="px-4 py-4 text-center" style={{ backgroundColor: '#1C1208', borderBottom: '1px solid #E8E2DA' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>EasyTax</p>
                  <p className="text-sm font-bold" style={{ color: '#FDFCF8' }}>£0 / year</p>
                </div>
                <div className="px-4 py-4 text-center" style={{ backgroundColor: '#F8F5F0', borderBottom: '1px solid #E8E2DA' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>Bokio</p>
                  <p className="text-sm font-bold" style={{ color: '#1C1208' }}>£299.40 / year</p>
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
                      <Cell value={r.bokio} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: '#9A8F83' }}>
              Bokio pricing reflects the standard plan as of June 2026. Closure date taken from Bokio&apos;s own announcement to UK customers. We are not affiliated with Bokio.
            </p>
          </div>
        </section>

        {/* ── Migration steps ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              How to migrate in under 10 minutes
            </h2>
            <ol className="space-y-5">
              {[
                {
                  title: 'Export your Bokio data',
                  body: 'In Bokio: Settings → Data Export. Download the Clients, Invoices and Transactions CSVs. (Bokio is offering refunds for unused subscription time — worth claiming.)',
                },
                {
                  title: 'Create your EasyTax account',
                  body: 'Sign up with Google or email. 60 seconds, no card required.',
                },
                {
                  title: 'Email us your CSVs (optional concierge)',
                  body: 'Send your Bokio CSVs to hello@easytax.vip with the subject "Bokio CSV migration". We load them into your account by hand within one working day. Your invoice number sequence is preserved.',
                },
                {
                  title: 'Connect your bank',
                  body: 'From the dashboard, go to Bank → Connect a bank. Pick your UK bank, authorise via Open Banking, and every incoming transaction is auto-categorised against UK allowable expenses.',
                },
                {
                  title: 'File your first MTD ITSA quarterly update',
                  body: 'When April 2026 hits, your first quarterly window opens. EasyTax submits directly to HMRC via the official MTD ITSA API.',
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

        {/* ── Where EasyTax wins, where Bokio wins ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#FDFCF8' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              Honest tradeoffs
            </h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="p-6 rounded-2xl" style={{ backgroundColor: '#E2EDE2', border: '1px solid #6B8E6E30' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B8E6E' }}>Where EasyTax is better</p>
                <ul className="space-y-2 text-sm" style={{ color: '#1C1208' }}>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>Free, forever. No card, no trial limit.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>Files Self Assessment, MTD ITSA quarterly updates, and CT600 directly to HMRC.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>AI categorisation and AI reconciliation chat.</span></li>
                  <li className="flex gap-2"><Check size={16} color="#6B8E6E" className="flex-shrink-0 mt-0.5" /><span>Still here on 8 July 2026.</span></li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl" style={{ backgroundColor: '#F5E4D8', border: '1px solid #C4622D30' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#C4622D' }}>Where Bokio was better</p>
                <ul className="space-y-2 text-sm" style={{ color: '#1C1208' }}>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Full double-entry bookkeeping ledger (we do P&L and Balance Sheet for Ltd companies, not a full ledger).</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>Native invoicing inside the same app (we pair with GrumpyWhales for that).</span></li>
                  <li className="flex gap-2"><ArrowRight size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" /><span>A few more integrations on payroll / payments.</span></li>
                </ul>
                <p className="text-xs mt-3" style={{ color: '#9A8F83' }}>
                  None of which matters on 8 July — it&apos;s being switched off.
                </p>
              </div>
            </div>
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
                { q: 'Is Bokio really shutting down in the UK?',
                  a: 'Yes. Bokio has announced it is winding down UK operations on ' + BOKIO_END_DATE_HUMAN + '. Existing customers were notified by email to export their data. Bokio has offered refunds for the unused portion of subscription time — worth claiming before you close the account.' },
                { q: 'How is EasyTax free?',
                  a: 'We charge zero subscription and zero per-filing fees. The business model is built on becoming the default free option ahead of the 2026/2027 MTD ITSA mandates, not on per-user revenue. We may add optional paid add-ons later (e.g. accountant collaboration) but core filing will stay free.' },
                { q: 'Will EasyTax import my Bokio data automatically?',
                  a: 'There is no Bokio API for migration, so we do it the manual-but-fast way: export your Clients / Invoices / Transactions CSVs from Bokio, email them to hello@easytax.vip, and we load them into your EasyTax account by hand within one working day. A self-serve CSV importer is coming later in 2026.' },
                { q: 'I am VAT-registered. Does EasyTax file MTD VAT?',
                  a: 'Yes — EasyTax files MTD VAT returns directly to HMRC. If you are over the £90,000 VAT threshold, this is mandatory.' },
                { q: 'I run a limited company. Does EasyTax do CT600?',
                  a: 'Yes — EasyTax files CT600 Corporation Tax directly to HMRC, and produces a P&L and Balance Sheet from your bank transactions. It is not a full double-entry ledger like Bokio, but it covers the filings HMRC and Companies House actually need.' },
                { q: 'Can I keep my existing invoice number sequence (e.g. INV-2024-0042)?',
                  a: 'Yes. After we import your invoice history, your next invoice continues the existing sequence rather than restarting. Tell us your preference in the migration email.' },
                { q: 'What about MTD ITSA — when do I need it?',
                  a: 'From 6 April 2026 if your self-employment + property income is over £50,000. From 6 April 2027 if it is over £30,000. EasyTax is HMRC-recognised for MTD ITSA quarterly updates and the final declaration.' },
                { q: 'Which UK banks does the auto-import work with?',
                  a: 'Every major UK retail and business bank supported by Open Banking: Barclays, Lloyds, HSBC, NatWest, Santander, Nationwide, Monzo, Starling, Revolut, Tide, Mettle and most others. Read-only access only — EasyTax can never move money.' },
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
              Stop watching the Bokio countdown.<br />
              <em style={{ color: '#C4622D', fontStyle: 'italic' }}>Open a free EasyTax account.</em>
            </h2>
            <p style={{ color: '#9A8F83', fontSize: '1rem', marginBottom: '2rem' }}>
              Move your data when you&apos;re ready. We&apos;ll still be here on 8 July.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href={ctaHref} className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                Get started — free →
              </Link>
              <a href="mailto:hello@easytax.vip?subject=Bokio%20CSV%20migration" className="inline-block px-10 py-4 rounded-full font-medium" style={{ backgroundColor: '#FDFCF8', color: '#1C1208' }}>
                Email us your Bokio CSV
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

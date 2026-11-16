import type { Metadata } from 'next';
import { pageTitle } from '@/lib/seo-meta';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { Check, X, ArrowRight } from 'lucide-react';
import { auth } from '@/auth';
import SiteFooter from '@/components/SiteFooter';

// Landlords and Making Tax Digital — and, honestly, what EasyTax does and does
// not do for them. EasyTax does not file property income yet (no Property
// Business API subscription), so this page says so plainly and points
// landlords to HMRC's list of software that does. HMRC's Terms of Use ask for
// an accurate description of the product; this page used to claim SA105
// property filing, CT600 and the year-end return, none of which EasyTax files.

const GOV_UK_FIND_SOFTWARE = 'https://www.gov.uk/guidance/find-software-thats-compatible-with-making-tax-digital-for-income-tax';

export const metadata: Metadata = {
  title: pageTitle('Landlords and Making Tax Digital — What EasyTax Covers'),
  description: 'Making Tax Digital for Income Tax applies to UK landlords with qualifying income over £50,000. EasyTax does not file property income yet — here is what it does cover, and where landlords can find software that files property income.',
  alternates: { canonical: 'https://easytax.vip/landlord-tax-software' },
  openGraph: {
    title: 'Landlords and Making Tax Digital — What EasyTax Covers',
    description: 'EasyTax does not file property income yet. What it covers, and where UK landlords can find MTD software that does.',
    url: 'https://easytax.vip/landlord-tax-software',
    type: 'article',
    locale: 'en_GB',
    siteName: 'EasyTax',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Landlords and Making Tax Digital — What EasyTax Covers',
    description: 'EasyTax does not file property income yet. What it covers, and where landlords can find software that does.',
  },
};

const display = 'var(--font-display), Playfair Display, Georgia, serif';

const covers: { text: string; yes: boolean }[] = [
  { text: 'MTD ITSA quarterly updates for self-employment income (if you also run a business or freelance)', yes: true },
  { text: 'MTD VAT returns, if you are VAT-registered', yes: true },
  { text: 'Keeping your income and expense records: CSV statement import, AI categorisation', yes: true },
  { text: 'Quarterly updates for UK or foreign property income', yes: false },
  { text: 'The year-end final declaration or the SA100 / SA105 return', yes: false },
  { text: 'CT600 Corporation Tax or company accounts for a buy-to-let limited company', yes: false },
  { text: 'Capital Gains Tax on selling a property', yes: false },
];

export default async function LandlordTaxSoftware() {
  const session = await auth();
  const ctaHref = session ? '/dashboard' : '/register';

  const faqItems = [
    {
      q: 'When does MTD ITSA apply to landlords?',
      a: 'From 6 April 2026, landlords whose qualifying income (gross property income plus any self-employment income) exceeds £50,000 must keep digital records and send quarterly updates to HMRC through compatible software. The threshold drops to £30,000 from 6 April 2027 and £20,000 from 6 April 2028.',
    },
    {
      q: 'Can EasyTax file my property income?',
      a: 'Not yet. EasyTax files MTD ITSA quarterly updates for self-employment income and MTD VAT returns. It does not send quarterly updates for UK or foreign property, and it does not file the SA105 property pages or the year-end return. Use software from HMRC\'s list on GOV.UK that supports property income.',
    },
    {
      q: 'I am a landlord and also self-employed. Can I use EasyTax?',
      a: 'For your self-employment, yes: EasyTax can send those quarterly updates. Your property income still needs software that supports it, and HMRC expects all of your income sources to be covered, so check that the combination of software you choose covers every source.',
    },
    {
      q: 'I hold my property in a limited company. Can I use EasyTax?',
      a: 'Only for VAT, if the company is VAT-registered. EasyTax does not file CT600 Corporation Tax or prepare company accounts.',
    },
    {
      q: 'Will EasyTax support landlords in future?',
      a: 'We would like to. Until EasyTax can file property income, this page will say so. If you want to hear when that changes, email hello@easytax.vip.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Landlords and Making Tax Digital — What EasyTax Covers',
    description: 'EasyTax does not file property income yet. What it covers for UK landlords, and where to find MTD software that files property income.',
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

      <main id="main-content" className="flex-grow">

        {/* ── Hero ── */}
        <section className="pt-12 sm:pt-16 pb-10 sm:pb-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h1 style={{ fontFamily: display, fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              Landlords and Making Tax Digital.<br />
              <em style={{ color: '#A04E1C', fontStyle: 'italic' }}>What EasyTax covers — and what it doesn&apos;t yet.</em>
            </h1>
            <p className="text-base sm:text-xl leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              <strong style={{ color: '#1C1208' }}>EasyTax does not file property income yet.</strong> If you are a landlord, you will need software that supports property income for your quarterly updates and year-end return. HMRC keeps a list of compatible software on GOV.UK.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <a href={GOV_UK_FIND_SOFTWARE} className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#A04E1C', color: '#FDFCF8' }} rel="noopener">
                Find software on GOV.UK →
              </a>
              <a href="mailto:hello@easytax.vip?subject=Landlord%20support" className="inline-block px-6 py-3 rounded-full font-medium text-sm" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', border: '1.5px solid #DDD5C8' }}>
                Tell me when EasyTax supports landlords
              </a>
            </div>
          </div>
        </section>

        {/* ── MTD context ── */}
        <section className="py-12 sm:py-14" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700, marginBottom: '1.25rem' }}>
              MTD ITSA has applied to landlords since April 2026
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '680px' }}>
              Making Tax Digital for Income Tax requires UK landlords and sole traders above the income threshold to keep digital records, send quarterly income and expense updates to HMRC, and make a final declaration after the tax year — all through HMRC-compatible software.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'April 2026', title: 'MTD ITSA: £50k+', body: 'Quarterly updates mandatory for landlords and sole traders with qualifying income over £50,000.' },
                { label: 'April 2027', title: 'MTD ITSA: £30k+', body: 'The threshold drops to £30,000.' },
                { label: 'April 2028', title: 'MTD ITSA: £20k+', body: 'The threshold drops to £20,000.' },
              ].map(item => (
                <div key={item.label} className="p-5 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDD5C8' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#A04E1C' }}>{item.label}</p>
                  <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>{item.title}</p>
                  <p className="text-sm" style={{ color: '#4A4035' }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What EasyTax covers ── */}
        <section className="py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              What EasyTax does for landlords today
            </h2>
            <ul className="space-y-3" style={{ listStyle: 'none', padding: 0 }}>
              {covers.map(c => (
                <li key={c.text} className="flex gap-3 text-sm sm:text-base" style={{ color: '#1C1208' }}>
                  {c.yes
                    ? <Check size={20} color="#4B6A4E" strokeWidth={2.5} className="flex-shrink-0 mt-0.5" aria-hidden />
                    : <X size={20} color="#C46262" strokeWidth={2.5} className="flex-shrink-0 mt-0.5" aria-hidden />}
                  <span><span className="sr-only">{c.yes ? 'Covered: ' : 'Not covered: '}</span>{c.text}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm mt-6" style={{ color: '#4A4035' }}>
              If you also have self-employment income, EasyTax can send those quarterly updates.{' '}
              <Link href={ctaHref} style={{ color: '#A04E1C', fontWeight: 600 }}>Get started <ArrowRight size={14} className="inline" aria-hidden /></Link>
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
              Landlords and MTD — frequently asked questions
            </h2>
            <div style={{ borderTop: '1px solid #DDD5C8' }}>
              {faqItems.map((item) => (
                <details key={item.q} className="group py-4" style={{ borderBottom: '1px solid #DDD5C8' }}>
                  <summary className="flex justify-between items-center cursor-pointer list-none font-semibold text-sm" style={{ color: '#1C1208' }}>
                    {item.q}
                    <span style={{ color: '#A04E1C', fontSize: '1.25rem', lineHeight: 1, flexShrink: 0, marginLeft: '1rem' }}>+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: '#4A4035' }}>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}

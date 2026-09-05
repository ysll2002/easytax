import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import PaymentsOnAccountCalculator from '@/components/PaymentsOnAccountCalculator';
import { RULES_REVIEWED, HMRC_POA_URL, POA_THRESHOLD } from '@/lib/payments-on-account';

export const metadata: Metadata = {
  title: 'Payments on Account Calculator — why your January tax bill is 50% bigger',
  description:
    'Free calculator for Self Assessment payments on account. Enter your tax bill and see what actually leaves your account on 31 January and 31 July, including the two advance payments HMRC adds towards next year.',
  keywords: [
    'payments on account calculator',
    'what are payments on account',
    'self assessment payments on account',
    'why is my tax bill 50% higher',
    '31 July payment on account',
    'balancing payment calculator',
    'reduce payments on account',
    'first self assessment tax bill',
  ],
  alternates: { canonical: 'https://easytax.vip/payments-on-account-calculator' },
  openGraph: {
    type: 'website',
    url: 'https://easytax.vip/payments-on-account-calculator',
    title: 'Payments on Account Calculator',
    description:
      'What actually leaves your account on 31 January and 31 July, not just the tax you owe. Free, no signup.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Payments on Account Calculator',
    description: 'Why your first January tax bill is 150% of the tax you owe.',
  },
};

export default function PaymentsOnAccountPage() {
  const faq = [
    {
      q: 'What are payments on account?',
      a: `They are advance payments towards next year's tax bill, collected in two instalments. HMRC assumes next year will look like this year, so each instalment is half of your current Self Assessment liability. The first is due on 31 January — the same day as the balance of the current year's bill — and the second on 31 July.`,
    },
    {
      q: 'Why is my January tax bill 50% higher than the tax I owe?',
      a: `Because two things fall due on the same date: the balancing payment for the year that has ended, and the first payment on account for the year already running. If you owe £6,000 for the year just gone and made no payments on account towards it, you pay £6,000 plus £3,000 — £9,000 — on 31 January, then a further £3,000 on 31 July.`,
    },
    {
      q: 'Do I have to make payments on account?',
      a: `Not if the tax you owe through Self Assessment is under £${POA_THRESHOLD.toLocaleString('en-GB')}, and not if more than 80% of the tax you owed for the year was already collected at source — through a PAYE tax code, CIS deductions, or tax taken off at source. If either applies, you settle the bill in one payment and nothing is due in July.`,
    },
    {
      q: 'Can I reduce my payments on account?',
      a: 'Yes. If you expect the coming year to be worse than the last one, you can apply to HMRC to reduce both instalments. The risk is that if you reduce them below what you actually end up owing, HMRC charges interest on the shortfall from the date each instalment was originally due — so reduce them on evidence, not optimism.',
    },
    {
      q: 'Are Capital Gains Tax and student loan repayments included?',
      a: 'No. Both are collected through Self Assessment but neither counts towards the payment-on-account calculation, so they fall due in full with the balancing payment on 31 January rather than being spread across the two instalments.',
    },
    {
      q: 'What happens in my second year of Self Assessment?',
      a: 'The two payments on account you made during the year are deducted from that year\'s bill, leaving a smaller balancing payment — or a refund if they overshot. On top of that balancing payment, the first instalment towards the following year falls due on the same 31 January. The cycle repeats, which is why the second January is usually less of a shock than the first.',
    },
  ];

  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  const jsonLdApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Payments on Account Calculator',
    url: 'https://easytax.vip/payments-on-account-calculator',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
    provider: { '@type': 'Organization', name: 'EasyTax', url: 'https://easytax.vip' },
  };

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Free tax tools', item: 'https://easytax.vip/tools' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Payments on account calculator',
        item: 'https://easytax.vip/payments-on-account-calculator',
      },
    ],
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#F0EBE1', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />

      <SiteHeader />

      <main className="flex-grow w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <nav className="text-xs mb-4" style={{ color: '#9A8F83' }}>
          <Link href="/tools" style={{ color: '#9A8F83', textDecoration: 'none' }}>Free tax tools</Link>
          <span aria-hidden> › </span>
          <span>Payments on account</span>
        </nav>

        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
          style={{ backgroundColor: '#FDFCF8', color: '#C4622D', border: '1px solid #C4622D30' }}
        >
          Free tool · no signup
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
            fontSize: 'clamp(1.9rem, 6vw, 2.75rem)',
            fontWeight: 700,
            color: '#1C1208',
            lineHeight: 1.12,
            letterSpacing: '-0.02em',
            marginBottom: '1rem',
          }}
        >
          What will actually leave my account in January?
        </h1>

        <p className="text-sm sm:text-base leading-relaxed mb-8" style={{ color: '#4A4035', maxWidth: 620 }}>
          The number at the bottom of your tax calculation is rarely the number HMRC collects. In
          your first year over the £{POA_THRESHOLD.toLocaleString('en-GB')} threshold, the January
          payment is <strong>half as much again</strong> — the year&apos;s tax plus the first
          instalment towards next year. Enter your bill to see both dates and both amounts. Nothing
          is stored and you do not need an account.
        </p>

        <PaymentsOnAccountCalculator />

        {/* ── Worked example ── */}
        <section className="mt-14">
          <h2
            style={{
              fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
              fontSize: 'clamp(1.3rem, 4vw, 1.75rem)',
              fontWeight: 700,
              color: '#1C1208',
              marginBottom: '1rem',
            }}
          >
            The £6,000 bill that costs £9,000
          </h2>
          <div className="text-sm sm:text-base leading-relaxed space-y-4" style={{ color: '#4A4035' }}>
            <p>
              A freelancer finishes their first full year of self-employment owing £6,000 in Income
              Tax and Class 4 National Insurance. They budget £6,000 for 31 January. HMRC asks for
              £9,000.
            </p>
            <p>
              The extra £3,000 is the first payment on account towards the year that is, by that
              January, already nine months old. A second £3,000 follows on 31 July. In total they
              hand over £12,000 across seven months, having earned one year&apos;s profit — and the
              cash-flow shock, not the tax itself, is what catches people out.
            </p>
            <p>
              It settles down after that. The following January, those two £3,000 instalments are
              deducted from the new bill, so only the difference is due alongside the next first
              instalment. The painful year is the first one.
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="mt-14">
          <h2
            style={{
              fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
              fontSize: 'clamp(1.3rem, 4vw, 1.75rem)',
              fontWeight: 700,
              color: '#1C1208',
              marginBottom: '1.25rem',
            }}
          >
            Common questions
          </h2>
          <div className="space-y-3">
            {faq.map(({ q, a }) => (
              <details
                key={q}
                className="rounded-2xl px-5 py-4"
                style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' }}
              >
                <summary
                  className="text-sm sm:text-base font-medium cursor-pointer"
                  style={{ color: '#1C1208', listStyle: 'none' }}
                >
                  {q}
                </summary>
                <p className="text-sm leading-relaxed mt-3" style={{ color: '#4A4035' }}>
                  {a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Related tools ── */}
        <section className="mt-14">
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#1C1208' }}>
            Other free tools
          </h2>
          <ul className="list-none p-0 m-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { href: '/self-assessment-penalty-calculator', label: 'Late filing penalty calculator', hint: 'What a missed deadline costs, band by band' },
              { href: '/mtd-deadline-checker', label: 'MTD deadline checker', hint: 'Am I in Making Tax Digital, and when?' },
            ].map(t => (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className="block rounded-2xl px-5 py-4"
                  style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8', textDecoration: 'none' }}
                >
                  <span className="block text-sm font-medium" style={{ color: '#1C1208' }}>{t.label}</span>
                  <span className="block text-xs mt-1" style={{ color: '#9A8F83' }}>{t.hint}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-xs leading-relaxed mt-12" style={{ color: '#9A8F83' }}>
          This tool applies HMRC&apos;s published payments on account rules, last reviewed on{' '}
          {RULES_REVIEWED}. It is not tax advice and does not account for individual circumstances
          such as Capital Gains Tax, student loan repayments, Class 2 National Insurance, or a claim
          to reduce your instalments. Check{' '}
          <a
            href={HMRC_POA_URL}
            rel="noopener nofollow"
            target="_blank"
            style={{ color: '#9A8F83', textDecoration: 'underline' }}
          >
            HMRC&apos;s own guidance
          </a>{' '}
          or speak to an accountant if you are unsure. See{' '}
          <Link href="/trust" style={{ color: '#9A8F83', textDecoration: 'underline' }}>
            where EasyTax stands with HMRC
          </Link>
          .
        </p>
      </main>
    </div>
  );
}

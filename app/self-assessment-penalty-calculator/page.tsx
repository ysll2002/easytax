import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import PenaltyCalculator from '@/components/PenaltyCalculator';
import {
  RULES_REVIEWED,
  HMRC_PENALTIES_URL,
  DAILY_MAX,
  TAX_GEARED_MINIMUM,
} from '@/lib/sa-penalties';

export const metadata: Metadata = {
  title: 'Self Assessment Late Filing Penalty Calculator — what HMRC will charge you',
  description:
    'Free calculator for a late Self Assessment return. Enter the tax year, when you filed and what you owe to see the £100 penalty, £10 daily charges, the 6 and 12 month penalties and the 5% late payment charges — itemised, with the dates each one bites.',
  keywords: [
    'self assessment penalty calculator',
    'late filing penalty calculator',
    'HMRC late tax return fine',
    'how much is the fine for filing tax return late',
    'self assessment late payment penalty',
    '£100 penalty tax return',
    'HMRC daily penalties £10',
    'late tax return penalty UK',
  ],
  alternates: { canonical: 'https://easytax.vip/self-assessment-penalty-calculator' },
  openGraph: {
    type: 'website',
    url: 'https://easytax.vip/self-assessment-penalty-calculator',
    title: 'Self Assessment Late Filing Penalty Calculator',
    description:
      'How much HMRC will charge for a late tax return, itemised by penalty band. Free, no signup.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Self Assessment Late Filing Penalty Calculator',
    description: 'What a late tax return actually costs, band by band.',
  },
};

export default function PenaltyCalculatorPage() {
  const faq = [
    {
      q: 'How much is the penalty for filing a Self Assessment return late?',
      a: `£100 as soon as the deadline passes, whether or not you owe any tax. If the return is still outstanding three months later HMRC adds £10 for each further day, up to £${DAILY_MAX.toLocaleString('en-GB')}. At six months and again at twelve months there is a further penalty of the greater of £${TAX_GEARED_MINIMUM} and 5% of the tax due.`,
    },
    {
      q: 'Do I get a £100 penalty even if I owe no tax?',
      a: 'Yes. The initial £100 is for the return being late, not for the tax. It applies even when you owe nothing or are due a refund. Only the 6 and 12 month penalties are calculated from the amount of tax owed.',
    },
    {
      q: 'What are the penalties for paying late, as opposed to filing late?',
      a: 'Late payment is charged separately: 5% of the tax still unpaid 30 days after the deadline, a further 5% at six months, and a further 5% at twelve months. HMRC also charges interest from the day the payment was due, on top of the penalties.',
    },
    {
      q: 'Can I appeal a late filing penalty?',
      a: 'Yes, if you have a reasonable excuse — for example a serious illness, a bereavement, a hospital stay, or a failure of HMRC\'s own service that stopped you filing. You normally have 30 days from the date on the penalty notice. Not having the money to pay the tax is not, on its own, a reasonable excuse for filing late.',
    },
    {
      q: 'Does Making Tax Digital change these penalties?',
      a: 'For taxpayers mandated into Making Tax Digital for Income Tax, quarterly updates fall under a separate points-based late submission regime rather than the fixed amounts above. You accrue a point per missed deadline and a financial penalty once you reach the threshold. The figures on this page are the Self Assessment penalties, which is what applies to the annual return.',
    },
    {
      q: 'When is the Self Assessment deadline?',
      a: 'Online returns and the tax payment are both due by 31 January following the end of the tax year. A 2025/26 return, for the year ended 5 April 2026, is due by 31 January 2027. Paper returns are due three months earlier, by 31 October.',
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
    name: 'Self Assessment Late Filing Penalty Calculator',
    url: 'https://easytax.vip/self-assessment-penalty-calculator',
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
        name: 'Self Assessment penalty calculator',
        item: 'https://easytax.vip/self-assessment-penalty-calculator',
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
          <span>Penalty calculator</span>
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
          What will HMRC charge me for a late tax return?
        </h1>

        <p className="text-sm sm:text-base leading-relaxed mb-8" style={{ color: '#4A4035', maxWidth: 620 }}>
          Late filing penalties stack in four bands and late payment penalties in three more, so the
          bill grows in steps rather than smoothly. Enter three things and you will see exactly which
          bands you are in, what each one costs and the date the next one starts. Nothing is stored
          and you do not need an account.
        </p>

        <PenaltyCalculator />

        {/* ── How the bands work ── */}
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
            Why the bill jumps rather than creeps
          </h2>
          <div className="text-sm sm:text-base leading-relaxed space-y-4" style={{ color: '#4A4035' }}>
            <p>
              A day late and three months late cost the same: £100. The moment you pass the
              three-month mark, though, HMRC starts charging <strong>£10 for every day</strong> the
              return is still outstanding, and keeps charging for 90 days. That single band is worth
              £{DAILY_MAX.toLocaleString('en-GB')} — nine times the initial penalty — and it is the
              one most people are unaware of until the notice arrives.
            </p>
            <p>
              At six months a fourth penalty lands: the greater of £{TAX_GEARED_MINIMUM} and 5% of
              the tax you owe. At twelve months the same charge is made again. Someone twelve months
              late with a £40,000 bill is looking at £5,000 in filing penalties alone, before any
              late payment charge or interest.
            </p>
            <p>
              Late <em>payment</em> is a separate ladder — 5% of what is still outstanding at 30
              days, at six months and at twelve months. Filing on time but paying late avoids the
              first ladder entirely, which is why it is almost always worth submitting the return
              even when you cannot yet pay the tax.
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
              { href: '/payments-on-account-calculator', label: 'Payments on account calculator', hint: 'Why your January bill is 150% of your tax' },
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
          This tool applies HMRC&apos;s published Self Assessment penalty rules, last reviewed on{' '}
          {RULES_REVIEWED}. It is not tax advice, it does not model interest, and it does not account
          for individual circumstances such as a reasonable excuse, a time to pay arrangement, or
          penalties HMRC may increase where it considers information was withheld deliberately. Check{' '}
          <a
            href={HMRC_PENALTIES_URL}
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

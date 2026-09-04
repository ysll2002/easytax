import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import DeadlineChecker from '@/components/DeadlineChecker';
import { quartersForTaxYear, finalDeclarationFor } from '@/lib/mtd-dates';

export const metadata: Metadata = {
  title: 'MTD Deadline Checker — Am I in Making Tax Digital, and when are my deadlines?',
  description:
    'Free checker for UK sole traders and landlords. Enter your income and get the exact tax year you come into MTD for Income Tax, your four quarterly update deadlines (7 Aug, 7 Nov, 7 Feb, 7 May) and your final declaration date.',
  keywords: [
    'MTD deadline checker',
    'am I in MTD for income tax',
    'MTD ITSA deadlines',
    'quarterly update deadline',
    'MTD income tax threshold',
    'do I need to do making tax digital',
    'MTD £50,000 threshold',
    'MTD £30,000 threshold',
  ],
  alternates: { canonical: 'https://easytax.vip/mtd-deadline-checker' },
  openGraph: {
    type: 'website',
    url: 'https://easytax.vip/mtd-deadline-checker',
    title: 'MTD Deadline Checker — am I in Making Tax Digital?',
    description:
      'Enter your income, get your exact MTD for Income Tax start year and every quarterly deadline. Free, no signup.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MTD Deadline Checker — am I in Making Tax Digital?',
    description: 'Your MTD start year and every quarterly deadline, in one answer.',
  },
};

export default function DeadlineCheckerPage() {
  const q2627 = quartersForTaxYear(2026);
  const final2627 = finalDeclarationFor(2026);

  // Answers the questions people actually type, using the same dates the tool
  // computes — so the rich result and the page can never disagree.
  const faq = [
    {
      q: 'When are the MTD for Income Tax quarterly deadlines?',
      a: `Quarterly updates are due one month and two days after each quarter ends, which puts every deadline on the 7th: ${q2627
        .map(q => `${q.key} by ${q.deadlineLabel.replace(/ \d{4}$/, '')}`)
        .join(', ')}. The final declaration for 2026/27 is due ${final2627.deadlineLabel}.`,
    },
    {
      q: 'Who has to use Making Tax Digital for Income Tax?',
      a: 'Sole traders and landlords whose combined gross self-employment and property income exceeds £50,000 were mandated from April 2026. The threshold falls to £30,000 from April 2027 and £20,000 from April 2028. Qualifying income is measured before expenses.',
    },
    {
      q: 'What counts as qualifying income?',
      a: 'Gross turnover from self-employment plus gross rental income from UK or overseas property, before deducting any expenses. Employment income, dividends, savings interest and pensions do not count towards the threshold.',
    },
    {
      q: 'Do quarterly updates replace the Self Assessment return?',
      a: 'Yes. Once you are in MTD for Income Tax you send four quarterly updates plus one final declaration for each tax year, instead of a single Self Assessment return. The final declaration is still due by 31 January after the tax year ends.',
    },
    {
      q: 'Are there penalties for a late quarterly update?',
      a: 'HMRC is treating 2026/27 as a transitional year and is not issuing late-submission penalty points for quarterly updates in that year. Late payment of tax is still penalised as normal, and the easement does not extend to the final declaration.',
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
    name: 'MTD Deadline Checker',
    url: 'https://easytax.vip/mtd-deadline-checker',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
    provider: { '@type': 'Organization', name: 'EasyTax', url: 'https://easytax.vip' },
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#F0EBE1', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }} />

      <SiteHeader />

      <main className="flex-grow w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
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
          Am I in Making Tax Digital — and when are my deadlines?
        </h1>

        <p className="text-sm sm:text-base leading-relaxed mb-8" style={{ color: '#4A4035', maxWidth: 620 }}>
          Two questions and you will know which tax year you come into MTD for Income Tax, every
          quarterly update deadline, and when your final declaration is due. Nothing is stored and
          you do not need an account.
        </p>

        <DeadlineChecker />

        {/* ── Why the dates catch people out ── */}
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
            Why these dates catch people out
          </h2>
          <div className="text-sm sm:text-base leading-relaxed space-y-4" style={{ color: '#4A4035' }}>
            <p>
              MTD quarterly deadlines are not the 5th, even though the quarters end on the 5th. A
              quarter that ends 5 July is due <strong>one month and two days</strong> later — 7
              August. The same two-day offset applies to all four, which is why every MTD deadline
              lands on the 7th.
            </p>
            <p>
              The periods do not line up with calendar quarters either. They run 6 April – 5 July, 6
              July – 5 October, 6 October – 5 January and 6 January – 5 April, following the tax year
              rather than the calendar.
            </p>
            <p>
              And each update is <strong>cumulative</strong>. Your Q3 update restates income and
              expenses for the whole year to date, not just October to January — so a correction to
              an earlier quarter is picked up automatically in the next one.
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

        <p className="text-xs leading-relaxed mt-12" style={{ color: '#9A8F83' }}>
          This tool gives general information about HMRC&apos;s published MTD for Income Tax rules
          and thresholds. It is not tax advice and does not account for individual circumstances
          such as partnerships, trusts or exemptions. Check{' '}
          <a
            href="https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax"
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

import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import TrackEvent from '@/components/TrackEvent';
import NotifyMeForm from '@/components/NotifyMeForm';

// A hub for the free calculators.
//
// Two jobs. For readers: one place that answers "is there a tool for this?".
// For search engines: the tools were otherwise three unconnected leaf pages
// reachable only from the nav, with nothing linking them to each other or
// grouping them as a set. A hub gives the cluster an entry point, gives each
// tool a second inbound internal link, and is itself a page that can rank for
// the generic "free UK tax calculator" queries that no single tool targets.

export const metadata: Metadata = {
  title: 'Free UK Tax Calculators & Tools — MTD deadlines, penalties, payments on account',
  description:
    'Free tools for UK sole traders, landlords and small limited companies. Check whether you are in Making Tax Digital, work out a late filing penalty, and see what really leaves your account on 31 January. No signup, nothing stored.',
  keywords: [
    'free UK tax calculator',
    'self assessment calculator',
    'MTD tools',
    'tax deadline checker',
    'HMRC penalty calculator',
    'payments on account calculator',
    'tax tools for sole traders',
  ],
  alternates: { canonical: 'https://easytax.vip/tools' },
  openGraph: {
    type: 'website',
    url: 'https://easytax.vip/tools',
    title: 'Free UK Tax Calculators & Tools',
    description:
      'MTD deadline checker, late filing penalty calculator and payments on account calculator. Free, no signup.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free UK Tax Calculators & Tools',
    description: 'Three free calculators for UK sole traders, landlords and small companies.',
  },
};

const TOOLS = [
  {
    href: '/mtd-deadline-checker',
    name: 'MTD deadline checker',
    question: 'Am I in Making Tax Digital, and when are my deadlines?',
    blurb:
      'Enter your income and get the tax year you come into MTD for Income Tax, all four quarterly update deadlines and your final declaration date.',
    for: 'Sole traders and landlords',
  },
  {
    href: '/self-assessment-penalty-calculator',
    name: 'Late filing penalty calculator',
    question: 'What will HMRC charge me for a late tax return?',
    blurb:
      'The £100 fixed penalty, £10 daily charges, the 6 and 12 month penalties and the 5% late payment charges — itemised, with the date each one starts.',
    for: 'Anyone who has missed 31 January',
  },
  {
    href: '/payments-on-account-calculator',
    name: 'Payments on account calculator',
    question: 'What will actually leave my account in January?',
    blurb:
      'Your balancing payment plus the two advance instalments HMRC adds towards next year, on the dates they are actually taken.',
    for: 'First-time Self Assessment filers',
  },
];

export default function ToolsPage() {
  const jsonLdList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Free UK tax calculators and tools',
    itemListElement: TOOLS.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      url: `https://easytax.vip${t.href}`,
    })),
  };

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'EasyTax', item: 'https://easytax.vip' },
      { '@type': 'ListItem', position: 2, name: 'Free tax tools', item: 'https://easytax.vip/tools' },
    ],
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#F0EBE1', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
      <TrackEvent name="tools_hub_viewed" />

      <SiteHeader />

      <main className="flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
          style={{ backgroundColor: '#FDFCF8', color: '#C4622D', border: '1px solid #C4622D30' }}
        >
          Free · no signup · nothing stored
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
          Free tax tools
        </h1>

        <p className="text-sm sm:text-base leading-relaxed mb-10" style={{ color: '#4A4035', maxWidth: 640 }}>
          Three questions UK sole traders, landlords and small company directors ask every year, each
          answered in under a minute. No account, no email gate, and nothing you type is saved.
        </p>

        <ul className="list-none p-0 m-0 grid grid-cols-1 md:grid-cols-3 gap-4">
          {TOOLS.map(tool => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className="flex flex-col h-full rounded-2xl p-5 sm:p-6 transition-all"
                style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8', textDecoration: 'none' }}
              >
                <span className="text-xs font-medium mb-3" style={{ color: '#C4622D' }}>
                  {tool.for}
                </span>
                <span
                  className="block mb-2"
                  style={{
                    fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: '#1C1208',
                    lineHeight: 1.25,
                  }}
                >
                  {tool.question}
                </span>
                <span className="block text-sm leading-relaxed flex-grow" style={{ color: '#4A4035' }}>
                  {tool.blurb}
                </span>
                <span className="block text-sm font-semibold mt-4" style={{ color: '#C4622D' }}>
                  Open the {tool.name} →
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* ── Why they are free ── */}
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
            Why these are free, and what we do charge for
          </h2>
          <div className="text-sm sm:text-base leading-relaxed space-y-4" style={{ color: '#4A4035', maxWidth: 680 }}>
            <p>
              The tools answer questions; they do not file anything. Every one of them runs entirely
              in your browser — no figure you enter is sent to us or stored anywhere, which is why we
              can offer them without an account.
            </p>
            <p>
              What EasyTax charges for is the filing itself: quarterly MTD updates, Self Assessment,
              VAT returns and CT600, at £20 + VAT per submission with no subscription. Our HMRC
              production access is still going through approval, so we cannot take live submissions
              yet.
            </p>
            <p>
              If the tools are useful, the most helpful thing you can do is{' '}
              <Link href="/tax-tips" style={{ color: '#C4622D', textDecoration: 'underline' }}>
                read the guides
              </Link>{' '}
              or leave your email below — we will tell you the day filing opens and nothing else.
            </p>
          </div>
        </section>

        <section className="mt-12" id="notify">
          <NotifyMeForm source="tools" />
        </section>

        <p className="text-xs leading-relaxed mt-12" style={{ color: '#9A8F83' }}>
          These tools give general information about HMRC&apos;s published rules. They are not tax
          advice and do not account for individual circumstances. See{' '}
          <Link href="/trust" style={{ color: '#9A8F83', textDecoration: 'underline' }}>
            where EasyTax stands with HMRC
          </Link>
          .
        </p>
      </main>
    </div>
  );
}

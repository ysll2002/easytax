import type { Metadata } from 'next';
import { pageTitle } from '@/lib/seo-meta';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import TrackEvent from '@/components/TrackEvent';
import SiteFooter from '@/components/SiteFooter';
import TrackedCta from '@/components/TrackedCta';
import { COMPETITORS } from '@/lib/competitors';
import { ArrowRight } from 'lucide-react';

// A hub for the nine comparison pages.
//
// Same argument as /tools, and the same measured problem one step worse. On
// 2026-09-17 every `/*-alternative` page had zero views over 7 days and zero
// over 30, while being 1,800–2,700 words of hand-written comparison each. They
// were reachable from the site footer and from the sitemap, and from nothing
// else — `/mtd-software`, the page that exists to answer "which MTD software",
// linked to none of them.
//
// A hub does three things a row of footer links cannot. It gives each page a
// second inbound link from a page that is about the same thing. It gives the
// set an entry point for the generic query — "best MTD software for sole
// traders", "MTD software comparison" — that no single competitor page targets
// and that all nine of them are individually the wrong answer to. And it is
// the page to link from the homepage, which on this site is the only page a
// search engine has ever surfaced.
//
// The copy rule here is the one the individual pages already follow, and it is
// a trust rule rather than a style rule: state what each product is good at,
// in its own terms, before saying why somebody might leave it. A reader on
// this page is currently paying one of these companies. A page that tells them
// their current choice is stupid is telling them they are stupid.

export const metadata: Metadata = {
  title: pageTitle('Compare MTD Software for UK Sole Traders & Landlords'),
  description:
    'EasyTax vs QuickBooks, Xero, FreeAgent, Sage, Crunch, Coconut, KashFlow, Bokio and TaxScouts for MTD ITSA, Self Assessment, VAT and CT600. £24 per submission.',
  keywords: [
    'MTD software comparison',
    'best MTD software UK',
    'MTD ITSA software comparison',
    'accounting software alternative UK',
    'cheapest MTD software sole traders',
  ],
  alternates: { canonical: 'https://easytax.vip/compare' },
  openGraph: {
    type: 'website',
    url: 'https://easytax.vip/compare',
    title: 'Compare MTD Software for UK Sole Traders & Landlords',
    description:
      'Nine side-by-side comparisons. EasyTax files MTD ITSA, Self Assessment, VAT and CT600 to HMRC for £24 per submission — no monthly fee.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare MTD Software — UK Sole Traders & Landlords',
    description: 'EasyTax vs QuickBooks, Xero, FreeAgent, Sage and five more. £24 per filing, no subscription.',
  },
};

const display = 'var(--font-display), Playfair Display, Georgia, serif';

export default function ComparePage() {
  const jsonLdList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'MTD software comparisons',
    itemListElement: COMPETITORS.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `EasyTax vs ${c.name}`,
      url: `https://easytax.vip${c.href}`,
    })),
  };

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'EasyTax', item: 'https://easytax.vip' },
      { '@type': 'ListItem', position: 2, name: 'Compare MTD software', item: 'https://easytax.vip/compare' },
    ],
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#F0EBE1', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
      <TrackEvent name="compare_hub_viewed" />

      <SiteHeader />

      <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
          style={{ backgroundColor: '#FDFCF8', color: '#C4622D', border: '1px solid #C4622D30' }}
        >
          Nine side-by-side comparisons
        </div>

        <h1
          style={{
            fontFamily: display,
            fontSize: 'clamp(1.9rem, 6vw, 2.75rem)',
            fontWeight: 700,
            color: '#1C1208',
            lineHeight: 1.12,
            letterSpacing: '-0.02em',
            marginBottom: '1rem',
          }}
        >
          Compare MTD software
        </h1>

        <p className="text-sm sm:text-base leading-relaxed mb-4" style={{ color: '#4A4035', maxWidth: 680 }}>
          Most UK accounting software is sold as a monthly subscription, because most of it is
          bookkeeping software that also files. If you are a sole trader or landlord whose actual
          requirement is four quarterly updates and one Self Assessment a year, you are paying for
          twelve months to use it five times.
        </p>

        <p className="text-sm sm:text-base leading-relaxed mb-10" style={{ color: '#4A4035', maxWidth: 680 }}>
          EasyTax charges <strong style={{ color: '#1C1208' }}>£24 per submission</strong> (£20 + VAT) and
          nothing else. That is the whole difference, and whether it is the right trade depends
          entirely on how much bookkeeping you actually need — so each page below says what the other
          product is genuinely better at before it says why you might leave.
        </p>

        <ul className="list-none p-0 m-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMPETITORS.map(c => (
            <li key={c.href}>
              <TrackedCta
                href={c.href}
                placement={`compare_hub_${c.name.toLowerCase()}`}
                event="compare_cta_click"
                className="flex flex-col h-full rounded-2xl p-5 sm:p-6 transition-all"
                style={{
                  backgroundColor: '#FDFCF8',
                  border: '1px solid #DDD5C8',
                  textDecoration: 'none',
                  minHeight: '44px',
                }}
              >
                <span
                  className="block mb-1"
                  style={{ fontFamily: display, fontSize: '1.15rem', fontWeight: 700, color: '#1C1208' }}
                >
                  EasyTax vs {c.name}
                </span>
                <span className="text-xs font-medium mb-3 block" style={{ color: '#C4622D' }}>
                  {c.price}
                </span>
                <span className="text-sm block mb-2" style={{ color: '#4A4035', lineHeight: 1.6 }}>
                  {c.who}
                </span>
                <span className="text-sm block mb-4 flex-grow" style={{ color: '#4A4035', lineHeight: 1.6 }}>
                  {c.switchReason}
                </span>
                <span
                  className="text-sm font-medium inline-flex items-center gap-1.5"
                  style={{ color: '#C4622D' }}
                >
                  See the comparison <ArrowRight size={14} strokeWidth={2} />
                </span>
              </TrackedCta>
            </li>
          ))}
        </ul>

        <section
          className="mt-12 rounded-2xl p-6 sm:p-8"
          style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' }}
        >
          <h2
            style={{
              fontFamily: display,
              fontSize: 'clamp(1.25rem, 3vw, 1.6rem)',
              fontWeight: 700,
              color: '#1C1208',
              marginBottom: '0.75rem',
            }}
          >
            Before you switch anything
          </h2>
          {/* The same disclosure the rest of the site carries, on the page most
              likely to be read by somebody about to make a purchasing
              decision. Burying it here would be the single most expensive
              place on this site to be caught overclaiming. */}
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#4A4035' }}>
            EasyTax is built against HMRC&apos;s Making Tax Digital APIs and{' '}
            <strong style={{ color: '#1C1208' }}>HMRC production approval is still pending</strong>, so
            filing is not yet open to the public. The calculators, the deadline checker and the
            guidance archive are free and working today. If you are mid-year with a product that
            files, do not cancel it on the strength of this page.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/mtd-deadline-checker"
              className="inline-block px-6 py-3 rounded-full font-medium text-sm text-center"
              style={{ backgroundColor: '#1C1208', color: '#FDFCF8', textDecoration: 'none' }}
            >
              Check your MTD deadlines
            </Link>
            <Link
              href="/pricing"
              className="inline-block px-6 py-3 rounded-full font-medium text-sm text-center"
              style={{
                backgroundColor: 'transparent',
                color: '#1C1208',
                border: '1px solid #DDD5C8',
                textDecoration: 'none',
              }}
            >
              See what £24 covers
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

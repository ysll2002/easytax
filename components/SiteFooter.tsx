import Link from 'next/link';
import FooterNotify from './FooterNotify';

// One footer for the whole public site.
//
// It replaces five different hand-rolled footers that had drifted apart, and
// fixes three concrete problems they shared:
//
// 1. Legal identity. Most of them said "EasyTax Ltd. Built in London." There
//    is no such company: the entity is Finance Panda Limited, trading as
//    EasyTax, which is what /trust and the privacy policy say. Naming a
//    non-existent company on a page that asks for a National Insurance number
//    is the opposite of the trust the product needs.
//
// 2. Orphan pages. The 13 comparison and guide landing pages were listed in
//    sitemap.xml and linked from nowhere on the site. Search engines crawl
//    orphan pages rarely and rank them poorly, which matches what the data
//    shows — 134 URLs submitted, essentially only the homepage getting
//    traffic. Linking them from every page is the cheapest possible fix.
//
// 3. Dead links and unreadable text. The homepage footer had a Twitter link
//    pointing at "#", and set #4A4035 text on a #1C1208 background — a
//    contrast ratio of about 1.8:1, which is illegible.

const display = 'var(--font-display), Playfair Display, Georgia, serif';

const linkStyle: React.CSSProperties = {
  color: '#B8ADA1',
  textDecoration: 'none',
  fontSize: '0.85rem',
  lineHeight: 1.9,
};

const headingStyle: React.CSSProperties = {
  color: '#FDFCF8',
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: '0.6rem',
};

const COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: 'Product',
    links: [
      { href: '/pricing', label: 'Pricing' },
      { href: '/mtd-checker', label: 'MTD checker' },
      { href: '/timetable', label: 'MTD deadlines' },
      { href: '/tax-tips', label: 'Tax Tips' },
      { href: '/register', label: 'Create an account' },
    ],
  },
  {
    heading: 'Guides',
    links: [
      { href: '/mtd-software', label: 'MTD software' },
      { href: '/self-assessment-software', label: 'Self Assessment software' },
      { href: '/landlord-tax-software', label: 'Landlord tax software' },
    ],
  },
  {
    heading: 'Compare',
    links: [
      { href: '/xero-alternative', label: 'vs Xero' },
      { href: '/quickbooks-alternative', label: 'vs QuickBooks' },
      { href: '/freeagent-alternative', label: 'vs FreeAgent' },
      { href: '/sage-alternative', label: 'vs Sage' },
      { href: '/coconut-alternative', label: 'vs Coconut' },
      { href: '/crunch-alternative', label: 'vs Crunch' },
      { href: '/bokio-alternative', label: 'vs Bokio' },
      { href: '/kashflow-alternative', label: 'vs KashFlow' },
      { href: '/taxscouts-alternative', label: 'vs TaxScouts' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: '/trust', label: 'Security & trust' },
      { href: '/privacy', label: 'Privacy policy' },
      { href: '/terms', label: 'Terms of service' },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer style={{ borderTop: '1px solid #2E2418', backgroundColor: '#1C1208' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] gap-10 lg:gap-16">

          {/* Brand + launch capture */}
          <div>
            <p style={{ fontFamily: display, fontSize: '1.35rem', fontWeight: 700, color: '#C4622D', marginBottom: '0.6rem' }}>
              EasyTax
            </p>
            <p className="text-sm mb-5" style={{ color: '#B8ADA1', lineHeight: 1.65, maxWidth: '32ch' }}>
              MTD ITSA quarterly updates, Self Assessment, VAT and CT600 — filed straight to HMRC.
              £20 + VAT per submission, no monthly subscription.
            </p>

            <p className="text-xs font-semibold mb-2" style={{ color: '#FDFCF8' }}>
              Filing opens when HMRC approves our production access.
            </p>
            <FooterNotify />
            <p className="text-xs mt-2" style={{ color: '#9A8F83', lineHeight: 1.6 }}>
              One email, on the day it goes live.{' '}
              <Link href="/trust" style={{ color: '#C4622D', textDecoration: 'none' }}>
                See where we are with HMRC →
              </Link>
            </p>
          </div>

          {/* Link columns — two-up on mobile, four-up from sm. */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {COLUMNS.map(col => (
              <div key={col.heading}>
                <p style={headingStyle}>{col.heading}</p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {col.links.map(l => (
                    <li key={l.href}>
                      <Link href={l.href} style={linkStyle} className="hover:text-[#C4622D] transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Legal identity. Spelled out rather than abbreviated: this is the one
            block on the page that tells a stranger which company they would be
            handing their tax data to, and the ICO reference is independently
            checkable on the public register. */}
        <div
          className="mt-10 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          style={{ borderTop: '1px solid #2E2418' }}
        >
          <p className="text-xs" style={{ color: '#9A8F83', lineHeight: 1.7 }}>
            © {new Date().getFullYear()} Finance Panda Limited, trading as EasyTax. Registered in
            England and Wales. ICO registered data controller ZA540758.
          </p>
          <p className="text-xs" style={{ color: '#9A8F83' }}>
            <a href="mailto:hello@easytax.vip" style={{ color: '#B8ADA1', textDecoration: 'none' }}>
              hello@easytax.vip
            </a>
          </p>
        </div>

        <p className="text-xs mt-4" style={{ color: '#6E655B', lineHeight: 1.7, maxWidth: '78ch' }}>
          EasyTax is built on HMRC&apos;s Making Tax Digital APIs and works end to end against
          HMRC&apos;s sandbox. Live submissions are enabled once HMRC production approval completes.
          Information on this site is general guidance, not tax advice.
        </p>
      </div>
    </footer>
  );
}

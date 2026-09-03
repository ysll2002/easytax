import Link from 'next/link';

// Shared footer for every public page. It carries a full internal-link graph so
// crawlers reach each SEO landing page from every other page (the older
// per-page footers only linked Privacy/Terms, which left the comparison pages
// as near-orphans — see SEO_CHECKLIST.md, week-1 item).

const display = 'var(--font-display), Playfair Display, Georgia, serif';

const columns: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: 'Product',
    links: [
      { href: '/pricing',      label: 'Pricing — £24 per filing' },
      { href: '/mtd-checker',  label: 'Does MTD apply to me?' },
      { href: '/timetable',    label: 'MTD deadlines 2026–28' },
      { href: '/tax-tips',     label: 'Tax tips' },
      { href: '/register',     label: 'Create free account' },
      { href: '/login',        label: 'Log in' },
    ],
  },
  {
    heading: 'Guides',
    links: [
      { href: '/mtd-software',             label: 'MTD ITSA software' },
      { href: '/self-assessment-software', label: 'Self Assessment software' },
      { href: '/landlord-tax-software',    label: 'Landlord tax software' },
    ],
  },
  {
    heading: 'Compare',
    links: [
      { href: '/freeagent-alternative',  label: 'vs FreeAgent' },
      { href: '/xero-alternative',       label: 'vs Xero' },
      { href: '/quickbooks-alternative', label: 'vs QuickBooks' },
      { href: '/sage-alternative',       label: 'vs Sage' },
      { href: '/bokio-alternative',      label: 'vs Bokio' },
      { href: '/coconut-alternative',    label: 'vs Coconut' },
      { href: '/kashflow-alternative',   label: 'vs KashFlow' },
      { href: '/crunch-alternative',     label: 'vs Crunch' },
      { href: '/taxscouts-alternative',  label: 'vs TaxScouts' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: '/privacy',                  label: 'Privacy' },
      { href: '/terms',                    label: 'Terms' },
      { href: 'mailto:hello@easytax.vip',  label: 'Contact us' },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer style={{ borderTop: '1px solid #2E2418', backgroundColor: '#1C1208', padding: '3rem 0 2.5rem' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          {columns.map(col => (
            <div key={col.heading}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9A8F83' }}>{col.heading}</p>
              <ul className="space-y-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {col.links.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm hover:text-[#C4622D] transition-colors inline-block py-0.5" style={{ color: '#B8AE9F', textDecoration: 'none' }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pt-6" style={{ borderTop: '1px solid #2E2418' }}>
          <div style={{ fontFamily: display, fontSize: '1.05rem', color: '#4A4035' }}>
            EasyTax · Self Assessment, sorted.
          </div>
          <p className="text-xs" style={{ color: '#4A4035', lineHeight: 1.6 }}>
            © {new Date().getFullYear()} Finance Panda Limited, trading as EasyTax. Built in London.
          </p>
        </div>
      </div>
    </footer>
  );
}

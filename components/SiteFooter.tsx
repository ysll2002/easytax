'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import NotifyMeForm from './NotifyMeForm';

// One footer for the whole public site.
//
// Twenty pages each carried their own footer, and every one of them linked
// Privacy and Terms and nothing else. That left the free tools, the comparison
// pages, the topic hubs and the paginated archive with almost no inbound
// internal link — which is exactly the set the metrics endpoint reports as
// `pages_with_no_traffic`. Crawlers find pages by following links; a page the
// site itself never links to is one a search engine has little reason to keep
// in its index.
//
// It also carries the compact launch-list capture, so every public page has a
// low-commitment ask while filing is still closed — previously only four pages
// did, and none of them were the pages search traffic actually lands on.

const DISPLAY = 'var(--font-display), Playfair Display, Georgia, serif';

/** The eight competitor comparison pages. All were orphaned. */
const COMPARISONS: { href: string; label: string }[] = [
  { href: '/quickbooks-alternative', label: 'QuickBooks' },
  { href: '/xero-alternative',       label: 'Xero' },
  { href: '/freeagent-alternative',  label: 'FreeAgent' },
  { href: '/sage-alternative',       label: 'Sage' },
  { href: '/crunch-alternative',     label: 'Crunch' },
  { href: '/coconut-alternative',    label: 'Coconut' },
  { href: '/kashflow-alternative',   label: 'KashFlow' },
  { href: '/bokio-alternative',      label: 'Bokio' },
  { href: '/taxscouts-alternative',  label: 'TaxScouts' },
];

function Column({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-3"
        style={{ color: '#9A8F83' }}
      >
        {title}
      </p>
      <ul className="space-y-2 list-none p-0 m-0">
        {links.map(l => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm hover:text-[#C4622D] transition-colors"
              style={{ color: '#C9BFB2', textDecoration: 'none' }}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter({ source = 'footer' }: { source?: string }) {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');

  return (
    <footer style={{ borderTop: '1px solid #2E2418', backgroundColor: '#1C1208' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        {/* Launch list. Compact on purpose: on an article or a comparison page
            this is a footnote, not the reason the visitor came. */}
        <div className="mb-10 sm:mb-14 max-w-2xl">
          <div
            className="p-4 sm:p-5 rounded-2xl"
            style={{ backgroundColor: '#FDFCF8', border: '1px solid #2E2418' }}
          >
            <NotifyMeForm
              source={source}
              variant="compact"
              heading={t('notifyHeading')}
              blurb={t('notifyBlurb')}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8 mb-10">
          <Column
            title={t('product')}
            links={[
              { href: '/#how',                      label: nav('howItWorks') },
              { href: '/pricing',                   label: nav('pricing') },
              { href: '/mtd-software',              label: t('mtdSoftware') },
              { href: '/self-assessment-software',  label: t('saSoftware') },
              { href: '/landlord-tax-software',     label: t('landlordSoftware') },
              { href: '/trust',                     label: nav('trust') },
            ]}
          />
          <Column
            title={t('tools')}
            links={[
              { href: '/tools',                                 label: t('allTools') },
              { href: '/mtd-deadline-checker',                   label: nav('deadlineChecker') },
              { href: '/self-assessment-penalty-calculator',     label: t('penaltyCalculator') },
              { href: '/payments-on-account-calculator',         label: t('poaCalculator') },
              { href: '/timetable',                              label: nav('timetable') },
              // The .ics feed. Linked here as well as on the two deadline
              // pages, because it is the one thing on the site a visitor can
              // take away and keep while filing is still closed.
              { href: '/calendar/uk-tax-deadlines.ics',           label: t('taxCalendar') },
            ]}
          />
          <Column
            title={t('guides')}
            links={[
              { href: '/tax-tips',            label: nav('taxTips') },
              { href: '/tax-tips/topics',     label: t('browseTopics') },
              { href: '/#faq',                label: nav('faq') },
            ]}
          />
          <Column
            title={t('company')}
            links={[
              { href: '/trust',    label: t('aboutUs') },
              { href: '/privacy',  label: t('privacy') },
              { href: '/terms',    label: t('terms') },
              { href: '/register', label: nav('register') },
              { href: '/login',    label: nav('login') },
            ]}
          />
        </div>

        {/* Comparisons get their own wrapped row rather than a ninth item in a
            column — nine links read badly stacked, and this keeps every one of
            them a single hop from anywhere on the site. */}
        <div className="mb-10 pt-8" style={{ borderTop: '1px solid #2E2418' }}>
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: '#9A8F83' }}
          >
            {t('compare')}
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {COMPARISONS.map(c => (
              <Link
                key={c.href}
                href={c.href}
                className="text-sm hover:text-[#C4622D] transition-colors"
                style={{ color: '#C9BFB2', textDecoration: 'none' }}
              >
                {t('vs', { name: c.label })}
              </Link>
            ))}
          </div>
        </div>

        <div
          className="pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          style={{ borderTop: '1px solid #2E2418' }}
        >
          <div style={{ fontFamily: DISPLAY, fontSize: '1.05rem', color: '#9A8F83' }}>
            {t('tagline')}
          </div>
          <p className="text-xs max-w-md md:text-right" style={{ color: '#4A4035', lineHeight: 1.6 }}>
            {t('disclaimer')}
          </p>
        </div>
      </div>
    </footer>
  );
}

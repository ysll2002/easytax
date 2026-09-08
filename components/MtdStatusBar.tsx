'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CalendarClock, ArrowRight } from 'lucide-react';
import { getMtdStatus, type MtdStatus } from '@/lib/mtd-status';
import { trackClient } from './PageViewTracker';

// The live-mandate line, on every public page.
//
// The homepage already carried a correct, date-driven announcement bar. No
// other page did — they were written by hand, in the future tense, about a
// mandate that commenced on 6 April 2026. This lifts the homepage's behaviour
// into one component so all thirty public pages state the same thing, and so
// the statement is derived from lib/mtd-status rather than retyped per page.
//
// It also gives /mtd-deadline-checker an inbound link from every page. That
// page had 0 views in the entire measured window despite being the one thing
// we can genuinely give a visitor before HMRC approval lands; it was reachable
// only from the tools hub, which also had 0 views.
//
// Why a client component: these pages are statically rendered, so a purely
// server-rendered countdown freezes at build time and starts lying the moment
// a deadline passes. The dated sentence still renders on the server — crawlers
// and no-JS visitors see it — and the day count is filled in after mount, from
// the reader's actual clock. Deploy staleness therefore costs at most the
// wrong date in the HTML source, corrected on hydration, rather than a wrong
// date on the screen.

/** Pages where a deadline notice is noise, or already present.
 *  `/` carries its own richer announcement bar, which also states that filing
 *  opens on HMRC approval — showing both would say the same thing twice. */
const HIDDEN_ON = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/unsubscribe',
  '/privacy',
  '/terms',
];

export default function MtdStatusBar() {
  const t = useTranslations('mtdBar');
  const pathname = usePathname();

  // Seeded from the render-time clock so the sentence is present in the
  // server-rendered HTML, then re-resolved on mount against the real one.
  const [status, setStatus] = useState<MtdStatus>(() => getMtdStatus());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setStatus(getMtdStatus());
    setMounted(true);
  }, []);

  if (HIDDEN_ON.some(p => pathname === p || pathname.startsWith(`${p}/`))) return null;
  if (pathname.startsWith('/dashboard')) return null;

  const due = status.dueQuarter;

  return (
    <div
      style={{ backgroundColor: '#FAF6EE', borderBottom: '1px solid #EFE7D9' }}
      role="status"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-2.5 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-xs sm:text-sm">
        <span className="flex items-center gap-2" style={{ color: '#4A4035' }}>
          <CalendarClock size={14} style={{ color: '#C4622D', flexShrink: 0 }} aria-hidden />
          <span>
            <strong style={{ color: '#1C1208' }}>
              {status.isLive ? t('live') : t('preMandate')}
            </strong>
            {due && (
              <>
                {' '}
                {t('due', {
                  quarter: due.key,
                  period: due.periodLabel,
                  date: due.deadlineLabel,
                })}
                {/* Only after mount: a build-time day count is wrong by however
                    long ago the deploy was. */}
                {mounted && status.daysUntilDue !== null && (
                  <span style={{ color: '#C4622D', fontWeight: 600 }}>
                    {' '}
                    · {t('daysLeft', { days: status.daysUntilDue })}
                  </span>
                )}
              </>
            )}
          </span>
        </span>

        <Link
          href="/mtd-deadline-checker"
          onClick={() => trackClient('activation_cta_click', { placement: 'mtd_status_bar' })}
          className="inline-flex items-center gap-1 font-medium sm:ml-auto"
          style={{ color: '#C4622D', textDecoration: 'none', minHeight: 24 }}
        >
          {t('cta')}
          <ArrowRight size={13} aria-hidden />
        </Link>
      </div>
    </div>
  );
}

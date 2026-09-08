'use client';

import { CalendarPlus } from 'lucide-react';
import { trackClient } from './PageViewTracker';

// The subscribe block for the .ics feed.
//
// Two links, because the two things people want are genuinely different: a
// one-off download that drops the dates into whatever app they use, and a
// live subscription that keeps updating. webcal:// is what tells iOS, macOS,
// Outlook and Google to treat the URL as a subscription rather than a file.

const FEED_PATH = '/calendar/uk-tax-deadlines.ics';
const HTTPS_URL = `https://easytax.vip${FEED_PATH}`;
const WEBCAL_URL = `webcal://easytax.vip${FEED_PATH}`;

export default function CalendarSubscribe({ placement }: { placement: string }) {
  return (
    <div
      className="p-5 sm:p-6 rounded-2xl"
      style={{ backgroundColor: '#F0F5F0', border: '1px solid #6B8E6E40' }}
    >
      <div className="flex items-start gap-3">
        <CalendarPlus size={20} style={{ color: '#6B8E6E', flexShrink: 0, marginTop: 2 }} aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base mb-1" style={{ color: '#1C1208' }}>
            Put these deadlines in your calendar
          </p>
          <p className="text-sm mb-4" style={{ color: '#4A4035', lineHeight: 1.6 }}>
            A free subscription covering the next three years of MTD quarterly updates,
            final declarations and Self Assessment dates. Reminders one week and one day
            before each. No account, no email address.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <a
              href={WEBCAL_URL}
              onClick={() => trackClient('calendar_cta_click', { placement, mode: 'subscribe' })}
              className="inline-flex items-center justify-center px-5 rounded-full text-sm font-semibold"
              style={{ minHeight: 44, backgroundColor: '#6B8E6E', color: '#FDFCF8', textDecoration: 'none' }}
            >
              Subscribe in your calendar
            </a>
            <a
              href={FEED_PATH}
              onClick={() => trackClient('calendar_cta_click', { placement, mode: 'download' })}
              className="inline-flex items-center justify-center px-5 rounded-full text-sm font-medium"
              style={{ minHeight: 44, border: '1px solid #6B8E6E60', color: '#4A4035', textDecoration: 'none' }}
            >
              Download the .ics file
            </a>
          </div>
          <p className="text-xs mt-3 m-0" style={{ color: '#9A8F83', wordBreak: 'break-all' }}>
            Or paste this into your calendar app: {HTTPS_URL}
          </p>
        </div>
      </div>
    </div>
  );
}

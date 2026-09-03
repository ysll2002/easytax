// Making Tax Digital for Income Tax (MTD ITSA) quarterly-update calendar.
//
// Every mandated sole trader / landlord sends four cumulative quarterly updates
// per tax year. HMRC's standard quarters and their deadlines are:
//
//   Q1  6 Apr – 5 Jul   due 7 Aug
//   Q2  6 Jul – 5 Oct   due 7 Nov
//   Q3  6 Oct – 5 Jan   due 7 Feb
//   Q4  6 Jan – 5 Apr   due 7 May
//
// Source: gov.uk "Use Making Tax Digital for Income Tax — send quarterly
// updates". This module is the single source of truth for the marketing site,
// the MTD checker and the reminder cron, so the dates never drift apart again
// (the homepage previously hard-coded "5 Aug 2026" and kept counting down to
// zero after the date passed).

export type QuarterlyDeadline = {
  quarter: 1 | 2 | 3 | 4;
  /** e.g. "2026/27" */
  taxYear: string;
  periodStart: Date;
  periodEnd: Date;
  due: Date;
  /** Whole days from `now` until the deadline (never negative). */
  daysLeft: number;
};

// [quarter, dueMonth (0-based), periodStartMonth, periodStartYearOffset relative to due year]
const QUARTERS: ReadonlyArray<{ quarter: 1 | 2 | 3 | 4; dueMonth: number; startMonth: number; startYearOffset: number }> = [
  { quarter: 3, dueMonth: 1,  startMonth: 9, startYearOffset: -1 }, // due 7 Feb, period from 6 Oct previous year
  { quarter: 4, dueMonth: 4,  startMonth: 0, startYearOffset: 0  }, // due 7 May, period from 6 Jan
  { quarter: 1, dueMonth: 7,  startMonth: 3, startYearOffset: 0  }, // due 7 Aug, period from 6 Apr
  { quarter: 2, dueMonth: 10, startMonth: 6, startYearOffset: 0  }, // due 7 Nov, period from 6 Jul
];

const DAY_MS = 86_400_000;

function buildDeadline(dueYear: number, q: (typeof QUARTERS)[number], now: Date): QuarterlyDeadline {
  const due         = new Date(Date.UTC(dueYear, q.dueMonth, 7, 23, 59, 59));
  const periodStart = new Date(Date.UTC(dueYear + q.startYearOffset, q.startMonth, 6));
  // Period ends the day before the next quarter starts (5th of the month, three months on).
  const periodEnd   = new Date(Date.UTC(dueYear + q.startYearOffset, q.startMonth + 3, 5));
  // Tax year runs 6 Apr – 5 Apr; Q1/Q2 are due in the same calendar year the
  // tax year started, Q3/Q4 are due in the following calendar year.
  const taxYearStart = q.quarter <= 2 ? dueYear : dueYear - 1;
  const taxYear = `${taxYearStart}/${String(taxYearStart + 1).slice(-2)}`;
  const daysLeft = Math.max(0, Math.ceil((due.getTime() - now.getTime()) / DAY_MS));
  return { quarter: q.quarter, taxYear, periodStart, periodEnd, due, daysLeft };
}

/** Every quarterly deadline on or after `now`, in date order. */
export function getUpcomingDeadlines(now: Date = new Date(), count = 4): QuarterlyDeadline[] {
  const out: QuarterlyDeadline[] = [];
  const startYear = now.getUTCFullYear();
  for (let year = startYear; out.length < count && year <= startYear + 3; year++) {
    for (const q of QUARTERS) {
      const d = buildDeadline(year, q, now);
      if (d.due.getTime() >= now.getTime()) {
        out.push(d);
        if (out.length === count) break;
      }
    }
  }
  return out;
}

/** The next quarterly update deadline (always defined). */
export function getNextDeadline(now: Date = new Date()): QuarterlyDeadline {
  return getUpcomingDeadlines(now, 1)[0];
}

/**
 * The first quarterly deadline someone must meet if they become mandated from
 * 6 April of `mandationYear` — i.e. Q1 of that tax year, due 7 August.
 */
export function getFirstDeadlineForMandationYear(mandationYear: number): QuarterlyDeadline {
  const now = new Date();
  return buildDeadline(mandationYear, QUARTERS[2], now);
}

// next-intl gives us bare language codes ("en"); bare "en" formats as US
// (Nov 7, 2026). This is a UK product, so pin English to en-GB (7 Nov 2026).
function intlLocale(locale: string): string {
  return locale === 'en' ? 'en-GB' : locale;
}

export function formatDeadlineDate(d: Date, locale = 'en-GB'): string {
  return d.toLocaleDateString(intlLocale(locale), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function formatPeriod(d: QuarterlyDeadline, locale = 'en-GB'): string {
  const fmt = (x: Date) => x.toLocaleDateString(intlLocale(locale), { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return `${fmt(d.periodStart)} – ${fmt(d.periodEnd)}`;
}

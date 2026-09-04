// Single source of truth for Making Tax Digital dates.
//
// Why this file exists: the homepage hard-coded "Q1 update due 5 Aug 2026" and
// counted down to a `new Date('2026-08-05')` constant. That date passed on
// 5 August 2026, so from 6 August the live site advertised a deadline a month
// in the past and rendered the hero pill as "0 days until your first MTD ITSA
// quarterly update". It was also simply the wrong date — the real first
// quarterly deadline is 7 August 2026, which /timetable had correct all along.
//
// Two pages holding their own copy of the same calendar is what allowed them
// to disagree, so both now read from the list below and the countdown rolls to
// the next future deadline on its own.

export type DeadlineKind =
  | 'digitalRecords'
  | 'quarterly'
  | 'selfAssessment'
  | 'final';

export type Deadline = {
  /** ISO calendar date (UTC) of the deadline itself. */
  date: string;
  kind: DeadlineKind;
  title: string;
  desc: string;
  /** Rendered with extra emphasis in the /timetable list. */
  highlight?: boolean;
  isStart?: boolean;
  isFinal?: boolean;
  note?: string;
};

/** Chronological. Quarterly updates follow HMRC's fixed 7 Aug / 7 Nov / 7 Feb
 *  / 7 May pattern, one month and seven days after each quarter end. */
export const MTD_DEADLINES: Deadline[] = [
  {
    date: '2026-04-06',
    kind: 'digitalRecords',
    title: 'Start keeping digital records',
    desc: 'Begin using compatible software to keep digital records of your income and expenses.',
    isStart: true,
  },
  {
    date: '2026-08-07',
    kind: 'quarterly',
    title: '1st Quarterly Update deadline',
    desc: 'Send your Quarterly Update for the period 6 April to 5 July 2026.',
  },
  {
    date: '2026-11-07',
    kind: 'quarterly',
    title: '2nd Quarterly Update deadline',
    desc: 'Send your Quarterly Update for the period 6 April to 5 October 2026.',
  },
  {
    date: '2027-01-31',
    kind: 'selfAssessment',
    title: 'Self-Assessment Tax Return (2025/26)',
    desc: 'Deadline to submit a Self-Assessment Tax Return in the usual way for the previous 2025/26 tax year.',
    highlight: true,
  },
  {
    date: '2027-02-07',
    kind: 'quarterly',
    title: '3rd Quarterly Update deadline',
    desc: 'Send your Quarterly Update for the period 6 April 2026 to 5 January 2027.',
  },
  {
    date: '2027-05-07',
    kind: 'quarterly',
    title: '4th Quarterly Update deadline',
    desc: 'Send your Quarterly Update for the period 6 April 2026 to 5 April 2027.',
  },
  {
    date: '2027-08-07',
    kind: 'quarterly',
    title: '1st Quarterly Update deadline (2027/28)',
    desc: 'Send your Quarterly Update for the period 6 April to 5 July 2027. Eligible people with gross income over £30,000 begin using MTD.',
    note: 'Income £30,000+ threshold begins',
  },
  {
    date: '2027-11-07',
    kind: 'quarterly',
    title: '2nd Quarterly Update deadline (2027/28)',
    desc: 'Send your Quarterly Update for the period 6 April to 5 October 2027.',
  },
  {
    date: '2028-01-31',
    kind: 'final',
    title: 'MTD Tax Return & payment deadline (2026/27)',
    desc: 'Deadline to submit your MTD Tax Return and pay your income tax for 2026/27.',
    highlight: true,
    isFinal: true,
  },
  {
    date: '2028-02-07',
    kind: 'quarterly',
    title: '3rd Quarterly Update deadline (2027/28)',
    desc: 'Send your Quarterly Update for the period 6 April 2027 to 5 January 2028.',
  },
  {
    date: '2028-04-06',
    kind: 'digitalRecords',
    title: 'Income £20,000+ threshold begins',
    desc: 'Sole traders and landlords with gross income over £20,000 must start keeping digital records and filing quarterly.',
    note: 'Income £20,000+ threshold begins',
  },
  {
    date: '2028-05-07',
    kind: 'quarterly',
    title: '4th Quarterly Update deadline (2027/28)',
    desc: 'Send your Quarterly Update for the period 6 April 2027 to 5 April 2028.',
  },
  {
    date: '2028-08-07',
    kind: 'quarterly',
    title: '1st Quarterly Update deadline (2028/29)',
    desc: 'Send your Quarterly Update for the period 6 April to 5 July 2028.',
  },
  {
    date: '2028-11-07',
    kind: 'quarterly',
    title: '2nd Quarterly Update deadline (2028/29)',
    desc: 'Send your Quarterly Update for the period 6 April to 5 October 2028.',
  },
  {
    date: '2029-01-31',
    kind: 'final',
    title: 'MTD Tax Return & payment deadline (2027/28)',
    desc: 'Deadline to submit your MTD Tax Return and pay your income tax for 2027/28.',
    highlight: true,
    isFinal: true,
  },
];

/** Midnight UTC on the given ISO date. Deadlines are whole days, so comparing
 *  at day granularity avoids a deadline "expiring" mid-morning because the
 *  server clock is ahead of the visitor's. */
function startOfDay(value: string | Date): number {
  const d = typeof value === 'string' ? new Date(`${value}T00:00:00Z`) : value;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Whole days from `now` until `date`. 0 means the deadline is today; the
 *  result is never negative for a deadline returned by `nextDeadline`. */
export function daysUntil(date: string, now: Date = new Date()): number {
  return Math.round((startOfDay(date) - startOfDay(now)) / 86_400_000);
}

/** The next deadline that has not yet passed. A deadline stays "next" for the
 *  whole of its own day — someone filing on the deadline itself should not be
 *  told the date has gone. Returns null once the table runs out, which the
 *  callers render as "no upcoming deadline" rather than a wrong date. */
export function nextDeadline(now: Date = new Date()): Deadline | null {
  const today = startOfDay(now);
  return MTD_DEADLINES.find(d => startOfDay(d.date) >= today) ?? null;
}

/** "7 November 2026" — the format used across the marketing pages.
 *
 *  next-intl's locale is the bare 'en', which Intl resolves to en-US and
 *  renders as "November 7, 2026". Every date on this site is a UK tax
 *  deadline, so plain English is pinned to en-GB; other locales keep their
 *  own conventions. */
export function formatDeadlineDate(date: string, locale = 'en-GB'): string {
  const resolved = locale === 'en' ? 'en-GB' : locale;
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(resolved, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Mandation rules — used by /mtd-checker.
//
// Whether MTD applies to you is decided by the *qualifying income* (gross
// self-employment + property income, before expenses) on the Self Assessment
// return for the tax year two years before the one you are being mandated in.
// Getting that lookback right is the whole value of the checker: most tools
// ask "what do you earn now?", which gives the wrong answer for anyone whose
// income has changed.
// ─────────────────────────────────────────────────────────────────────────

export type MandationBand = {
  /** Qualifying income must be strictly greater than this to be mandated. */
  threshold: number;
  /** Tax year whose return is assessed, e.g. '2024/25'. */
  assessedTaxYear: string;
  /** First day MTD applies. */
  startDate: string;
  /** Label for the tax year MTD starts in, e.g. '2026/27'. */
  startTaxYear: string;
};

export const MANDATION_BANDS: MandationBand[] = [
  { threshold: 50_000, assessedTaxYear: '2024/25', startDate: '2026-04-06', startTaxYear: '2026/27' },
  { threshold: 30_000, assessedTaxYear: '2025/26', startDate: '2027-04-06', startTaxYear: '2027/28' },
  { threshold: 20_000, assessedTaxYear: '2026/27', startDate: '2028-04-06', startTaxYear: '2028/29' },
];

export type MandationResult =
  | { mandated: true; band: MandationBand; firstQuarterlyDeadline: Deadline | null }
  | { mandated: false; reason: 'below-threshold' | 'no-qualifying-income' };

/**
 * Earliest band whose threshold the given qualifying income exceeds.
 *
 * `qualifyingIncome` is gross turnover plus gross rents — not profit. Someone
 * with £60,000 of turnover and £45,000 of costs is mandated from April 2026
 * even though they are nowhere near £50,000 of taxable profit, and that is the
 * single most common misunderstanding the checker exists to correct.
 */
export function checkMandation(
  qualifyingIncome: number,
  hasQualifyingIncome: boolean,
): MandationResult {
  if (!hasQualifyingIncome) return { mandated: false, reason: 'no-qualifying-income' };

  const band = MANDATION_BANDS.find(b => qualifyingIncome > b.threshold);
  if (!band) return { mandated: false, reason: 'below-threshold' };

  // The first quarterly update for someone mandated from 6 April YYYY covers
  // 6 April to 5 July and is due 7 August YYYY.
  //
  // Not "the next quarterly deadline after the start date": for the April 2027
  // band that would return 7 May 2027, which is the *fourth* update of the
  // 2026/27 year and belongs to someone who was already in MTD. Anchoring on
  // August of the start year picks the right one for every band.
  const startYear = band.startDate.slice(0, 4);
  const firstQuarterlyDeadline =
    MTD_DEADLINES.find(d => d.kind === 'quarterly' && d.date >= `${startYear}-08-01`) ?? null;

  return { mandated: true, band, firstQuarterlyDeadline };
}

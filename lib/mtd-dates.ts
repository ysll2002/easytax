// Single source of truth for MTD ITSA statutory dates.
//
// Why this file exists: the same deadlines were previously hardcoded in five
// places (the homepage hero countdown, the reminder cron, the timetable page,
// the Self Assessment landing page and the actions page) and four of them were
// wrong — they said the quarterly updates were due on the 5th of the month.
// They are due on the **7th**. The reminder cron was emailing that wrong date
// to every registered user, which is the kind of error a tax product cannot
// make: a user who trusts it could file late.
//
// HMRC rule (Making Tax Digital for Income Tax): a quarterly update is due one
// month and two days after the end of the quarterly period, i.e. the 7th of
// the month following quarter end. Standard quarterly periods run from 6 April.
//
//   Q1  6 Apr – 5 Jul   due 7 Aug
//   Q2  6 Jul – 5 Oct   due 7 Nov
//   Q3  6 Oct – 5 Jan   due 7 Feb
//   Q4  6 Jan – 5 Apr   due 7 May
//   Final declaration   due 31 Jan following the end of the tax year
//
// Note on what is submitted: the *periods* are the discrete quarters above,
// but each update reports cumulative year-to-date totals from 6 April. Copy
// that describes a quarter as "6 April to 5 October" is describing the
// cumulative figures, not a different period. Both framings are correct.
//
// Anything user-facing that states an MTD date should import from here rather
// than hardcoding, so a future rule change is a one-line edit.

export type QuarterKey = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface QuarterDeadline {
  key: QuarterKey;
  /** Tax year this quarter belongs to, as the starting calendar year. 2026 = 2026/27. */
  taxYearStart: number;
  /** Human label for the tax year, e.g. "2026/27". */
  taxYear: string;
  /** Start of the discrete quarterly period (inclusive). */
  periodStart: Date;
  /** End of the discrete quarterly period (inclusive). */
  periodEnd: Date;
  /** Statutory submission deadline — end of day UK time on the 7th. */
  deadline: Date;
  /** e.g. "6 Apr – 5 Jul 2026" */
  periodLabel: string;
  /** e.g. "7 August 2026" */
  deadlineLabel: string;
}

/** Income thresholds that bring a person into MTD ITSA, by the 6 April on
 *  which the threshold takes effect. Qualifying income = gross self-employment
 *  turnover + gross property income, before expenses. */
export const MTD_THRESHOLDS: ReadonlyArray<{ from: number; threshold: number }> = [
  { from: 2026, threshold: 50_000 },
  { from: 2027, threshold: 30_000 },
  { from: 2028, threshold: 20_000 },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** UTC date at the very end of the given day. Deadlines are "by" dates, so a
 *  submission at 23:59 on the deadline day is still on time. The UK is at most
 *  one hour off UTC, and HMRC's own guidance states the date rather than a
 *  time, so UTC end-of-day is the right granularity here. */
function endOfDayUtc(year: number, month1: number, day: number): Date {
  return new Date(Date.UTC(year, month1 - 1, day, 23, 59, 59, 999));
}

function startOfDayUtc(year: number, month1: number, day: number): Date {
  return new Date(Date.UTC(year, month1 - 1, day, 0, 0, 0, 0));
}

function fmtLong(d: Date): string {
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function fmtShort(d: Date): string {
  return `${d.getUTCDate()} ${SHORT_MONTHS[d.getUTCMonth()]}`;
}

/**
 * The four quarterly deadlines for the tax year beginning 6 April `taxYearStart`.
 *
 * Q3 and Q4 fall in the following calendar year, which is the detail the old
 * hardcoded tables kept getting wrong.
 */
export function quartersForTaxYear(taxYearStart: number): QuarterDeadline[] {
  const y = taxYearStart;
  const next = y + 1;
  const taxYear = `${y}/${String(next).slice(-2)}`;

  const spec: Array<{
    key: QuarterKey;
    start: [number, number, number];
    end: [number, number, number];
    due: [number, number, number];
  }> = [
    { key: 'Q1', start: [y, 4, 6],     end: [y, 7, 5],     due: [y, 8, 7] },
    { key: 'Q2', start: [y, 7, 6],     end: [y, 10, 5],    due: [y, 11, 7] },
    { key: 'Q3', start: [y, 10, 6],    end: [next, 1, 5],  due: [next, 2, 7] },
    { key: 'Q4', start: [next, 1, 6],  end: [next, 4, 5],  due: [next, 5, 7] },
  ];

  return spec.map(({ key, start, end, due }) => {
    const periodStart = startOfDayUtc(...start);
    const periodEnd   = endOfDayUtc(...end);
    const deadline    = endOfDayUtc(...due);
    return {
      key,
      taxYearStart: y,
      taxYear,
      periodStart,
      periodEnd,
      deadline,
      periodLabel: `${fmtShort(periodStart)} – ${fmtShort(periodEnd)} ${periodEnd.getUTCFullYear()}`,
      deadlineLabel: fmtLong(deadline),
    };
  });
}

/** Final declaration (replaces the Self Assessment return) for a tax year:
 *  31 January following the end of that tax year. 2026/27 → 31 Jan 2028. */
export function finalDeclarationFor(taxYearStart: number): { deadline: Date; deadlineLabel: string } {
  const deadline = endOfDayUtc(taxYearStart + 2, 1, 31);
  return { deadline, deadlineLabel: fmtLong(deadline) };
}

/** The tax year (as its starting calendar year) that `now` falls in.
 *  UK tax years run 6 April – 5 April. */
export function taxYearStartFor(now: Date = new Date()): number {
  const y = now.getUTCFullYear();
  const aprilSixth = startOfDayUtc(y, 4, 6);
  return now < aprilSixth ? y - 1 : y;
}

/**
 * The next quarterly deadline that has not yet passed, looking across the
 * current tax year and the one after it.
 *
 * Returns null only if called with a date beyond the range we generate, which
 * cannot happen in practice because the window rolls forward with `now`.
 */
export function nextQuarterDeadline(now: Date = new Date()): QuarterDeadline | null {
  const start = taxYearStartFor(now);
  const candidates = [
    ...quartersForTaxYear(start),
    ...quartersForTaxYear(start + 1),
  ];
  return candidates.find(q => q.deadline.getTime() >= now.getTime()) ?? null;
}

/** Whole days from `now` until `deadline`, floored at 0. A deadline later
 *  today counts as 0 days ("due today"), not 1. */
export function daysUntil(deadline: Date, now: Date = new Date()): number {
  const ms = deadline.getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.floor(ms / 86_400_000);
}

/** The qualifying-income threshold in force for a given tax year. */
export function thresholdForTaxYear(taxYearStart: number): number {
  let current = MTD_THRESHOLDS[0].threshold;
  for (const t of MTD_THRESHOLDS) {
    if (taxYearStart >= t.from) current = t.threshold;
  }
  return current;
}

/**
 * The first tax year in which someone with `qualifyingIncome` is mandated to
 * use MTD ITSA, or null if they are below every announced threshold.
 *
 * Thresholds step down over time, so someone on £35,000 is out of scope in
 * 2026/27 but in scope from 2027/28.
 */
export function firstMandatedTaxYear(qualifyingIncome: number): number | null {
  for (const t of MTD_THRESHOLDS) {
    if (qualifyingIncome > t.threshold) return t.from;
  }
  return null;
}

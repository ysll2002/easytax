import {
  quartersForTaxYear,
  taxYearStartFor,
  daysUntil,
  thresholdForTaxYear,
  MTD_THRESHOLDS,
  type QuarterDeadline,
} from './mtd-dates';

// Where we are *inside* the MTD ITSA mandate, right now.
//
// Why this exists: lib/mtd-dates knows when the deadlines are, but nothing knew
// whether they had happened yet. So every page on the site was written by hand
// in the future tense — "from April 2026 you'll need to keep digital records",
// "when April 2026 hits, your first quarterly window opens", "for now, you can
// still file directly on HMRC's website". All of that was true when it was
// written and none of it is true now: the mandate commenced on 6 April 2026,
// the first quarterly update was due on 7 August 2026, and the £50,000 cohort
// is already one filing into the cycle.
//
// Copy that describes a live legal obligation as a future one is worse than
// merely stale. It reads as an abandoned site to a visitor who is already in
// the regime, and in at least one place it gave advice ("you can still file on
// HMRC's website") that is now wrong for the very people we are selling to.
//
// The fix is to stop writing the tense by hand. Everything here is derived
// from the real dates in ./mtd-dates and the current clock, so the site cannot
// fall out of date again as each deadline passes — which it otherwise would,
// four times a year, for ever.

/** 6 April 2026: MTD ITSA commences for qualifying income above £50,000. */
export const MANDATE_START = new Date(Date.UTC(2026, 3, 6, 0, 0, 0, 0));

/**
 * September 2026: HMRC begins automatically signing up people whose 2024/25
 * return showed qualifying income above £50,000 and who have not signed up
 * themselves. Source: GOV.UK, "Find out if and when you need to use Making
 * Tax Digital for Income Tax".
 *
 * This is a live source of search demand — people are being enrolled into a
 * regime they did not opt into and are searching for what it means — and it is
 * the reason the phase is worth naming separately rather than lumping it in
 * with "live".
 */
export const AUTO_SIGNUP_START = new Date(Date.UTC(2026, 8, 1, 0, 0, 0, 0));

export type MandatePhase =
  /** Before 6 April 2026 — nobody is mandated yet. */
  | 'pre_mandate'
  /** Mandate running; HMRC is not yet auto-enrolling. */
  | 'live'
  /** Mandate running and HMRC is auto-enrolling the £50k cohort. */
  | 'live_auto_signup';

export interface MtdStatus {
  phase: MandatePhase;
  /** True from 6 April 2026 onward. The single boolean most copy needs. */
  isLive: boolean;
  /** True from September 2026 onward. */
  autoSignupHasStarted: boolean;
  /** Tax year we are inside, as its starting calendar year. 2026 = 2026/27. */
  taxYearStart: number;
  /** e.g. "2026/27". */
  taxYear: string;
  /** Qualifying-income threshold in force for the current tax year. */
  threshold: number;
  /** e.g. "£50,000". */
  thresholdLabel: string;
  /**
   * The quarter whose period is open today — the one you are currently keeping
   * records for. Null outside a tax year we generate, which cannot happen in
   * practice.
   */
  openQuarter: QuarterDeadline | null;
  /**
   * The quarter you must actually file next: the earliest whose submission
   * deadline has not passed. Usually the previous quarter, not the open one,
   * because a period ends on the 5th and is due on the 7th of the month after.
   */
  dueQuarter: QuarterDeadline | null;
  /** Whole days until `dueQuarter`'s deadline. 0 means "due today". */
  daysUntilDue: number | null;
  /** Quarterly deadlines already passed in the current tax year. */
  quartersElapsed: number;
}

function fmtGbp(n: number): string {
  return `£${n.toLocaleString('en-GB')}`;
}

/**
 * Resolve the mandate status for a given moment.
 *
 * `now` is injectable so this can be exercised across the whole timeline
 * without waiting for the calendar.
 */
export function getMtdStatus(now: Date = new Date()): MtdStatus {
  const isLive = now.getTime() >= MANDATE_START.getTime();
  const autoSignupHasStarted = now.getTime() >= AUTO_SIGNUP_START.getTime();

  const taxYearStart = taxYearStartFor(now);
  const taxYear = `${taxYearStart}/${String(taxYearStart + 1).slice(-2)}`;

  // Look across this tax year and the next, for the same reason
  // nextQuarterDeadline does: Q4 of a tax year is due in May of the following
  // one, so a date in April can need a quarter from either side.
  const candidates = [
    ...quartersForTaxYear(taxYearStart),
    ...quartersForTaxYear(taxYearStart + 1),
  ];

  const openQuarter =
    candidates.find(
      q =>
        now.getTime() >= q.periodStart.getTime() &&
        now.getTime() <= q.periodEnd.getTime(),
    ) ?? null;

  const dueQuarter =
    candidates.find(q => q.deadline.getTime() >= now.getTime()) ?? null;

  const quartersElapsed = quartersForTaxYear(taxYearStart).filter(
    q => q.deadline.getTime() < now.getTime(),
  ).length;

  const threshold = thresholdForTaxYear(taxYearStart);

  return {
    phase: !isLive ? 'pre_mandate' : autoSignupHasStarted ? 'live_auto_signup' : 'live',
    isLive,
    autoSignupHasStarted,
    taxYearStart,
    taxYear,
    threshold,
    thresholdLabel: fmtGbp(threshold),
    openQuarter,
    dueQuarter,
    daysUntilDue: dueQuarter ? daysUntil(dueQuarter.deadline, now) : null,
    quartersElapsed,
  };
}

/**
 * One sentence stating where the mandate stands, in the correct tense for the
 * date it is read on.
 *
 * Deliberately not marketing copy: this is the factual line the status bar and
 * the landing pages share, so they cannot disagree with each other.
 */
export function mandateSentence(status: MtdStatus = getMtdStatus()): string {
  if (!status.isLive) {
    return `Making Tax Digital for Income Tax starts on 6 April 2026 for sole traders and landlords with qualifying income over ${status.thresholdLabel}.`;
  }
  return `Making Tax Digital for Income Tax has been mandatory since 6 April 2026 for sole traders and landlords with qualifying income over ${status.thresholdLabel}.`;
}

/**
 * The short, urgent line for the status bar: what is due, and when.
 *
 * Returns null before the mandate starts, where there is no filing to count
 * down to and a countdown would be manufactured urgency.
 */
export function nextDeadlineSentence(status: MtdStatus = getMtdStatus()): string | null {
  if (!status.isLive || !status.dueQuarter || status.daysUntilDue === null) return null;

  const q = status.dueQuarter;
  const days = status.daysUntilDue;
  const when =
    days === 0 ? 'due today' : days === 1 ? 'due tomorrow' : `due in ${days} days`;

  return `Your ${q.taxYear} ${q.key} quarterly update (${q.periodLabel}) is ${when} — ${q.deadlineLabel}.`;
}

/** Thresholds that have not yet taken effect, for "you're next" copy. */
export function upcomingThresholds(status: MtdStatus = getMtdStatus()) {
  return MTD_THRESHOLDS.filter(t => t.from > status.taxYearStart).map(t => ({
    ...t,
    label: fmtGbp(t.threshold),
    taxYear: `${t.from}/${String(t.from + 1).slice(-2)}`,
  }));
}

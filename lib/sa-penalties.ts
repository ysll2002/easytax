// Single source of truth for Self Assessment late filing and late payment
// penalties (the "classic" SA penalty regime in FA 2009 Sch 55 and Sch 56).
//
// Scope and why it is drawn where it is:
//
//   * This models the penalties that apply to a Self Assessment return that is
//     filed and/or paid late. It does NOT model the points-based late
//     submission regime that replaces it for taxpayers mandated into Making
//     Tax Digital for Income Tax — that regime is keyed to quarterly updates,
//     not to a single annual return, and it works on penalty points rather
//     than fixed amounts. `isMtdMandatedYear` below flags the years where the
//     answer needs that caveat, and the page shows it.
//
//   * Interest is deliberately NOT modelled. HMRC's late payment interest rate
//     tracks the Bank of England base rate and changes several times a year, so
//     any figure hardcoded here would silently go stale and would be wrong in a
//     way the reader could not see. The tool states that interest is extra and
//     links to HMRC rather than guessing.
//
// Statutory rules encoded (online returns):
//
//   Filing, measured from the 31 January filing deadline:
//     immediately   £100, whether or not any tax is owed
//     3 months      £10 per day for up to 90 days (maximum £900)
//     6 months      the greater of £300 and 5% of the tax due
//     12 months     the greater of £300 and 5% of the tax due
//
//   Payment, measured from the same 31 January payment deadline:
//     30 days       5% of the tax unpaid at that date
//     6 months      a further 5% of the tax unpaid at that date
//     12 months     a further 5% of the tax unpaid at that date
//
// Each band is cumulative: someone twelve months late owes the earlier bands
// too. The daily penalty is the only one that scales with elapsed time.
//
// IMPORTANT: figures above were last reviewed against HMRC guidance on the
// date in RULES_REVIEWED. They are long-standing statutory amounts rather than
// rates that drift, but anything user-facing quotes that date so a reader can
// judge how fresh it is.

/** Last date a human checked these figures against HMRC's published guidance. */
export const RULES_REVIEWED = '5 September 2026';

export const HMRC_PENALTIES_URL = 'https://www.gov.uk/self-assessment-tax-returns/penalties';

export const FIXED_FILING_PENALTY = 100;
export const DAILY_RATE = 10;
export const DAILY_MAX_DAYS = 90;
export const DAILY_MAX = DAILY_RATE * DAILY_MAX_DAYS; // £900
export const TAX_GEARED_MINIMUM = 300;
export const TAX_GEARED_RATE = 0.05;
export const LATE_PAYMENT_RATE = 0.05;

/** First tax year for which MTD for Income Tax was mandated (income > £50k). */
const FIRST_MTD_YEAR = 2026;

export interface PenaltyLine {
  /** Stable key, also used as the React list key. */
  key: string;
  /** What triggered it, e.g. "6 months late". */
  label: string;
  /** The date on or after which this penalty bites. */
  from: Date;
  /** Human form of `from`, e.g. "1 August 2027". */
  fromLabel: string;
  /** Amount in whole pounds. */
  amount: number;
  /** One sentence explaining how the amount was arrived at. */
  basis: string;
}

export interface PenaltyResult {
  /** The 31 January the return and payment were both due. */
  deadline: Date;
  deadlineLabel: string;
  /** True when nothing is late at all. */
  onTime: boolean;
  filing: PenaltyLine[];
  payment: PenaltyLine[];
  filingTotal: number;
  paymentTotal: number;
  total: number;
  /** Days the return was late (0 when on time). */
  daysLateFiling: number;
  /** Set when the tax year is one where MTD penalties may apply instead. */
  mtdCaveat: boolean;
}

const MS_PER_DAY = 86_400_000;

/** UTC midnight for a Y/M/D, so arithmetic never crosses a DST boundary. */
function utc(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day));
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * MS_PER_DAY);
}

/** Whole days from `a` to `b`, floored at 0. */
function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / MS_PER_DAY));
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Strip a Date down to UTC midnight, so a time-of-day never changes the answer. */
export function atMidnight(d: Date): Date {
  return utc(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Label for a tax year given its starting calendar year. 2025 -> "2025/26". */
export function taxYearLabel(startYear: number): string {
  return `${startYear}/${String(startYear + 1).slice(-2)}`;
}

/** The 31 January by which an online return for `startYear` must be filed and
 *  the tax paid. The 2025/26 year ends 5 April 2026 and is due 31 January 2027. */
export function filingDeadlineFor(startYear: number): Date {
  return utc(startYear + 2, 0, 31);
}

/** Tax years mandated into MTD for Income Tax, where the points-based regime
 *  may apply to quarterly updates instead of these penalties. */
export function isMtdMandatedYear(startYear: number): boolean {
  return startYear >= FIRST_MTD_YEAR;
}

/** Tax years worth offering in the picker: the most recent completed year and
 *  the few before it, newest first. A year only becomes answerable once it has
 *  ended on 5 April. */
export function selectableTaxYears(today: Date = new Date(), count = 4): number[] {
  // The 2025/26 year ends 5 April 2026; before that date the latest completed
  // year is still 2024/25.
  const y = today.getUTCFullYear();
  const endedThisCalendarYear = today >= utc(y, 3, 6); // on/after 6 April
  const latestStart = endedThisCalendarYear ? y - 1 : y - 2;
  return Array.from({ length: count }, (_, i) => latestStart - i);
}

function taxGeared(taxDue: number): number {
  return Math.max(TAX_GEARED_MINIMUM, Math.round(taxDue * TAX_GEARED_RATE));
}

/**
 * Work out every penalty band triggered by filing on `filingDate` and paying
 * on `paymentDate`, for the Self Assessment year starting `taxYearStart`.
 *
 * `taxDue` is the balancing payment owed for that year. It drives the
 * tax-geared bands; the £100 and daily penalties apply regardless.
 * Pass `paymentDate = null` when the tax was paid on time (or nothing is owed),
 * which suppresses the late payment bands entirely.
 */
export function calculatePenalties({
  taxYearStart,
  filingDate,
  paymentDate,
  taxDue,
}: {
  taxYearStart: number;
  filingDate: Date;
  paymentDate: Date | null;
  taxDue: number;
}): PenaltyResult {
  const deadline = filingDeadlineFor(taxYearStart);
  const filed = atMidnight(filingDate);
  const paid = paymentDate ? atMidnight(paymentDate) : null;
  const owed = Math.max(0, Math.round(taxDue));

  const filing: PenaltyLine[] = [];
  const payment: PenaltyLine[] = [];

  // ── Filing ────────────────────────────────────────────────────────────────
  // Anything after 31 January is late; filing ON the deadline is on time.
  if (filed > deadline) {
    filing.push({
      key: 'fixed',
      label: 'Missed the deadline',
      from: addDays(deadline, 1),
      fromLabel: formatDate(addDays(deadline, 1)),
      amount: FIXED_FILING_PENALTY,
      basis: 'A flat £100, charged as soon as the return is a day late — even if you owe no tax or are due a refund.',
    });

    // 3 months late. The three-month point after 31 January is 30 April, so
    // daily penalties run from 1 May and stop after 90 of them.
    const dailyStart = utc(deadline.getUTCFullYear(), 4, 1); // 1 May
    if (filed >= dailyStart) {
      const days = Math.min(daysBetween(addDays(dailyStart, -1), filed), DAILY_MAX_DAYS);
      filing.push({
        key: 'daily',
        label: '3 months late',
        from: dailyStart,
        fromLabel: formatDate(dailyStart),
        amount: days * DAILY_RATE,
        basis: `£10 for each day the return is outstanding from 1 May, capped at 90 days. ${days} ${
          days === 1 ? 'day' : 'days'
        } counted${days === DAILY_MAX_DAYS ? ' — the maximum' : ''}.`,
      });
    }

    // 6 months late — 31 July, so the penalty applies from 1 August.
    const sixMonths = utc(deadline.getUTCFullYear(), 7, 1); // 1 August
    if (filed >= sixMonths) {
      filing.push({
        key: 'six',
        label: '6 months late',
        from: sixMonths,
        fromLabel: formatDate(sixMonths),
        amount: taxGeared(owed),
        basis: `The greater of £300 and 5% of the £${owed.toLocaleString('en-GB')} tax due.`,
      });
    }

    // 12 months late — the following 1 February.
    const twelveMonths = utc(deadline.getUTCFullYear() + 1, 1, 1); // 1 February
    if (filed >= twelveMonths) {
      filing.push({
        key: 'twelve',
        label: '12 months late',
        from: twelveMonths,
        fromLabel: formatDate(twelveMonths),
        amount: taxGeared(owed),
        basis: `A second charge of the greater of £300 and 5% of the tax due. HMRC can charge more where it decides information was withheld deliberately.`,
      });
    }
  }

  // ── Payment ───────────────────────────────────────────────────────────────
  // Only meaningful when there is tax outstanding.
  if (paid && paid > deadline && owed > 0) {
    const thirtyDays = addDays(deadline, 30);
    if (paid > thirtyDays) {
      payment.push({
        key: 'pay30',
        label: '30 days late',
        from: addDays(thirtyDays, 1),
        fromLabel: formatDate(addDays(thirtyDays, 1)),
        amount: Math.round(owed * LATE_PAYMENT_RATE),
        basis: `5% of the £${owed.toLocaleString('en-GB')} still unpaid 30 days after the deadline.`,
      });
    }

    const sixMonthsPay = utc(deadline.getUTCFullYear(), 6, 31); // 31 July
    if (paid > sixMonthsPay) {
      payment.push({
        key: 'pay6',
        label: '6 months late',
        from: addDays(sixMonthsPay, 1),
        fromLabel: formatDate(addDays(sixMonthsPay, 1)),
        amount: Math.round(owed * LATE_PAYMENT_RATE),
        basis: 'A further 5% of the tax still unpaid at six months.',
      });
    }

    const twelveMonthsPay = utc(deadline.getUTCFullYear() + 1, 0, 31); // 31 January
    if (paid > twelveMonthsPay) {
      payment.push({
        key: 'pay12',
        label: '12 months late',
        from: addDays(twelveMonthsPay, 1),
        fromLabel: formatDate(addDays(twelveMonthsPay, 1)),
        amount: Math.round(owed * LATE_PAYMENT_RATE),
        basis: 'A further 5% of the tax still unpaid at twelve months.',
      });
    }
  }

  const filingTotal = filing.reduce((s, l) => s + l.amount, 0);
  const paymentTotal = payment.reduce((s, l) => s + l.amount, 0);

  return {
    deadline,
    deadlineLabel: formatDate(deadline),
    onTime: filing.length === 0 && payment.length === 0,
    filing,
    payment,
    filingTotal,
    paymentTotal,
    total: filingTotal + paymentTotal,
    daysLateFiling: filed > deadline ? daysBetween(deadline, filed) : 0,
    mtdCaveat: isMtdMandatedYear(taxYearStart),
  };
}

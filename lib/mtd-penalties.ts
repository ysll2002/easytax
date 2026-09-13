import { taxYearStartFor } from '@/lib/mtd-dates';

// What actually happens when an MTD for Income Tax obligation is missed.
//
// This is the highest-demand thing on lib/search-queries.ts that the archive
// has never answered — "i missed my mtd quarterly update deadline what
// happens" and "making tax digital penalty points how do they work" are both
// priority 1 in the `mtd-penalties` cluster, and coverage() says neither is
// covered by any of the 113 published articles.
//
// It is also, right now, the one MTD question where the widely-repeated answer
// is wrong. Search it today and most results explain the points system and the
// £200 charge as though it applies. For a missed *quarterly update* in 2026/27
// it does not: HMRC is running a first-year soft landing and will not issue
// penalty points for late quarterly updates for that year. The person typing
// that query at midnight has just been told by four other sites that they owe
// something they do not.
//
// Three distinctions do the work here, and getting them muddled is how the
// wrong answer spreads:
//
//   1. **Quarterly update ≠ tax return.** The 2026/27 soft landing covers late
//      quarterly updates only. Penalty points still apply to a late return for
//      the same year.
//   2. **Late submission ≠ late payment.** Nothing about the soft landing
//      touches paying. Late payment penalties and late payment interest run
//      from the ordinary due date in the ordinary way, first year or not.
//   3. **It expires.** From 6 April 2027 the points regime applies to
//      quarterly updates too, and the late payment percentages rise. A page
//      that hardcodes "there is no penalty" is correct for about seven months
//      and then becomes the wrong answer it was written to correct.
//
// So the rules live here as data keyed by tax year, and every page reads them
// through `penaltyRegimeFor()`. The soft landing switches itself off.
//
// Sources (checked 2026-09-13):
//   - GOV.UK, "Penalties for Making Tax Digital for Income Tax"
//   - GOV.UK, "Use Making Tax Digital for Income Tax: send quarterly updates"
//   - LITRG, "Making Tax Digital penalties"
//   - ICAEW, "MTD for income tax penalties"

/** The first tax year of MTD ITSA mandation, and the year of the soft landing
 *  on late quarterly updates. 2026 = 2026/27. */
export const SOFT_LANDING_TAX_YEAR = 2026;

/** The tax year from which the points regime covers quarterly updates and the
 *  late payment percentages step up. 2027 = 2027/28. */
export const FULL_REGIME_TAX_YEAR = 2027;

export interface LateSubmissionRules {
  /** Whether a late *quarterly update* earns a penalty point in this year. */
  quarterlyUpdatesEarnPoints: boolean;
  /** Whether a late *tax return* earns a penalty point in this year. Yes in
   *  every year, including the soft-landing one — this is the distinction the
   *  rest of the internet keeps dropping. */
  taxReturnEarnsPoints: boolean;
  /** Points needed before a charge is issued. Four for a quarterly filing
   *  frequency. */
  pointsThreshold: number;
  /** The charge on reaching the threshold, and on every later miss. */
  chargeAtThresholdGbp: number;
}

export interface LatePaymentRules {
  /** Days after the due date before the first penalty bites.
   *
   *  Modelled per tax year, which is an approximation worth naming: the longer
   *  run-up is a concession for a taxpayer's *first year inside MTD*, not a
   *  property of the 2026/27 calendar. For this page's audience the two
   *  coincide, because everyone mandated in 2026/27 is in their first year. It
   *  stops coinciding for the 2027 and 2028 threshold cohorts, so the page says
   *  "your first year" in words rather than implying a fixed date. */
  firstPenaltyAfterDays: number;
  /** Percentage of the balance outstanding at that day. */
  firstPenaltyPct: number;
  /** A further charge on anything still outstanding at this day, or null where
   *  the grace period already runs to it and there is no separate second step
   *  to describe. Reported as null rather than as a duplicate of the first
   *  charge: two charges on the same day is not what happens. */
  secondPenaltyAtDay: number | null;
  secondPenaltyPct: number | null;
  /** Once both fixed charges are past, a further penalty accrues daily at this
   *  annualised rate until the balance is cleared. */
  dailyPenaltyAnnualPct: number;
}

export interface PenaltyRegime {
  taxYearStart: number;
  taxYear: string;
  isSoftLandingYear: boolean;
  lateSubmission: LateSubmissionRules;
  latePayment: LatePaymentRules;
}

function label(taxYearStart: number): string {
  return `${taxYearStart}/${String(taxYearStart + 1).slice(-2)}`;
}

/**
 * The rules in force for a given tax year.
 *
 * Years before the soft landing are not modelled — MTD ITSA did not exist for
 * them — and years after 2027/28 inherit the 2027/28 rules, which is the right
 * default for an unannounced future: it never under-states what someone might
 * owe. If HMRC changes the percentages again, this is the one function to edit.
 */
export function penaltyRegimeFor(taxYearStart: number): PenaltyRegime {
  const soft = taxYearStart <= SOFT_LANDING_TAX_YEAR;

  return {
    taxYearStart,
    taxYear: label(taxYearStart),
    isSoftLandingYear: soft,
    lateSubmission: {
      quarterlyUpdatesEarnPoints: !soft,
      taxReturnEarnsPoints: true,
      pointsThreshold: 4,
      chargeAtThresholdGbp: 200,
    },
    latePayment: soft
      ? {
          // A taxpayer's first year inside MTD carries a longer run-up before
          // the first charge — 30 days rather than 15. Because that run-up
          // already reaches the day the second charge would otherwise fall,
          // there is no distinct second step left to describe, so it is null
          // rather than a 3% repeated on the same date.
          firstPenaltyAfterDays: 30,
          firstPenaltyPct: 3,
          secondPenaltyAtDay: null,
          secondPenaltyPct: null,
          dailyPenaltyAnnualPct: 10,
        }
      : {
          firstPenaltyAfterDays: 15,
          firstPenaltyPct: taxYearStart >= FULL_REGIME_TAX_YEAR ? 4 : 3,
          secondPenaltyAtDay: 30,
          secondPenaltyPct: taxYearStart >= FULL_REGIME_TAX_YEAR ? 4 : 3,
          dailyPenaltyAnnualPct: 10,
        },
  };
}

/** The regime in force for the tax year we are currently in. */
export function currentPenaltyRegime(now: Date = new Date()): PenaltyRegime {
  return penaltyRegimeFor(taxYearStartFor(now));
}

/**
 * The answer to "I missed a quarterly update — what happens?", in one
 * sentence, for the year in question.
 *
 * Returned as a string rather than rendered inline because it is the page's
 * featured-snippet candidate: a direct answer in the first forty words is the
 * only realistic way this domain appears above GOV.UK on a long-tail query,
 * and it needs to read identically wherever it is used.
 */
export function missedUpdateAnswer(regime: PenaltyRegime): string {
  if (!regime.lateSubmission.quarterlyUpdatesEarnPoints) {
    return (
      `Nothing, in penalty terms. HMRC is not charging late submission penalties for missed ` +
      `quarterly updates in the ${regime.taxYear} tax year. Send the update as soon as you can — ` +
      `you cannot file your tax return until every quarterly update for the year is in — but a ` +
      `late one this year does not earn you a penalty point or a fine.`
    );
  }
  return (
    `You get one penalty point. Points are charged per missed deadline, and at ` +
    `${regime.lateSubmission.pointsThreshold} points HMRC issues a ` +
    `£${regime.lateSubmission.chargeAtThresholdGbp} penalty, plus another ` +
    `£${regime.lateSubmission.chargeAtThresholdGbp} for every further deadline you miss after that. ` +
    `Send the update as soon as you can.`
  );
}

/** Late payment is the part the soft landing does not touch, and the part
 *  people are least likely to have separated from filing. */
export function latePaymentSentence(regime: PenaltyRegime): string {
  const p = regime.latePayment;

  const opening = regime.isSoftLandingYear
    ? `Paying late is charged separately from filing late, and the ${regime.taxYear} soft landing does not cover it.`
    : `Paying late is charged separately from filing late.`;

  const grace =
    ` Nothing is charged if you pay within ${p.firstPenaltyAfterDays} days of the due date` +
    (regime.isSoftLandingYear ? ' — that longer run-up is a first-year concession and drops to 15 days after it' : '') +
    `. After that the first penalty is ${p.firstPenaltyPct}% of what is still outstanding.`;

  const second =
    p.secondPenaltyAtDay !== null && p.secondPenaltyPct !== null
      ? ` A further ${p.secondPenaltyPct}% is added on anything still unpaid at day ${p.secondPenaltyAtDay}.`
      : '';

  return (
    opening +
    grace +
    second +
    ` Beyond that a further penalty builds up daily at an annualised ${p.dailyPenaltyAnnualPct}% until the` +
    ` balance is cleared, and late payment interest runs on top of all of it from the due date itself.`
  );
}

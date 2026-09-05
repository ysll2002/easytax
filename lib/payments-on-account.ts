// Payments on account for Self Assessment.
//
// This is the single most misunderstood part of a UK tax bill: the first year
// someone crosses the threshold, their 31 January payment is not the tax they
// owe — it is that tax *plus half of it again* as the first payment towards
// next year. People budget for the bill they were shown and are then short by
// 50% of it. Modelling it properly is the whole point of the tool.
//
// Rules encoded (HMRC, Self Assessment):
//
//   * Payments on account are required unless either
//       - the tax owed through Self Assessment for the year is under £1,000, or
//       - more than 80% of the tax owed for the year was already collected at
//         source (PAYE coding, CIS deductions, tax deducted from savings).
//   * Each payment on account is 50% of the previous year's Self Assessment
//     liability. Two of them: due 31 January during the tax year, and 31 July
//     after it.
//   * Capital Gains Tax and Student Loan repayments are collected through Self
//     Assessment but are excluded from the payment-on-account calculation, so
//     they fall due in full with the balancing payment.
//   * The balancing payment for a year is that year's liability less the two
//     payments on account already made, due the following 31 January — the
//     same date as the first payment on account for the year after. A refund
//     arises instead where the payments on account overshot.
//
// Amounts here are arithmetic on statutory percentages rather than rates that
// drift, but RULES_REVIEWED still records when a human last checked them.

export const RULES_REVIEWED = '5 September 2026';

export const HMRC_POA_URL = 'https://www.gov.uk/understand-self-assessment-bill/payments-on-account';

/** Below this Self Assessment liability, no payments on account are due. */
export const POA_THRESHOLD = 1000;

/** Above this share collected at source, no payments on account are due. */
export const DEDUCTED_AT_SOURCE_LIMIT = 0.8;

export const POA_SHARE = 0.5;

export type ExemptionReason = 'under_threshold' | 'mostly_deducted_at_source' | null;

export interface ScheduleEntry {
  key: string;
  /** e.g. "First payment on account". */
  label: string;
  due: Date;
  dueLabel: string;
  amount: number;
  /** One sentence saying what this entry is. */
  note: string;
}

export interface PoaResult {
  /** Tax year the liability belongs to, as its starting calendar year. */
  taxYearStart: number;
  taxYearLabel: string;
  /** Self Assessment liability for the year, excluding CGT and student loan. */
  liabilityForPoa: number;
  /** Total owed for the year including the excluded items. */
  totalLiability: number;
  /** True when payments on account are due for the FOLLOWING year. */
  poaRequired: boolean;
  exemptionReason: ExemptionReason;
  /** Each payment on account towards the following year (0 when not required). */
  paymentOnAccount: number;
  /** Balancing payment for this year after last year's payments on account.
   *  Negative means HMRC owes a refund. */
  balancingPayment: number;
  /** What actually leaves the bank account, in date order. */
  schedule: ScheduleEntry[];
  /** The single figure people get wrong: total due on the next 31 January. */
  dueNextJanuary: number;
  firstPoaDue: Date;
  secondPoaDue: Date;
}

function utc(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day));
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function taxYearLabel(startYear: number): string {
  return `${startYear}/${String(startYear + 1).slice(-2)}`;
}

/** Round to whole pounds. HMRC works to the penny but a planning tool that
 *  shows pence invites the reader to treat it as an assessment. */
function gbp(n: number): number {
  return Math.round(n);
}

/**
 * Model the payment schedule that follows from a Self Assessment liability.
 *
 * `liability`        — income tax + Class 4 NIC for the year, before deducting
 *                      payments on account already made.
 * `deductedAtSource` — tax already collected via PAYE, CIS etc. for that year.
 * `cgtAndStudentLoan`— amounts collected through Self Assessment but excluded
 *                      from the payment-on-account calculation.
 * `poaAlreadyMade`   — the two payments on account made towards this year, if
 *                      any, which reduce the balancing payment.
 */
export function calculatePaymentsOnAccount({
  taxYearStart,
  liability,
  deductedAtSource = 0,
  cgtAndStudentLoan = 0,
  poaAlreadyMade = 0,
}: {
  taxYearStart: number;
  liability: number;
  deductedAtSource?: number;
  cgtAndStudentLoan?: number;
  poaAlreadyMade?: number;
}): PoaResult {
  const liabilityForPoa = Math.max(0, liability);
  const excluded = Math.max(0, cgtAndStudentLoan);
  const totalLiability = liabilityForPoa + excluded;
  const source = Math.max(0, deductedAtSource);

  // The 80% test compares tax collected at source with the total tax for the
  // year, so the denominator includes what was deducted as well as what is
  // still owed through Self Assessment.
  const totalTaxForYear = liabilityForPoa + source;
  const sourceShare = totalTaxForYear > 0 ? source / totalTaxForYear : 0;

  let exemptionReason: ExemptionReason = null;
  if (liabilityForPoa < POA_THRESHOLD) exemptionReason = 'under_threshold';
  else if (sourceShare > DEDUCTED_AT_SOURCE_LIMIT) exemptionReason = 'mostly_deducted_at_source';

  const poaRequired = exemptionReason === null;
  const paymentOnAccount = poaRequired ? gbp(liabilityForPoa * POA_SHARE) : 0;

  const balancingPayment = gbp(totalLiability - Math.max(0, poaAlreadyMade));

  // The liability for the year ending 5 April (taxYearStart + 1) is settled on
  // 31 January of (taxYearStart + 2), alongside the first payment on account
  // for the year that is by then already running.
  const balancingDue = utc(taxYearStart + 2, 0, 31);
  const firstPoaDue = balancingDue;
  const secondPoaDue = utc(taxYearStart + 2, 6, 31);

  const nextYear = taxYearLabel(taxYearStart + 1);

  const schedule: ScheduleEntry[] = [
    {
      key: 'balancing',
      label: balancingPayment >= 0 ? 'Balancing payment' : 'Refund due to you',
      due: balancingDue,
      dueLabel: formatDate(balancingDue),
      amount: balancingPayment,
      note:
        poaAlreadyMade > 0
          ? `Your ${taxYearLabel(taxYearStart)} bill of £${totalLiability.toLocaleString(
              'en-GB',
            )} less the £${gbp(poaAlreadyMade).toLocaleString('en-GB')} you already paid on account.`
          : `The whole ${taxYearLabel(taxYearStart)} bill, as you made no payments on account towards it.`,
    },
  ];

  if (poaRequired) {
    schedule.push(
      {
        key: 'poa1',
        label: 'First payment on account',
        due: firstPoaDue,
        dueLabel: formatDate(firstPoaDue),
        amount: paymentOnAccount,
        note: `Half of your ${taxYearLabel(taxYearStart)} liability, paid in advance towards ${nextYear}. Due the same day as the balancing payment.`,
      },
      {
        key: 'poa2',
        label: 'Second payment on account',
        due: secondPoaDue,
        dueLabel: formatDate(secondPoaDue),
        amount: paymentOnAccount,
        note: `The other half, towards the same ${nextYear} bill.`,
      },
    );
  }

  return {
    taxYearStart,
    taxYearLabel: taxYearLabel(taxYearStart),
    liabilityForPoa,
    totalLiability,
    poaRequired,
    exemptionReason,
    paymentOnAccount,
    balancingPayment,
    schedule,
    dueNextJanuary: balancingPayment + paymentOnAccount,
    firstPoaDue,
    secondPoaDue,
  };
}

/** Tax years worth offering in the picker, newest completed year first. */
export function selectableTaxYears(today: Date = new Date(), count = 4): number[] {
  const y = today.getUTCFullYear();
  const endedThisCalendarYear = today >= utc(y, 3, 6); // on/after 6 April
  const latestStart = endedThisCalendarYear ? y - 1 : y - 2;
  return Array.from({ length: count }, (_, i) => latestStart - i);
}

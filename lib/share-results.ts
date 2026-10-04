import {
  calculatePenalties,
  filingDeadlineFor,
  formatDate,
  selectableTaxYears as penaltyYears,
  taxYearLabel,
} from './sa-penalties';
import {
  calculatePaymentsOnAccount,
  selectableTaxYears as poaYears,
} from './payments-on-account';
import {
  firstMandatedTaxYear,
  quartersForTaxYear,
  finalDeclarationFor,
  MTD_THRESHOLDS,
} from './mtd-dates';

// Calculator answers, as links.
//
// The three free calculators are the pages most likely to earn a link from
// outside — they answer a question a stranger is actively asking, for free,
// with no email gate. But their answers lived entirely in React state, so
// there was no way to *point at one*. Someone helping a friend in a forum
// thread could link the tool and say "put your numbers in"; they could not
// link the answer.
//
// This module is the encoding that makes the answer addressable, and it is
// deliberately the only place that encoding exists. The calculator builds the
// link from it, `generateMetadata` reads the link from it, and the Open Graph
// route renders the card from it — so a shared link's preview cannot say a
// different number from the page it opens.
//
// Two rules hold throughout:
//
//  1. **Nothing here trusts its input.** Every parameter is bounds-checked and
//     re-derived through the same calculation library the page uses. The card
//     therefore renders numbers we computed, never a string somebody put in a
//     query parameter — which is what stops the branded card being usable as a
//     free "make EasyTax say anything" image generator.
//  2. **The figures are never written to the address bar on their own.** These
//     params carry someone's tax position. They appear in a URL only when the
//     reader explicitly asks to copy or share the link; a calculation that is
//     merely performed leaves no trace in history, in `Referer` headers, or in
//     our logs.

/** Next hands a page's search params as a record whose values may be arrays.
 *  The decoders want a flat `URLSearchParams`. A repeated key keeps only its
 *  first value: a shared link never has one, and a hand-edited link does not
 *  get to choose which value the card and the page each read — which is how
 *  the two would end up disagreeing. */
export function toSearchParams(
  sp: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const first = Array.isArray(v) ? v[0] : v;
    if (typeof first === 'string') p.set(k, first);
  }
  return p;
}

/** Upper bounds. Anything past these is a typo or an attempt to make the card
 *  render an absurd headline, and both deserve the same answer: reject. */
const MAX_MONEY = 10_000_000;
const MAX_INCOME = 100_000_000;

function money(v: string | null | undefined, max = MAX_MONEY): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > max) return null;
  return Math.round(n * 100) / 100;
}

function isoDate(v: string | null | undefined): Date | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  // A filing date centuries away produces a meaningless daily-penalty count
  // and a nonsense card. Keep it inside the range the tool is about.
  const year = d.getUTCFullYear();
  if (year < 2015 || year > 2100) return null;
  return d;
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** What a card needs: the copy, and the one number worth setting large. */
export interface ShareCard {
  eyebrow: string;
  title: string;
  subtitle: string;
  figure?: { value: string; caption: string };
  /** The page `<title>` and OG title for a shared link. Deliberately without a
   *  " | EasyTax" suffix: the root layout's title template appends one, and a
   *  title that carries its own comes out as "… | EasyTax | EasyTax". */
  metaTitle: string;
  /** Used verbatim as the meta description. */
  metaDescription: string;
}

function gbp(n: number): string {
  return `£${Math.round(Math.abs(n)).toLocaleString('en-GB')}`;
}

/* ------------------------------------------------------------------ *
 * Late filing penalty
 * ------------------------------------------------------------------ */

export interface PenaltyShare {
  taxYearStart: number;
  filingDate: Date;
  taxDue: number;
  unpaid: boolean;
}

export function encodePenalty(s: PenaltyShare): string {
  const p = new URLSearchParams({
    ty: String(s.taxYearStart),
    fd: toIso(s.filingDate),
    td: String(s.taxDue),
    up: s.unpaid ? '1' : '0',
  });
  return p.toString();
}

export function decodePenalty(sp: URLSearchParams): PenaltyShare | null {
  const ty = Number(sp.get('ty'));
  // Only the years the tool itself offers. A link to 1998 would render a card
  // about a return that cannot be filed.
  if (!penaltyYears().includes(ty)) return null;

  const filingDate = isoDate(sp.get('fd'));
  const taxDue = money(sp.get('td'));
  if (!filingDate || taxDue === null) return null;

  return { taxYearStart: ty, filingDate, taxDue, unpaid: sp.get('up') === '1' };
}

export function penaltyCard(s: PenaltyShare): ShareCard {
  const r = calculatePenalties({
    taxYearStart: s.taxYearStart,
    filingDate: s.filingDate,
    paymentDate: s.unpaid ? s.filingDate : null,
    taxDue: s.taxDue,
  });
  const year = taxYearLabel(s.taxYearStart);
  const deadline = formatDate(filingDeadlineFor(s.taxYearStart));

  if (r.onTime) {
    return {
      eyebrow: 'Late filing penalty calculator',
      title: `Nothing is late — no penalty for ${year}`,
      subtitle: `Filed by ${deadline}, so none of HMRC's late filing or late payment charges apply.`,
      figure: { value: '£0', caption: 'HMRC penalties' },
      metaTitle: `No late filing penalty for ${year}`,
      metaDescription: `Filed on time for ${year} — HMRC's £100 fixed penalty, daily charges and late payment charges do not apply. Check your own position free.`,
    };
  }

  const days = r.daysLateFiling;
  return {
    eyebrow: 'Late filing penalty calculator',
    title: `${gbp(r.total)} in HMRC penalties, ${days} ${days === 1 ? 'day' : 'days'} late`,
    subtitle: `A ${year} return filed on ${formatDate(s.filingDate)} instead of ${deadline}${s.unpaid ? ', with the tax still unpaid' : ''}. Itemised, with the date each charge starts.`,
    figure: { value: gbp(r.total), caption: `${days} days late` },
    metaTitle: `${gbp(r.total)} penalty for a ${year} return filed ${days} days late`,
    metaDescription: `HMRC's charges on a ${year} Self Assessment return filed ${days} days late come to ${gbp(r.total)} — the £100 fixed penalty, daily charges and late payment interest, itemised. Work out your own, free.`,
  };
}

/* ------------------------------------------------------------------ *
 * Payments on account
 * ------------------------------------------------------------------ */

export interface PoaShare {
  taxYearStart: number;
  liability: number;
  deductedAtSource: number;
  poaAlreadyMade: number;
}

export function encodePoa(s: PoaShare): string {
  return new URLSearchParams({
    ty: String(s.taxYearStart),
    li: String(s.liability),
    ds: String(s.deductedAtSource),
    pa: String(s.poaAlreadyMade),
  }).toString();
}

export function decodePoa(sp: URLSearchParams): PoaShare | null {
  const ty = Number(sp.get('ty'));
  if (!poaYears().includes(ty)) return null;

  const liability = money(sp.get('li'));
  // Absent is legitimately zero for these two; malformed is not.
  const deductedAtSource = sp.get('ds') === null ? 0 : money(sp.get('ds'));
  const poaAlreadyMade = sp.get('pa') === null ? 0 : money(sp.get('pa'));

  if (liability === null || liability <= 0) return null;
  if (deductedAtSource === null || poaAlreadyMade === null) return null;

  return { taxYearStart: ty, liability, deductedAtSource, poaAlreadyMade };
}

export function poaCard(s: PoaShare): ShareCard {
  const r = calculatePaymentsOnAccount({
    taxYearStart: s.taxYearStart,
    liability: s.liability,
    deductedAtSource: s.deductedAtSource,
    poaAlreadyMade: s.poaAlreadyMade,
  });
  const year = taxYearLabel(s.taxYearStart);

  // The whole point of the tool: what actually leaves the account in January,
  // which is the balancing payment plus the first advance instalment. The
  // library already names that figure — deriving it a second time here is how
  // a card ends up disagreeing with the page it links to.
  const januaryTotal = r.dueNextJanuary;

  if (!r.poaRequired) {
    return {
      eyebrow: 'Payments on account calculator',
      title: `${gbp(januaryTotal)} due in January — no payments on account`,
      subtitle: `A ${year} liability of ${gbp(s.liability)} does not trigger HMRC's advance instalments, so January is the tax bill and nothing on top.`,
      figure: { value: gbp(januaryTotal), caption: 'due in January' },
      metaTitle: `${gbp(januaryTotal)} due in January for ${year}`,
      metaDescription: `A ${year} Self Assessment liability of ${gbp(s.liability)} does not trigger payments on account. See what actually leaves your account, and when — free.`,
    };
  }

  return {
    eyebrow: 'Payments on account calculator',
    title: `${gbp(januaryTotal)} leaves your account in January`,
    subtitle: `A ${year} bill of ${gbp(s.liability)} plus the first advance instalment HMRC adds towards next year. The second follows on 31 July.`,
    figure: { value: gbp(januaryTotal), caption: 'due 31 January' },
    metaTitle: `${gbp(januaryTotal)} due in January on a ${gbp(s.liability)} tax bill`,
    metaDescription: `A ${year} liability of ${gbp(s.liability)} means ${gbp(januaryTotal)} in January once HMRC's payments on account are added, then a second instalment on 31 July. Work out yours, free.`,
  };
}

/* ------------------------------------------------------------------ *
 * MTD deadline checker
 * ------------------------------------------------------------------ */

export type IncomeKind = 'self_employment' | 'property';

export interface DeadlineShare {
  income: number;
  kinds: IncomeKind[];
}

export function encodeDeadline(s: DeadlineShare): string {
  return new URLSearchParams({
    inc: String(s.income),
    k: s.kinds.join('+'),
  }).toString();
}

export function decodeDeadline(sp: URLSearchParams): DeadlineShare | null {
  const income = money(sp.get('inc'), MAX_INCOME);
  if (income === null || income <= 0) return null;

  const raw = (sp.get('k') ?? '').split('+').filter(Boolean);
  const kinds = raw.filter(
    (k): k is IncomeKind => k === 'self_employment' || k === 'property',
  );
  if (kinds.length === 0) return null;

  return { income, kinds };
}

export function deadlineCard(s: DeadlineShare, now: Date = new Date()): ShareCard {
  const mandatedFrom = firstMandatedTaxYear(s.income);

  if (mandatedFrom === null) {
    // The lowest threshold announced, read off the table rather than typed in,
    // so a fourth step-down does not silently make this sentence wrong.
    const lowest = MTD_THRESHOLDS[MTD_THRESHOLDS.length - 1];
    return {
      eyebrow: 'MTD deadline checker',
      title: 'Making Tax Digital does not apply to you yet',
      subtitle: `${gbp(s.income)} of qualifying income is below every threshold announced so far — the lowest is ${gbp(lowest.threshold)} from April ${lowest.from}.`,
      figure: { value: 'Not yet', caption: 'no quarterly updates' },
      metaTitle: 'Making Tax Digital does not apply to you yet',
      metaDescription: `On ${gbp(s.income)} of qualifying income you are below every announced MTD for Income Tax threshold. Check your own position and deadlines, free.`,
    };
  }

  const yearLabel = `${mandatedFrom}/${String(mandatedFrom + 1).slice(-2)}`;
  const quarters = quartersForTaxYear(mandatedFrom);
  const first = quarters[0];
  const final = finalDeclarationFor(mandatedFrom);

  // Already inside the regime, versus still ahead of it — a materially
  // different message, and the one thing a reader wants off the card.
  const startsInPast = first ? first.deadline.getTime() < now.getTime() : false;

  return {
    eyebrow: 'MTD deadline checker',
    title: startsInPast
      ? `You are in Making Tax Digital — since ${yearLabel}`
      : `You are in Making Tax Digital from ${yearLabel}`,
    subtitle: `${gbp(s.income)} of qualifying income. Four quarterly updates${first ? `, the first due ${first.deadlineLabel}` : ''}, then a final declaration by ${final.deadlineLabel}.`,
    figure: { value: yearLabel, caption: 'first mandated year' },
    metaTitle: `You are in Making Tax Digital from ${yearLabel}`,
    metaDescription: `On ${gbp(s.income)} of qualifying income, MTD for Income Tax applies from ${yearLabel}: four quarterly updates and a final declaration by ${final.deadlineLabel}. Check yours free.`,
  };
}

/* ------------------------------------------------------------------ *
 * Banding, for the analytics that watch this loop
 * ------------------------------------------------------------------ */

/** Events about a shared result record a band, never the figure. A share link
 *  is public by construction; our analytics table does not have to be. */
export function moneyBand(n: number): string {
  if (n < 1_000) return 'under_1k';
  if (n < 5_000) return '1k_5k';
  if (n < 15_000) return '5k_15k';
  return 'over_15k';
}

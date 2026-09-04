// Regression tests for the MTD calendar.  Run with `npm test`.
//
// These exist because the homepage shipped a hard-coded `new Date('2026-08-05')`
// countdown that silently became wrong on 6 August 2026 — the live site spent a
// month advertising a deadline in the past and rendering "0 days until your
// first MTD ITSA quarterly update". A date that goes stale in production
// without failing anything is exactly what a test is for.
//
// Writing them also caught a second bug before it shipped: the checker picked
// "the next quarterly deadline after the mandation start date", which for the
// April 2027 band returned 7 May 2027 — the fourth update of the *previous*
// tax year, not the newly-mandated user's first.

import { checkMandation, nextDeadline, daysUntil, formatDeadlineDate, MTD_DEADLINES } from './mtd-deadlines.ts';
let fail = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: got ${JSON.stringify(got)}${ok ? '' : ` want ${JSON.stringify(want)}`}`);
};

// Chronological ordering — nextDeadline depends on it.
const dates = MTD_DEADLINES.map(d => d.date);
eq('deadlines sorted', dates, [...dates].sort());

// Mandation bands.
eq('60k sole trader -> 2026', (checkMandation(60_000, true) as any).band.startDate, '2026-04-06');
eq('40k -> 2027',            (checkMandation(40_000, true) as any).band.startDate, '2027-04-06');
eq('25k -> 2028',            (checkMandation(25_000, true) as any).band.startDate, '2028-04-06');
eq('15k not mandated',       checkMandation(15_000, true), { mandated: false, reason: 'below-threshold' });
eq('ltd co not mandated',    checkMandation(90_000, false), { mandated: false, reason: 'no-qualifying-income' });
// Thresholds are "more than", so exactly on the line falls to the next band.
eq('exactly 50k -> 2027',    (checkMandation(50_000, true) as any).band.startDate, '2027-04-06');
eq('exactly 20k not mandated', checkMandation(20_000, true), { mandated: false, reason: 'below-threshold' });

// First quarterly deadline after each start date.
eq('2026 first quarterly', (checkMandation(60_000, true) as any).firstQuarterlyDeadline.date, '2026-08-07');
eq('2027 first quarterly', (checkMandation(40_000, true) as any).firstQuarterlyDeadline.date, '2027-08-07');
eq('2028 first quarterly', (checkMandation(25_000, true) as any).firstQuarterlyDeadline.date, '2028-08-07');

// Rolling countdown — the bug that started all this.
eq('next on 2026-09-04', nextDeadline(new Date('2026-09-04T12:00:00Z'))!.date, '2026-11-07');
eq('deadline day is still next', nextDeadline(new Date('2026-11-07T23:00:00Z'))!.date, '2026-11-07');
eq('day after rolls on',  nextDeadline(new Date('2026-11-08T00:30:00Z'))!.date, '2027-01-31');
eq('days on deadline day', daysUntil('2026-11-07', new Date('2026-11-07T22:00:00Z')), 0);
eq('days until',           daysUntil('2026-11-07', new Date('2026-09-04T00:00:00Z')), 64);
eq('en formats en-GB',     formatDeadlineDate('2026-11-07', 'en'), '7 November 2026');

console.log(fail === 0 ? '\nALL PASS' : `\n${fail} FAILURES`);
process.exit(fail === 0 ? 0 : 1);

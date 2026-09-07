import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { trackAsync, EVENTS } from '@/lib/analytics';
import { sendDeadlineScheduleEmail, type ScheduleRow } from '@/lib/email';
import { unsubscribeApiUrl, unsubscribeUrl } from '@/lib/unsubscribe';
import {
  finalDeclarationFor,
  firstMandatedTaxYear,
  quartersForTaxYear,
  taxYearStartFor,
  thresholdForTaxYear,
} from '@/lib/mtd-dates';

// "Email me my deadlines".
//
// The launch waitlist converted 0 of 9 visitors in a week. It asked for an
// address and offered, in exchange, a message at an unknown future date about a
// product that cannot file yet. This asks for the same address and sends
// something back within the minute: the reader's own quarterly MTD dates, the
// year they are first mandated, and the final declaration date — worked out
// from lib/mtd-dates.ts, which is the same source the on-site checker uses.
//
// Same table as the waitlist, because on approval day this is the list to
// email; `intent` records what was actually agreed to, so a deadline
// subscriber is not treated as having consented to everything.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const SEGMENTS = new Set(['sole_trader', 'landlord', 'limited_company', 'accountant', 'other']);

function clamp(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s ? s.slice(0, max) : null;
}

function gbp(n: number): string {
  return `£${Math.round(n).toLocaleString('en-GB')}`;
}

type Schedule = {
  taxYearLabel: string | null;
  taxYearStart: number | null;
  rows: ScheduleRow[];
  summary: string;
};

/**
 * Builds the schedule for a qualifying income.
 *
 * Someone under every announced threshold still gets an email — they are not in
 * MTD, and being told that plainly, with the Self Assessment date they *do*
 * have, is more use than silence. It is also the honest answer: the thresholds
 * step down to £20,000 by 2028, so "not yet" is the correct word, not "no".
 */
function buildSchedule(qualifyingIncome: number, now = new Date()): Schedule {
  const mandatedFrom = firstMandatedTaxYear(qualifyingIncome);

  if (mandatedFrom === null) {
    const currentYear = taxYearStartFor(now);
    const sa = finalDeclarationFor(currentYear);
    const lowest = thresholdForTaxYear(2028);
    return {
      taxYearLabel: null,
      taxYearStart: null,
      rows: [
        {
          label: 'Self Assessment',
          period: `${currentYear}/${String(currentYear + 1).slice(-2)} tax year`,
          due: sa.deadlineLabel,
        },
      ],
      summary:
        `On ${gbp(qualifyingIncome)} of qualifying income you are not mandated into Making Tax ` +
        `Digital for Income Tax under any threshold announced so far — the lowest is ` +
        `${gbp(lowest)} from April 2028. Your Self Assessment deadline is unchanged, and we will ` +
        `email you if a future threshold brings you in.`,
    };
  }

  const quarters = quartersForTaxYear(mandatedFrom);
  const taxYearLabel = quarters[0].taxYear;
  const final = finalDeclarationFor(mandatedFrom);
  const threshold = thresholdForTaxYear(mandatedFrom);

  const rows: ScheduleRow[] = quarters.map(q => ({
    label: `${q.key} quarterly update`,
    period: q.periodLabel,
    due: q.deadlineLabel,
  }));

  rows.push({
    label: 'Final declaration',
    period: `${taxYearLabel} tax year`,
    due: final.deadlineLabel,
  });

  return {
    taxYearLabel,
    taxYearStart: mandatedFrom,
    rows,
    summary:
      `On ${gbp(qualifyingIncome)} of qualifying income you are mandated into Making Tax Digital ` +
      `for Income Tax from the ${taxYearLabel} tax year, when the threshold is ${gbp(threshold)}. ` +
      `That means four quarterly updates and a final declaration, in place of a single Self ` +
      `Assessment return. Here are the dates.`,
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;

  const email = clamp(b.email, 254)?.toLowerCase() ?? null;
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const incomeRaw = typeof b.qualifyingIncome === 'number' ? b.qualifyingIncome : Number(b.qualifyingIncome);
  if (!Number.isFinite(incomeRaw) || incomeRaw < 0 || incomeRaw > 100_000_000) {
    return NextResponse.json({ error: 'Enter your qualifying income.' }, { status: 400 });
  }
  const qualifyingIncome = Math.round(incomeRaw);

  const segmentRaw = clamp(b.segment, 32);
  const segment = segmentRaw && SEGMENTS.has(segmentRaw) ? segmentRaw : null;
  const source = clamp(b.source, 64);

  const schedule = buildSchedule(qualifyingIncome);

  // Opt-out links are signed; without a secret we cannot issue one, and an
  // unsubscribe link that does not work is a compliance failure, not a nicety.
  let links: { page: string; api: string };
  try {
    links = { page: unsubscribeUrl(email), api: unsubscribeApiUrl(email) };
  } catch (err) {
    console.error('[schedule] cannot issue unsubscribe link', err);
    return NextResponse.json({ error: 'Email is temporarily unavailable.' }, { status: 503 });
  }

  // Record the address first. If the send then fails we still have the lead and
  // can retry; the other order loses it silently.
  const subscriber = {
    email,
    segment,
    source,
    intent: 'deadline_schedule',
    schedule_tax_year: schedule.taxYearStart,
    qualifying_income: qualifyingIncome,
    referrer:     clamp(b.referrer, 512),
    utm_source:   clamp(b.utmSource, 128),
    utm_medium:   clamp(b.utmMedium, 128),
    utm_campaign: clamp(b.utmCampaign, 128),
  };

  const { error: insertError } = await supabase.from('launch_subscribers').insert(subscriber);

  if (insertError) {
    if (insertError.code === '42703' || insertError.code === 'PGRST204') {
      // Pre-20260906 schema. Fall back to the columns that have always existed
      // rather than turning a working capture into a 500.
      const { intent, schedule_tax_year, qualifying_income, ...legacy } = subscriber;
      void intent; void schedule_tax_year; void qualifying_income;
      const { error: legacyError } = await supabase.from('launch_subscribers').insert(legacy);
      if (legacyError && legacyError.code !== '23505') {
        console.error('[schedule] legacy insert failed', legacyError);
      }
    } else if (insertError.code === '23505') {
      // Already on the list. Re-sending the schedule they asked for again is
      // the expected behaviour, so this is not an error.
    } else if (insertError.code === 'PGRST205' || insertError.code === '42P01') {
      console.error('[schedule] launch_subscribers table missing — run the 20260903 migration');
      return NextResponse.json({ error: 'Sign-up is temporarily unavailable.' }, { status: 503 });
    } else {
      console.error('[schedule] insert failed', { code: insertError.code, message: insertError.message });
    }
  }

  trackAsync({
    name:     EVENTS.scheduleRequested,
    anonId:   clamp(b.anonId, 64),
    path:     clamp(b.path, 256),
    referrer: clamp(b.referrer, 512),
    utm: {
      source:   clamp(b.utmSource, 128),
      medium:   clamp(b.utmMedium, 128),
      campaign: clamp(b.utmCampaign, 128),
    },
    props: {
      source: source ?? 'unknown',
      segment: segment ?? 'unspecified',
      mandated_from: schedule.taxYearStart,
    },
  });

  try {
    await sendDeadlineScheduleEmail({
      to: email,
      taxYearLabel: schedule.taxYearLabel,
      rows: schedule.rows,
      summary: schedule.summary,
      unsubscribeUrl: links.page,
      unsubscribeApiUrl: links.api,
    });
    trackAsync({ name: EVENTS.scheduleSent, anonId: clamp(b.anonId, 64), path: clamp(b.path, 256) });
  } catch (err) {
    console.error('[schedule] send failed', err);
    // The address is captured and the dates are in the response, so the visitor
    // is not left with nothing. Saying the email failed is better than claiming
    // it is on its way to an inbox it will never reach.
    return NextResponse.json(
      {
        ok: true,
        emailed: false,
        schedule: { taxYear: schedule.taxYearLabel, rows: schedule.rows, summary: schedule.summary },
        warning: 'We saved your details but could not send the email just now. We will retry.',
      },
      { status: 200 },
    );
  }

  return NextResponse.json({
    ok: true,
    emailed: true,
    schedule: { taxYear: schedule.taxYearLabel, rows: schedule.rows, summary: schedule.summary },
  });
}

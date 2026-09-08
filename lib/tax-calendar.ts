import {
  quartersForTaxYear,
  finalDeclarationFor,
  taxYearStartFor,
} from './mtd-dates';

// A subscribable calendar of UK tax deadlines.
//
// Why a calendar and not another landing page: the site has 130 pages and two
// organic visits a week. Adding page 131 repeats that. What it does not have
// is anything a person would send to another person, or keep. A calendar
// subscription is both — it is useful on the day you find it and every quarter
// after, it survives in the reader's phone rather than in a tab, and "add UK
// tax deadlines to your calendar" is a thing people go looking for.
//
// It is also the only asset here that keeps working while HMRC production
// approval is pending: it needs no account, no connection and no filing.
//
// Every date is derived from lib/mtd-dates, which is the same source the
// deadline checker and the timetable use, so the calendar cannot state a date
// the rest of the site disagrees with.

const PRODID = '-//Finance Panda Limited//EasyTax UK Tax Deadlines//EN';

/** Fixed creation stamp. A feed whose bytes change on every request defeats
 *  caching and makes some clients re-notify on each refresh. */
const DTSTAMP = '20260908T000000Z';

export interface CalendarEvent {
  uid: string;
  /** All-day date, as YYYYMMDD. */
  date: string;
  summary: string;
  description: string;
}

function ymd(d: Date): string {
  return (
    d.getUTCFullYear().toString().padStart(4, '0') +
    (d.getUTCMonth() + 1).toString().padStart(2, '0') +
    d.getUTCDate().toString().padStart(2, '0')
  );
}

function addDay(yyyymmdd: string): string {
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6));
  const d = Number(yyyymmdd.slice(6, 8));
  return ymd(new Date(Date.UTC(y, m - 1, d + 1)));
}

/**
 * Deadlines for `years` tax years starting from the one containing `now`.
 *
 * Three years by default: a calendar that runs out in four months is a
 * calendar someone unsubscribes from.
 */
export function taxCalendarEvents(now: Date = new Date(), years = 3): CalendarEvent[] {
  const start = taxYearStartFor(now);
  const events: CalendarEvent[] = [];

  for (let i = 0; i < years; i++) {
    const ty = start + i;
    const label = `${ty}/${String(ty + 1).slice(-2)}`;

    for (const q of quartersForTaxYear(ty)) {
      events.push({
        uid: `mtd-${ty}-${q.key}@easytax.vip`,
        date: ymd(q.deadline),
        summary: `MTD quarterly update due (${label} ${q.key})`,
        description:
          `Your Making Tax Digital for Income Tax quarterly update for ${q.periodLabel} must reach HMRC by ${q.deadlineLabel}. ` +
          `Applies to sole traders and landlords with qualifying income above the MTD threshold. ` +
          `Check whether it applies to you: https://easytax.vip/mtd-deadline-checker`,
      });
    }

    const final = finalDeclarationFor(ty);
    events.push({
      uid: `mtd-final-${ty}@easytax.vip`,
      date: ymd(final.deadline),
      summary: `MTD final declaration due (${label})`,
      description:
        `The final declaration for the ${label} tax year is due by ${final.deadlineLabel}. ` +
        `It replaces the Self Assessment return for anyone inside Making Tax Digital. ` +
        `https://easytax.vip/timetable`,
    });

    // Self Assessment still runs alongside MTD — for tax years before the
    // mandate, and for everyone under the threshold. Leaving it out would make
    // the calendar wrong for most of the people subscribing to it.
    const janYear = ty + 2;
    events.push({
      uid: `sa-jan-${ty}@easytax.vip`,
      date: `${janYear}0131`,
      summary: `Self Assessment: file and pay (${label})`,
      description:
        `Deadline to file your ${label} online Self Assessment return, pay the balancing payment, ` +
        `and make the first payment on account for ${ty + 1}/${String(ty + 2).slice(-2)}. ` +
        `Late filing is an immediate £100 penalty. https://easytax.vip/self-assessment-penalty-calculator`,
    });
    events.push({
      uid: `sa-jul-${ty}@easytax.vip`,
      date: `${janYear}0731`,
      summary: `Second payment on account due (${label})`,
      description:
        `Deadline for the second payment on account for the ${label} tax year. ` +
        `Work out what you owe: https://easytax.vip/payments-on-account-calculator`,
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

/** RFC 5545 text escaping: commas, semicolons, backslashes and newlines. */
function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Fold to 75 octets per line, as RFC 5545 requires.
 *
 * Counted in UTF-8 bytes, not characters, and never split inside a multi-byte
 * sequence — the descriptions contain £ signs and en dashes, and a naive
 * character-count fold corrupts them in strict clients.
 */
function fold(line: string): string {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;

  const out: string[] = [];
  let cursor = 0;
  let limit = 75;
  while (cursor < bytes.length) {
    let end = Math.min(cursor + limit, bytes.length);
    // Walk back off a continuation byte (10xxxxxx) so we cut on a boundary.
    while (end > cursor && end < bytes.length && (bytes[end] & 0b1100_0000) === 0b1000_0000) {
      end--;
    }
    out.push(bytes.subarray(cursor, end).toString('utf8'));
    cursor = end;
    limit = 74; // continuation lines carry a leading space
  }
  return out.join('\r\n ');
}

/** The full .ics document. */
export function buildTaxCalendar(now: Date = new Date(), years = 3): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:UK Tax Deadlines (EasyTax)',
    'X-WR-CALDESC:MTD quarterly updates, final declarations and Self Assessment deadlines for UK sole traders and landlords.',
    // Hint to clients how often to re-poll. Deadlines move rarely; a daily
    // refresh is plenty and keeps us off anyone's bandwidth.
    'REFRESH-INTERVAL;VALUE=DURATION:P1D',
    'X-PUBLISHED-TTL:P1D',
  ];

  for (const e of taxCalendarEvents(now, years)) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${DTSTAMP}`,
      `DTSTART;VALUE=DATE:${e.date}`,
      `DTEND;VALUE=DATE:${addDay(e.date)}`,
      `SUMMARY:${escapeText(e.summary)}`,
      `DESCRIPTION:${escapeText(e.description)}`,
      'URL:https://easytax.vip/timetable',
      'TRANSP:TRANSPARENT',
      // A deadline you learn about on the day is not much use. Seven days is
      // enough to gather the figures; one day is the last call.
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:-P7D',
      `DESCRIPTION:${escapeText(`One week until: ${e.summary}`)}`,
      'END:VALARM',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:-P1D',
      `DESCRIPTION:${escapeText(`Tomorrow: ${e.summary}`)}`,
      'END:VALARM',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

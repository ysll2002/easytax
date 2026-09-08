import { NextResponse } from 'next/server';
import { buildTaxCalendar } from '@/lib/tax-calendar';
import { track } from '@/lib/analytics';

// The subscribable calendar feed.
//
// Deliberately not under /api: robots.ts disallows /api/, and this is a public
// document we want crawled, linked and indexed like any other page.
//
// Served on every request rather than statically, so the three-year window
// rolls forward with the calendar instead of freezing at the last deploy.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const ics = buildTaxCalendar();

  // Calendar clients re-poll on their own schedule, so a subscription shows up
  // here as a repeating request from the same agent. Recorded fire-and-forget:
  // a metrics failure must never break someone's calendar refresh.
  void track({
    name: 'calendar_fetched',
    path: '/calendar/uk-tax-deadlines.ics',
    referrer: req.headers.get('referer'),
    props: {
      // Enough to tell a real subscription (Google/Apple/Outlook fetchers) from
      // a one-off download in a browser. No identifier, nothing personal.
      agent: (req.headers.get('user-agent') ?? '').slice(0, 120),
    },
  }).catch(() => {});

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      // inline, not attachment: a browser hitting the URL should hand it to the
      // calendar app rather than drop an .ics in Downloads.
      'Content-Disposition': 'inline; filename="uk-tax-deadlines.ics"',
      'Cache-Control': 'public, max-age=3600, s-maxage=21600',
    },
  });
}

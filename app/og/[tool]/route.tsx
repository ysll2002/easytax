import { NextRequest } from 'next/server';
import { renderOgCard } from '@/lib/og';
import { trackAsync, EVENTS } from '@/lib/analytics';
import {
  decodePenalty, penaltyCard,
  decodePoa, poaCard,
  decodeDeadline, deadlineCard,
  type ShareCard,
} from '@/lib/share-results';

export const runtime = 'nodejs';
// A shared result is a different card for every set of numbers, so there is
// nothing to cache across requests. It is also the one card that must never be
// served stale: the penalty on a return grows by £10 a day.
export const dynamic = 'force-dynamic';

// Preview cards for shared calculator answers.
//
// Deliberately NOT under /api — robots.ts disallows that prefix, and while the
// social scrapers ignore robots.txt, Google's does not, and a card Google will
// not fetch is a card that never appears in Discover or in a rich result.
//
// The security property that makes this route safe to expose: it renders no
// caller-supplied text. Every parameter is decoded, bounds-checked and put back
// through the same calculation library the page uses, and the card is built
// from *our* sentences about the result. There is no `?title=` here, so the
// branded card cannot be turned into a generator for arbitrary images carrying
// our name.

const BUILDERS: Record<string, (sp: URLSearchParams) => ShareCard | null> = {
  penalty: sp => {
    const s = decodePenalty(sp);
    return s && penaltyCard(s);
  },
  'payments-on-account': sp => {
    const s = decodePoa(sp);
    return s && poaCard(s);
  },
  'mtd-deadline': sp => {
    const s = decodeDeadline(sp);
    return s && deadlineCard(s);
  },
};

/** The social scrapers, by the name each puts in its User-Agent. A hit from
 *  one of these is the only direct evidence we get that a link was actually
 *  posted somewhere — the platform fetches the card before it renders the
 *  preview. Anything unrecognised is recorded as 'other' rather than dropped. */
const SCRAPERS: [RegExp, string][] = [
  [/twitterbot/i,             'x'],
  [/facebookexternalhit|facebot/i, 'facebook'],
  [/linkedinbot/i,            'linkedin'],
  [/slackbot|slack-imgproxy/i, 'slack'],
  [/whatsapp/i,               'whatsapp'],
  [/discordbot/i,             'discord'],
  [/telegrambot/i,            'telegram'],
  [/redditbot/i,              'reddit'],
  [/googlebot|google-inspectiontool/i, 'google'],
  [/bingbot/i,                'bing'],
];

function scraper(ua: string | null): string {
  if (!ua) return 'unknown';
  for (const [re, name] of SCRAPERS) if (re.test(ua)) return name;
  return 'other';
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tool: string }> },
) {
  const { tool } = await params;
  const build = BUILDERS[tool];
  if (!build) return new Response('Not found', { status: 404 });

  const card = build(req.nextUrl.searchParams);
  if (!card) {
    // Malformed or out-of-range parameters. 404 rather than a generic card:
    // a card that silently ignores its inputs is worse than no card, because
    // the preview would then contradict the page.
    return new Response('Not found', { status: 404 });
  }

  // Fire-and-forget, and never the figures — only which tool and which
  // platform asked. The URL contains someone's tax position because they chose
  // to share it; that is not a reason for us to keep a copy.
  trackAsync({
    name: EVENTS.shareCardServed,
    path: `/og/${tool}`,
    props: { tool, scraper: scraper(req.headers.get('user-agent')) },
  });

  return renderOgCard(card);
}

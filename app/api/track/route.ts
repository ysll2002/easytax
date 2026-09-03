import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { track } from '@/lib/analytics';

// Client event sink. Called by components/PageViewTracker.tsx via
// navigator.sendBeacon, so it must stay cheap and must always return quickly.
//
// This is a public endpoint by necessity — it records logged-out visitors, who
// are the whole point of the funnel. The mitigations are: a strict event-name
// allowlist, hard length caps on every field, and a props object that is
// truncated rather than trusted. Nothing here is read back into HTML.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Only names the app actually emits. An unknown name is dropped rather than
// stored, so a stray script cannot fill the table with arbitrary rows.
const ALLOWED = new Set([
  'page_view',
  'register_started',
  'register_completed',
  'launch_subscribed',
  'trust_viewed',
  'activation_cta_click',
  'article_cta_click',
]);

const MAX_STR = 512;
const MAX_PROPS_KEYS = 12;

function clamp(v: unknown, max = MAX_STR): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s ? s.slice(0, max) : null;
}

/** Keep props to a small, flat, scalar-only object — no nested structures, no
 *  unbounded strings, no more keys than we would ever chart. */
function sanitiseProps(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (Object.keys(out).length >= MAX_PROPS_KEYS) break;
    const key = k.slice(0, 40);
    if (typeof v === 'string')       out[key] = v.slice(0, 200);
    else if (typeof v === 'number')  out[key] = Number.isFinite(v) ? v : null;
    else if (typeof v === 'boolean') out[key] = v;
    // Everything else (objects, arrays, functions) is dropped.
  }
  return out;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const name = clamp(b.name, 64);
  if (!name || !ALLOWED.has(name)) {
    // 204 rather than an error: a rejected event is not worth a console error
    // in the visitor's browser, and we do not want to advertise the allowlist.
    return new NextResponse(null, { status: 204 });
  }

  // Trust the session for user_id, never the request body — otherwise anyone
  // could attribute events to another account.
  const session = await auth().catch(() => null);

  await track({
    name,
    userId:   session?.user?.profileId ?? null,
    anonId:   clamp(b.anonId, 64),
    path:     clamp(b.path, 256),
    referrer: clamp(b.referrer),
    utm: {
      source:   clamp(b.utmSource, 128),
      medium:   clamp(b.utmMedium, 128),
      campaign: clamp(b.utmCampaign, 128),
    },
    // The deploy environment is stamped by track() in lib/analytics, after
    // this sanitisation, so a caller cannot spoof it here.
    props: sanitiseProps(b.props),
  });

  return new NextResponse(null, { status: 204 });
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { trackAsync, EVENTS } from '@/lib/analytics';

// Launch-list capture.
//
// HMRC production approval is still pending, so an interested visitor cannot
// be converted into a paying customer today. Without a capture they leave and
// become unreachable — which is the position we are in now: five months of
// traffic, 45 accounts, and no way to tell anyone when filing goes live.
// This endpoint is the list to email on approval day.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SEGMENTS = new Set(['sole_trader', 'landlord', 'limited_company', 'accountant', 'other']);

// Deliberately permissive: the goal is to catch typos and obvious junk, not to
// adjudicate RFC 5322. Anything that reaches the list gets validated properly
// by the ESP at send time.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clamp(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s ? s.slice(0, max) : null;
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

  const segmentRaw = clamp(b.segment, 32);
  const segment = segmentRaw && SEGMENTS.has(segmentRaw) ? segmentRaw : null;

  const { error } = await supabase.from('launch_subscribers').insert({
    email,
    segment,
    source:       clamp(b.source, 64),
    referrer:     clamp(b.referrer, 512),
    utm_source:   clamp(b.utmSource, 128),
    utm_medium:   clamp(b.utmMedium, 128),
    utm_campaign: clamp(b.utmCampaign, 128),
  });

  if (error) {
    // 23505 = unique violation on lower(email). Already subscribing is a
    // success from the visitor's point of view, so say so rather than showing
    // an error that makes them try again.
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }
    // PGRST205 / 42P01 = the 20260903 migration has not been run. Log loudly —
    // this one silently loses leads, so it needs to be obvious in the logs.
    if (error.code === 'PGRST205' || error.code === '42P01') {
      console.error('[notify-me] launch_subscribers table missing — run the 20260903 migration');
      return NextResponse.json({ error: 'Sign-up is temporarily unavailable.' }, { status: 503 });
    }
    console.error('[notify-me] insert failed', { code: error.code, message: error.message });
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  trackAsync({
    name:     EVENTS.launchSubscribed,
    anonId:   clamp(b.anonId, 64),
    path:     clamp(b.path, 256),
    referrer: clamp(b.referrer, 512),
    utm: {
      source:   clamp(b.utmSource, 128),
      medium:   clamp(b.utmMedium, 128),
      campaign: clamp(b.utmCampaign, 128),
    },
    props: { segment: segment ?? 'unspecified', source: clamp(b.source, 64) ?? 'unknown' },
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { trackAsync, EVENTS } from '@/lib/analytics';

// "Tell me the day filing opens" — for someone who is already signed in.
//
// The problem this closes. On 2026-09-16 this product had 48 registered
// accounts, 17 of them with HMRC connected, and 0 filings — because filing is
// not possible until HMRC grants production access, which is still pending.
// Every one of those people signed up, found they could not do the thing they
// came for, and left. Nothing in the product told them why, nothing told them
// when, and `launch_subscribers` — the list to mail on approval day — had zero
// rows in it.
//
// So the most valuable asset the company owns is 48 people it cannot contact
// about the one event that would convert them, and the capture form that
// exists (`/api/notify-me`) is on public marketing pages that a signed-in user
// has no reason to revisit.
//
// This is the same list, reached from inside the product, without asking
// somebody who has already given us their email address to type it again. One
// click, and it is their account's address — which is also why this route takes
// no email in its body: accepting one would let any caller add any address to
// a mailing list, and the session already says who this is.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const { error } = await supabase.from('launch_subscribers').insert({
    email: email.toLowerCase(),
    source: 'dashboard',
  });

  if (error) {
    // Already on the list is a success from the user's point of view. The
    // unique index is on lower(email), so this is also what happens when they
    // subscribed earlier from a public page under the same address.
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }
    if (error.code === 'PGRST205' || error.code === '42P01') {
      console.error('[filing-waitlist] launch_subscribers missing — run the 20260903 migration');
      return NextResponse.json({ error: 'Not available right now.' }, { status: 503 });
    }
    console.error('[filing-waitlist] insert failed', { code: error.code, message: error.message });
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }

  trackAsync({
    name:   EVENTS.launchSubscribed,
    userId: session.user.profileId ?? null,
    path:   '/dashboard',
    props:  { segment: 'unspecified', source: 'dashboard' },
  });

  return NextResponse.json({ ok: true });
}

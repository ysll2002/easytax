import { NextRequest, NextResponse } from 'next/server';
import { verifyUnsubscribeToken } from '@/lib/unsubscribe';
import { optOut } from '@/lib/email-optout';

// Opt-out endpoint.
//
// POST is the RFC 8058 one-click target named in the `List-Unsubscribe` header:
// Gmail and Outlook call it directly when the recipient uses their client's own
// unsubscribe button, with no browser session and no confirmation step. It must
// therefore succeed on the first call and must never require a login.
//
// GET is here so that pasting the header URL into a browser still works; it
// redirects to the confirmation page, which performs the same opt-out.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parse(req: NextRequest): { email: string; token: string } {
  const url = new URL(req.url);
  return {
    email: (url.searchParams.get('e') ?? '').trim().toLowerCase(),
    token: (url.searchParams.get('t') ?? '').trim(),
  };
}

export async function POST(req: NextRequest) {
  const { email, token } = parse(req);
  if (!verifyUnsubscribeToken(email, token)) {
    return NextResponse.json({ ok: false, error: 'Invalid link' }, { status: 400 });
  }
  const result = await optOut(email);
  // Always 200 for a valid token. A mailbox provider that sees an error may
  // mark the message as having a broken unsubscribe, which hurts deliverability
  // for everyone; the failure is logged server-side instead.
  return NextResponse.json({ ok: result.ok });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  return NextResponse.redirect(new URL(`/unsubscribe${url.search}`, url.origin));
}

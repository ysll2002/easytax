import { createHmac, timingSafeEqual } from 'crypto';

// Stateless unsubscribe links.
//
// UK direct-marketing rules (PECR reg. 22 / UK GDPR art. 21) require a working
// opt-out in every marketing email, and the reminder cron previously sent none.
// A signed token means the link works without a per-user database column and
// without a logged-in session — the recipient clicks once and is done, which is
// the standard the ICO expects.
//
// The token is an HMAC over the lowercased address, so it cannot be guessed and
// one address's link cannot unsubscribe another.

function secret(): string {
  const s =
    process.env.UNSUBSCRIBE_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;
  if (!s) {
    // Fail closed: without a secret we cannot issue a verifiable opt-out link,
    // and an email with a broken unsubscribe link is worse than no email.
    throw new Error(
      'UNSUBSCRIBE_SECRET (or AUTH_SECRET) must be set to issue unsubscribe links',
    );
  }
  return s;
}

/** Deterministic token for an address. Same address always yields the same
 *  token, so a link stays valid across resends. */
export function unsubscribeToken(email: string): string {
  return createHmac('sha256', secret())
    .update(email.trim().toLowerCase())
    .digest('hex')
    .slice(0, 32);
}

function query(email: string): string {
  return `e=${encodeURIComponent(email.trim().toLowerCase())}&t=${unsubscribeToken(email)}`;
}

/** The link a human clicks. Lands on a page that confirms what happened. */
export function unsubscribeUrl(email: string, base = 'https://easytax.vip'): string {
  return `${base}/unsubscribe?${query(email)}`;
}

/** The URL for the `List-Unsubscribe` header. Mailbox providers POST to this
 *  when the recipient uses their client's own unsubscribe button, so it must
 *  be a route handler rather than a page. */
export function unsubscribeApiUrl(email: string, base = 'https://easytax.vip'): string {
  return `${base}/api/unsubscribe?${query(email)}`;
}

/** Constant-time comparison, so a caller cannot brute-force a token by timing. */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token) return false;
  let expected: string;
  try {
    expected = unsubscribeToken(email);
  } catch {
    return false;
  }
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(token, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

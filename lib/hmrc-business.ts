import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getBusinessDetails } from '@/lib/hmrc';

// Resolving the self-employment businessId, from a request that has a browser
// behind it.
//
// This used to happen in `app/api/auth/callback/hmrc/route.ts`, immediately
// after the OAuth token exchange. That is the one place in the app where
// `fraudHeaders()` cannot populate a single Gov-Client-* device header, and it
// is so by construction:
//
//   - no `x-easytax-device-data` request header: lib/hmrc-client sets that on a
//     client fetch, and the callback is reached by a top-level 302 from HMRC,
//     so no client code of ours runs
//   - no `hmrc_device` cookie: device-data-client writes it SameSite=Strict,
//     and Strict is withheld on exactly this kind of cross-site top-level
//     navigation
//   - auth() supplies userId and nothing else
//
// So `getBusinessDetails()` reached HMRC with all nine device headers empty, on
// every connect. Its sibling call on the line below — a VAT obligations warm-up
// whose result was discarded — was removed for the same reason in f1848b4. This
// one could not simply be deleted: its result is persisted as `business_id` and
// two routes need it to file.
//
// HMRC's FPH review of 2026-09-12 named four VAT endpoints and, on re-review,
// Gov-Client-Device-ID as well. The device headers cannot be faked — HMRC
// prohibits dummy values (ticket 2026-NQM717) — so the fix is not to invent
// them, it is to make the call from somewhere a device actually exists.
//
// Both consumers (`/api/hmrc/submit-quarter`, `/api/hmrc/adjustments`) are
// reached from the dashboard through `hmrcFetch`, which sets the device-data
// header. Resolving here therefore runs inside a request that carries real
// browser data, and the lookup happens once per connection: the answer is
// persisted the first time and read from the row after that.

/**
 * The stored businessId, or one fetched from HMRC and stored now.
 *
 * `known` is whatever the caller already read from `hmrc_connections`, so a
 * connection that has been resolved before costs nothing and makes no HMRC
 * call at all.
 *
 * Returns null rather than throwing: a missing businessId is a 400 the caller
 * already knows how to report, and a failed lookup must not turn a filing
 * attempt into a 500.
 */
export async function resolveBusinessId(
  profileId: string,
  nino: string,
  token: string,
  known: string | null | undefined,
): Promise<string | null> {
  if (known) return known;

  try {
    const businesses = await getBusinessDetails(nino, token);
    const selfEmp = businesses.find(b => b.typeOfBusiness === 'self-employment');
    const businessId = selfEmp?.businessId ?? null;
    if (!businessId) return null;

    // Persisted so the HMRC round trip happens once per connection rather than
    // on every filing. A write failure is not fatal — we still have the value
    // for this request, and the next one will look it up again.
    const { error } = await supabase
      .from('hmrc_connections')
      .update({ business_id: businessId })
      .eq('user_id', profileId);
    if (error) console.warn('[hmrc-business] could not persist business_id:', error.message);

    return businessId;
  } catch (err) {
    console.warn('[hmrc-business] businessId lookup failed:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

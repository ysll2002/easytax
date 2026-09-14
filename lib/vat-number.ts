// UK VAT registration numbers: normalising, and checking them honestly.
//
// Why this file exists at all: `vrn` was read in seven places across the app
// and written in none. There was no input, no API route, and no way for a user
// to supply one — so `hmrc_connections.vrn` was null for every account except
// the one row it had been set on by hand, and the dashboard's VAT Return card
// sat permanently behind a "Requires VRN" lock that nothing could unlock.
//
// The validation policy here is deliberately split in two, because the two
// checks deserve different treatment.

/** What the MTD VAT API takes in its `{vrn}` path segment: nine digits. */
const VRN_DIGITS = 9;

export type VrnCheck =
  | { ok: true; vrn: string; warning?: string }
  | { ok: false; error: string };

/**
 * Strip the things people legitimately type: spaces, the `GB` prefix that
 * appears on every invoice, and the punctuation in `GB 123 4567 89`.
 */
export function normaliseVrn(input: string): string {
  return input
    .toUpperCase()
    .replace(/[\s.\-/]/g, '')
    .replace(/^GB/, '');
}

/**
 * The mod-97 check digit, which is what makes a VRN self-verifying.
 *
 * Weights 8..2 across the first seven digits, plus the last two read as a
 * two-digit number; a valid VRN gives a total divisible by 97. Numbers issued
 * after 1 November 2009 use the same sum plus 55 ("mod 9755"), so a VRN is
 * valid if *either* form checks out.
 *
 * Verified against a real registration: 220430231 gives 66 + 31 = 97, which is
 * 0 mod 97.
 */
export function vrnChecksumValid(vrn: string): boolean {
  if (!/^\d{9}$/.test(vrn)) return false;
  const d = [...vrn].map(Number);

  let sum = 0;
  for (let i = 0; i < 7; i++) sum += d[i] * (8 - i);

  const check = d[7] * 10 + d[8];
  return (sum + check) % 97 === 0 || (sum + check + 55) % 97 === 0;
}

/**
 * Validate what a user typed.
 *
 * Format is a hard failure; the checksum is only ever a warning. That
 * asymmetry is the important decision in this file, and it is not timidity:
 *
 *   - A wrong *length* cannot be a real VRN and will produce a confusing 404
 *     from HMRC, so there is no reason to accept it.
 *   - A failed *checksum* is strong evidence of a typo, but blocking on it
 *     would reject HMRC's own sandbox VRN, 999999999, which fails both the
 *     mod-97 and mod-9755 tests. It is the value this application falls back
 *     to in `sandbox-test`, and the value anyone testing against the sandbox
 *     will type. Government-department and health-authority registrations
 *     (GBGD…, GBHA…) do not follow the scheme either.
 *
 * Refusing a user's genuine VAT number because of an edge case in my checksum
 * is a worse failure than accepting a typo and letting HMRC say no — on a tax
 * product, the first one makes us look broken and the second is recoverable.
 * So: tell them it looks wrong, let them save it anyway.
 */
export function checkVrn(input: string): VrnCheck {
  const vrn = normaliseVrn(input);

  if (vrn === '') return { ok: true, vrn: '' };

  if (!/^\d+$/.test(vrn)) {
    return { ok: false, error: 'A VAT number is digits only, optionally with a GB prefix.' };
  }
  if (vrn.length !== VRN_DIGITS) {
    return {
      ok: false,
      error: `A UK VAT number is ${VRN_DIGITS} digits; you entered ${vrn.length}.`,
    };
  }

  if (!vrnChecksumValid(vrn)) {
    return {
      ok: true,
      vrn,
      warning: 'That does not pass the standard VAT number check digit — worth re-reading it. Saved anyway.',
    };
  }

  return { ok: true, vrn };
}

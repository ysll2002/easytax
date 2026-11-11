// Which HMRC environment this deployment talks to.
//
// Why this is its own file. The same ternary was written out by hand in three
// places, and on 2026-11-11 — the day production access was granted — the one
// place that had NOT been written out became a production outage:
//
//   app/dashboard/individual/hmrc/page.tsx built the OAuth authorize URL with
//   'https://test-api.service.hmrc.gov.uk' hardcoded. Once HMRC_CLIENT_ID was
//   switched to the production application, clicking "Connect HMRC" sent a
//   production client_id to the sandbox authorize endpoint, and HMRC answered
//
//       {"error":"invalid_request","error_description":"client_id is invalid"}
//
//   from test-www.tax.service.gov.uk. Nothing in the app logged an error: the
//   API calls in lib/hmrc.ts were correctly pointed at production, so the only
//   symptom was that no one could connect, and the obvious suspect was the
//   credentials rather than the one URL that never read HMRC_ENV.
//
// So there is now exactly one place that decides, and everything that needs to
// reach HMRC imports it.
//
// The default is deliberately the sandbox. HMRC_ENV is set only on the
// production Vercel scope; preview deployments and local development leave it
// unset and get test-api, which is the safe direction to fail in — a
// misconfigured preview files nothing real.

/** True only when HMRC_ENV is exactly 'production'. */
export const IS_HMRC_PRODUCTION = process.env.HMRC_ENV === 'production';

/**
 * Base for every HMRC API call, and for the OAuth `/oauth/authorize` and
 * `/oauth/token` endpoints.
 *
 * `/oauth/authorize` on this host 302s the browser to the matching
 * Government Gateway sign-in page — www.tax.service.gov.uk in production,
 * test-www.tax.service.gov.uk in the sandbox — so the authorize link must use
 * the same base as the token exchange that follows it. Mixing them is what
 * produced the 2026-11-11 outage described above.
 */
export const HMRC_API_BASE = IS_HMRC_PRODUCTION
  ? 'https://api.service.hmrc.gov.uk'
  : 'https://test-api.service.hmrc.gov.uk';

/**
 * The sandbox, named explicitly, for the handful of HMRC APIs that exist only
 * there and must not follow HMRC_ENV.
 *
 * Today that is the Test Fraud Prevention Headers API
 * (`/test/fraud-prevention-headers/…`) and Create Test User
 * (`/create-test-user/…`). Both are sandbox-only services; in production the
 * equivalent of the first is the Fraud Prevention panel on Developer Hub, and
 * the second has no production meaning at all. Pointing either at
 * HMRC_API_BASE would 404 in production, so they import this instead — the
 * constant says "sandbox on purpose", which a bare string literal did not.
 */
export const HMRC_SANDBOX_BASE = 'https://test-api.service.hmrc.gov.uk';

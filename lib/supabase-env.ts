// Which Supabase project a deployment is allowed to talk to.
//
// Production and staging must not share a database. When they did, signing
// in on staging.easytax.vip with your own account and connecting a *sandbox*
// HMRC test user overwrote your production `hmrc_connections` row with a
// sandbox token; test registrations sent real welcome emails and were
// counted as conversions in the production funnel; and the sandbox harness
// read and wrote the same rows real filings depend on.
//
// Vercel environment variables are the isolation mechanism — Production gets
// the production project's URL and keys, Preview gets the staging project's.
// But that is one checkbox in a dashboard, and ticking "Preview" on the
// production key is exactly the obvious fix for "staging can't reach the
// database". So it is enforced here as well: a deployment that is not
// Vercel Production refuses to connect to the production project at all.

// Not a secret: the project URL ships in every page's JS bundle.
const PRODUCTION_PROJECT_HOST = 'elfkdqrqiyrmcisnkbza.supabase.co';

export function assertSupabaseAllowed(url: string) {
  const vercelEnv = process.env.VERCEL_ENV ?? process.env.NEXT_PUBLIC_VERCEL_ENV;
  // Only Vercel sets VERCEL_ENV. Local development is left alone.
  if (!vercelEnv || vercelEnv === 'production') return;

  let host = '';
  try { host = new URL(url).host; } catch { /* malformed URL: let createClient report it */ }
  if (host === PRODUCTION_PROJECT_HOST) {
    throw new Error(
      `Refusing to use the production Supabase project from a ${vercelEnv} deployment. ` +
      'Give the Preview environment the staging project\'s NEXT_PUBLIC_SUPABASE_URL, ' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in Vercel.',
    );
  }
}

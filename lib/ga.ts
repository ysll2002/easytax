import crypto from 'node:crypto';

// Server-side Google Analytics 4 Data API client.
// Auth is a service-account JWT bearer flow — no user interaction, so it works
// from cron jobs and from the daily autonomous agent.
//
// Env:
//   GA_PROPERTY_ID          numeric GA4 property id (NOT the G-XXXX measurement id)
//   GA_SERVICE_ACCOUNT_JSON service account key, either raw JSON or base64-encoded
//
// The service account needs the "Viewer" role on the GA4 property, and the
// Analytics Data API must be enabled on its GCP project.

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DATA_API  = 'https://analyticsdata.googleapis.com/v1beta';
const SCOPE     = 'https://www.googleapis.com/auth/analytics.readonly';

type ServiceAccount = { client_email: string; private_key: string };

export type GaRow = { dims: string[]; metrics: string[] };

function parseServiceAccount(raw: string): ServiceAccount {
  // Vercel env vars mangle multi-line values, so base64 is the safer way to
  // paste a key. Accept either form.
  const text = raw.trim().startsWith('{')
    ? raw
    : Buffer.from(raw, 'base64').toString('utf8');
  const sa = JSON.parse(text) as ServiceAccount;
  if (!sa.client_email || !sa.private_key) {
    throw new Error('service account JSON missing client_email or private_key');
  }
  // Survives keys whose newlines were escaped as literal backslash-n.
  sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  return sa;
}

let cachedToken = { value: '', expiresAt: 0 };

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  if (Date.now() < cachedToken.expiresAt) return cachedToken.value;

  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss:   sa.client_email,
    scope: SCOPE,
    aud:   TOKEN_URL,
    exp:   now + 3600,
    iat:   now,
  })}`;
  const sig = crypto.sign('RSA-SHA256', Buffer.from(unsigned), sa.private_key).toString('base64url');

  const res = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  `${unsigned}.${sig}`,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const json = await res.json();
  if (!json.access_token) {
    throw new Error(`token exchange failed: ${json.error_description ?? json.error ?? 'unknown'}`);
  }
  // Refresh a minute early to avoid racing the expiry.
  cachedToken = { value: json.access_token, expiresAt: Date.now() + (json.expires_in - 60) * 1000 };
  return cachedToken.value;
}

type ReportSpec = {
  dateRanges: { startDate: string; endDate: string }[];
  metrics:    { name: string }[];
  dimensions?: { name: string }[];
  dimensionFilter?: unknown;
  orderBys?:  unknown[];
  limit?:     number;
};

async function runReport(propertyId: string, token: string, spec: ReportSpec): Promise<GaRow[]> {
  const res = await fetch(`${DATA_API}/properties/${propertyId}:runReport`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(spec),
    signal:  AbortSignal.timeout(15_000),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return (json.rows ?? []).map((r: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }) => ({
    dims:    (r.dimensionValues ?? []).map(d => d.value),
    metrics: (r.metricValues    ?? []).map(m => m.value),
  }));
}

const num = (v: string | undefined) => Number(v ?? 0) || 0;

/** Sum a single-metric report down to one number. */
const sumMetric = (rows: GaRow[], idx = 0) => rows.reduce((acc, r) => acc + num(r.metrics[idx]), 0);

export type GaMetrics =
  | { configured: false; reason: string }
  | {
      configured: true;
      property_id: string;
      date_range: { start: string; end: string };
      totals: { users: number; sessions: number; pageviews: number };
      by_month: { month: string; users: number; sessions: number; pageviews: number }[];
      channels: { channel: string; sessions: number; users: number }[];
      landing_pages: { page: string; sessions: number; bounce_rate: number }[];
      register_funnel: {
        register_pageviews:  number;
        register_attempted:  number;
        register_success:    number;
        register_failed:     number;
        visitor_to_signup:   number;
        pageview_to_attempt: number;
        attempt_to_success:  number;
      };
      failure_reasons: { reason: string; count: number }[] | { error: string };
    };

/**
 * Pull the traffic + registration funnel that Supabase alone can't answer:
 * how many people arrived, where from, and where they dropped off before
 * a profile row ever got written.
 *
 * Returns { configured: false } rather than throwing when env is absent, so
 * the metrics endpoint keeps serving its Supabase half either way.
 */
export async function fetchGaMetrics(startDate = '2026-04-01'): Promise<GaMetrics> {
  const propertyId = process.env.GA_PROPERTY_ID;
  const rawKey     = process.env.GA_SERVICE_ACCOUNT_JSON;
  if (!propertyId || !rawKey) {
    return { configured: false, reason: 'GA_PROPERTY_ID or GA_SERVICE_ACCOUNT_JSON not set' };
  }
  if (!/^\d+$/.test(propertyId)) {
    return { configured: false, reason: `GA_PROPERTY_ID must be numeric, got "${propertyId}" (that looks like a measurement id)` };
  }

  const sa    = parseServiceAccount(rawKey);
  const token = await getAccessToken(sa);
  const range = [{ startDate, endDate: 'today' }];
  const report = (spec: Omit<ReportSpec, 'dateRanges'>) =>
    runReport(propertyId, token, { dateRanges: range, ...spec });

  const eventFilter = (name: string) => ({
    filter: { fieldName: 'eventName', stringFilter: { value: name } },
  });

  const [monthly, channels, landing, events, registerPage] = await Promise.all([
    report({
      metrics:    [{ name: 'totalUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
      dimensions: [{ name: 'yearMonth' }],
      orderBys:   [{ dimension: { dimensionName: 'yearMonth' } }],
    }),
    report({
      metrics:    [{ name: 'sessions' }, { name: 'totalUsers' }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      orderBys:   [{ metric: { metricName: 'sessions' }, desc: true }],
    }),
    report({
      metrics:    [{ name: 'sessions' }, { name: 'bounceRate' }],
      dimensions: [{ name: 'landingPage' }],
      orderBys:   [{ metric: { metricName: 'sessions' }, desc: true }],
      limit:      25,
    }),
    report({
      metrics:    [{ name: 'eventCount' }],
      dimensions: [{ name: 'eventName' }],
      orderBys:   [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit:      50,
    }),
    report({
      metrics:         [{ name: 'screenPageViews' }],
      dimensionFilter: { filter: { fieldName: 'pagePath', stringFilter: { value: '/register' } } },
    }),
  ]);

  // register_failed carries its cause in an event param. GA4 only exposes that
  // as a queryable dimension once it's registered under Admin > Custom
  // definitions, so treat a failure here as informational, not fatal.
  let failureReasons: { reason: string; count: number }[] | { error: string };
  try {
    const rows = await report({
      metrics:         [{ name: 'eventCount' }],
      dimensions:      [{ name: 'customEvent:reason' }],
      dimensionFilter: eventFilter('register_failed'),
      orderBys:        [{ metric: { metricName: 'eventCount' }, desc: true }],
    });
    failureReasons = rows.map(r => ({ reason: r.dims[0] || '(not set)', count: num(r.metrics[0]) }));
  } catch (err) {
    failureReasons = {
      error: `${err instanceof Error ? err.message : String(err)} — register "reason" as a custom dimension in GA4 Admin > Custom definitions to enable this breakdown`,
    };
  }

  const eventCount = (name: string) =>
    num(events.find(r => r.dims[0] === name)?.metrics[0]);

  const totalUsers        = sumMetric(monthly, 0);
  const registerPageviews = sumMetric(registerPage, 0);
  const attempted         = eventCount('register_attempted');
  const success           = eventCount('register_success');
  const failed            = eventCount('register_failed');
  const pct = (n: number, d: number) => (d > 0 ? +(n / d).toFixed(4) : 0);

  return {
    configured:  true,
    property_id: propertyId,
    date_range:  { start: startDate, end: 'today' },
    totals: {
      users:     totalUsers,
      sessions:  sumMetric(monthly, 1),
      pageviews: sumMetric(monthly, 2),
    },
    by_month: monthly.map(r => ({
      // yearMonth comes back as YYYYMM; hyphenate to match the Supabase halves.
      month:     `${r.dims[0].slice(0, 4)}-${r.dims[0].slice(4)}`,
      users:     num(r.metrics[0]),
      sessions:  num(r.metrics[1]),
      pageviews: num(r.metrics[2]),
    })),
    channels: channels.map(r => ({
      channel:  r.dims[0],
      sessions: num(r.metrics[0]),
      users:    num(r.metrics[1]),
    })),
    landing_pages: landing.map(r => ({
      page:        r.dims[0],
      sessions:    num(r.metrics[0]),
      bounce_rate: +num(r.metrics[1]).toFixed(4),
    })),
    register_funnel: {
      register_pageviews:  registerPageviews,
      register_attempted:  attempted,
      register_success:    success,
      register_failed:     failed,
      visitor_to_signup:   pct(success, totalUsers),
      pageview_to_attempt: pct(attempted, registerPageviews),
      attempt_to_success:  pct(success, attempted),
    },
    failure_reasons: failureReasons,
  };
}

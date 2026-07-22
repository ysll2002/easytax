import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getValidToken } from '@/lib/hmrc';

// HMRC ticket 2026-NQM717 flagged FPH errors specifically on Business Details
// (MTD). The `validation-feedback` endpoint returns per-endpoint feedback for
// the last request our software made to each supported API in the past 30
// days. Query the ones EasyTax actually calls so we can see which headers
// HMRC flagged as invalid / missing / potentially invalid.
const FEEDBACK_APIS = [
  'business-details-mtd',
  'obligations-mtd',
  'self-assessment-mtd',
  'self-employment-business-mtd',
  'individual-calculations-mtd',
  'individuals-disclosures-mtd',
  'individuals-dividends-income-mtd',
  'individuals-reliefs-mtd',
  'individuals-savings-income-mtd',
  'self-assessment-accounts-mtd',
  'self-assessment-assist-mtd',
  'business-source-adjustable-summary-mtd',
  'vat-mtd',
];

const SANDBOX = 'https://test-api.service.hmrc.gov.uk';

type HeaderFeedback = {
  header: string;
  value?: string;
  code: string;
  errors?: { code: string; message: string }[];
  warnings?: { code: string; message: string }[];
};

type RequestFeedback = {
  path: string;
  method: string;
  requestTimestamp: string;
  code: string;
  headers?: HeaderFeedback[];
  crossValidation?: { headers: string[]; code: string; errors?: { code: string; message: string }[] }[];
};

type ApiFeedback = {
  api: string;
  status: number | null;
  ok: boolean;
  error?: string;
  requests?: RequestFeedback[];
};

export const maxDuration = 60;

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let token: string;
  try {
    token = await getValidToken(session.user.profileId);
  } catch {
    return NextResponse.json({ error: 'No HMRC connection. Connect first.' }, { status: 400 });
  }

  const results: ApiFeedback[] = [];
  for (const api of FEEDBACK_APIS) {
    // Space requests out to stay under the sandbox 60 req/min throttle.
    if (results.length > 0) await new Promise(r => setTimeout(r, 900));
    const entry: ApiFeedback = { api, status: null, ok: false };
    results.push(entry);
    try {
      const res = await fetch(
        `${SANDBOX}/test/fraud-prevention-headers/${api}/validation-feedback`,
        {
          signal: AbortSignal.timeout(8000),
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.hmrc.1.0+json',
          },
        },
      );
      entry.status = res.status;
      entry.ok = res.ok;
      const body = await res.text().catch(() => '');
      try {
        const parsed = JSON.parse(body) as { requests?: RequestFeedback[] };
        entry.requests = parsed.requests ?? [];
      } catch {
        entry.error = body.slice(0, 200) || 'Non-JSON response';
      }
    } catch (err) {
      entry.error = err instanceof Error ? err.message : String(err);
    }
  }

  // Aggregate a compact summary — total requests observed, per-code counts,
  // and a flat list of every distinct (api, header, error.code) tuple.
  type Issue = { api: string; endpoint: string; timestamp: string; header: string; code: string; message: string; kind: 'error' | 'warning' };
  const issues: Issue[] = [];
  let observedRequests = 0;
  for (const api of results) {
    for (const req of api.requests ?? []) {
      observedRequests += 1;
      for (const h of req.headers ?? []) {
        for (const e of h.errors ?? []) issues.push({ api: api.api, endpoint: `${req.method} ${req.path}`, timestamp: req.requestTimestamp, header: h.header, code: e.code, message: e.message, kind: 'error' });
        for (const w of h.warnings ?? []) issues.push({ api: api.api, endpoint: `${req.method} ${req.path}`, timestamp: req.requestTimestamp, header: h.header, code: w.code, message: w.message, kind: 'warning' });
      }
      for (const c of req.crossValidation ?? []) {
        for (const e of c.errors ?? []) issues.push({ api: api.api, endpoint: `${req.method} ${req.path}`, timestamp: req.requestTimestamp, header: c.headers.join('+'), code: e.code, message: e.message, kind: 'error' });
      }
    }
  }

  const errorCount   = issues.filter(i => i.kind === 'error').length;
  const warningCount = issues.filter(i => i.kind === 'warning').length;

  return NextResponse.json({
    summary: {
      apisQueried: results.length,
      observedRequests,
      errorCount,
      warningCount,
    },
    issues,
    apis: results,
  });
}

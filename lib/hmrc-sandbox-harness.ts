// Shared plumbing for the HMRC sandbox coverage harnesses
// (app/api/hmrc/sandbox-test/**). Route files can only export route handlers,
// so the request helper lives here rather than in one route for the others
// to import.

import { NextResponse } from 'next/server';
import { HMRC_SANDBOX_BASE as BASE, IS_HMRC_PRODUCTION } from '@/lib/hmrc-env';

export { BASE as HARNESS_BASE };

export type ApiResult = {
  name: string;
  endpoint: string;
  method: string;
  status: number | null;
  ok: boolean;
  data?: unknown;
  error?: string;
};

export async function call(
  results: ApiResult[],
  name: string,
  endpoint: string,
  method: string,
  token: string,
  fph: Record<string, string>,
  opts: { accept?: string; body?: unknown; scenario?: string } = {},
): Promise<unknown> {
  const entry: ApiResult = { name, endpoint, method, status: null, ok: false };
  results.push(entry);
  // HMRC sandbox throttles around 60 req/min per token. Space requests out
  // by ~900ms so 40+ calls fit inside maxDuration without triggering 429.
  if (results.length > 1) await new Promise(r => setTimeout(r, 900));
  try {
    const res = await fetch(`${BASE}${endpoint}`, {
      method,
      signal: AbortSignal.timeout(8000),
      headers: {
        Authorization:  `Bearer ${token}`,
        Accept:         opts.accept ?? 'application/vnd.hmrc.2.0+json',
        'Content-Type': 'application/json',
        ...fph,
        ...(opts.scenario ? { 'Gov-Test-Scenario': opts.scenario } : {}),
      },
      ...(opts.body != null ? { body: JSON.stringify(opts.body) } : {}),
    });
    entry.status = res.status;
    entry.ok     = res.ok || res.status === 204;
    const text = await res.text().catch(() => '');
    try { entry.data = JSON.parse(text); } catch { entry.data = text.slice(0, 200) || null; }
    return entry.data;
  } catch (err) {
    entry.status = null;
    entry.error  = err instanceof Error ? err.message : String(err);
    return null;
  }
}

// A row for a call deliberately not made because an earlier call it depends
// on returned no ID. The page renders these as "Skipped", not as failures.
export function skipped(results: ApiResult[], name: string, method: string, why: string) {
  results.push({ name, endpoint: '(skipped)', method, status: null, ok: false, error: `Skipped: ${why}` });
}

// The harness always talks to the sandbox, so it needs a *sandbox* access
// token. Where HMRC_ENV=production the stored token was issued by production
// HMRC, and every call would come back 401 INVALID_CREDENTIALS — forty red
// rows that say nothing about the APIs. Refuse up front and say where to run.
export function productionGuard(): NextResponse | null {
  if (!IS_HMRC_PRODUCTION) return null;
  return NextResponse.json(
    {
      error:
        'This harness calls the HMRC sandbox and needs a sandbox token, but this deployment is connected to ' +
        'production HMRC. Run it on staging.easytax.vip, connected with a sandbox test user.',
    },
    { status: 409 },
  );
}

// Current UK tax year, e.g. "2026-27" (6 April → 5 April).
export function currentTaxYear(now = new Date()) {
  const yr = (now.getMonth() > 3 || (now.getMonth() === 3 && now.getDate() >= 6))
    ? now.getFullYear() : now.getFullYear() - 1;
  return `${yr}-${String(yr + 1).slice(2)}`;
}

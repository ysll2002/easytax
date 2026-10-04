'use client';
import { useState } from 'react';
import { CheckCircle2, XCircle, MinusCircle, Loader2, Play } from 'lucide-react';
import Link from 'next/link';
import { hmrcFetch } from '@/lib/hmrc-client';

type ApiResult = {
  name: string;
  endpoint: string;
  method: string;
  status: number | null;
  ok: boolean;
  data?: unknown;
  error?: string;
};

type TestReport = {
  summary: string;
  passed: number;
  failed: number;
  total: number;
  debug: { hmrcEnv: string; baseUrl: string; tokenStart: string; tokenLen: number };
  context: {
    nino: string; ninoSource?: string;
    vrn: string;  vrnSource?: string;
    businessId: string; taxYear: string;
  };
  results: ApiResult[];
};

// The route reports calls it deliberately did not make (no VRN, no open VAT
// obligation, no calculationId) as `status: null` with an error starting
// "Skipped:". Those are not failures and should not look like them.
function isSkipped(r: ApiResult) {
  return r.status === null && (r.error ?? '').startsWith('Skipped');
}

// Skipped rows carry "GET /path" in `endpoint`; executed rows carry the bare
// path. Strip the method so the row never reads "GET GET /path".
function displayEndpoint(r: ApiResult) {
  const prefix = `${r.method} `;
  return r.endpoint.startsWith(prefix) ? r.endpoint.slice(prefix.length) : r.endpoint;
}

// HMRC's error code (e.g. INVALID_SCOPE, DUPLICATE_SUBMISSION), so a failed
// row says why without having to expand it.
function hmrcErrorCode(r: ApiResult): string | null {
  if (r.ok || !r.data || typeof r.data !== 'object') return null;
  const d = r.data as { code?: string; errors?: { code?: string }[] };
  const nested = d.errors?.[0]?.code;
  if (nested && d.code === 'BUSINESS_ERROR') return nested;
  return d.code ?? nested ?? null;
}

export default function SandboxTestPage() {
  const [running,  setRunning]  = useState(false);
  const [report,   setReport]   = useState<TestReport | null>(null);
  const [error,    setError]    = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  async function runTests() {
    setRunning(true);
    setError('');
    setReport(null);
    try {
      const res  = await hmrcFetch('/api/hmrc/sandbox-test');
      const text = await res.text();
      let data: TestReport & { error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        setError(`Server returned non-JSON (status ${res.status}): ${text.slice(0, 300)}`);
        return;
      }
      if (!res.ok || data.error) { setError(data.error ?? 'Unknown error'); return; }
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <Link href="/dashboard/individual" className="text-sm mb-6 inline-block" style={{ color: '#9A8F83', textDecoration: 'none' }}>
        ← Back to Self Assessment
      </Link>

      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3" style={{ backgroundColor: '#F0EBE1', color: '#C4622D', border: '1px solid #C4622D30' }}>
          HMRC Sandbox
        </div>
        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#1C1208' }}>
          API Coverage Test
        </h1>
        <p className="text-sm mt-1" style={{ color: '#9A8F83' }}>
          Calls all subscribed HMRC sandbox APIs and reports results.
        </p>
      </div>

      <button
        onClick={runTests}
        disabled={running}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm mb-8"
        style={{ backgroundColor: running ? '#9A8F83' : '#C4622D', color: '#FDFCF8', border: 'none', cursor: running ? 'not-allowed' : 'pointer' }}
      >
        {running
          ? <><Loader2 size={16} className="animate-spin" /> Running tests…</>
          : <><Play size={14} /> Run All API Tests</>}
      </button>

      {error && (
        <div className="p-4 rounded-xl mb-6 text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>{error}</div>
      )}

      {report && (
        <div>
          {/* Summary bar */}
          <div className="p-5 rounded-2xl mb-6" style={{ backgroundColor: '#1C1208' }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs mb-1" style={{ color: '#9A8F83' }}>RESULTS</p>
                <p className="font-bold text-lg" style={{ color: '#FDFCF8' }}>{report.summary}</p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: '#6B8E6E' }}>{report.passed}</p>
                  <p className="text-xs" style={{ color: '#9A8F83' }}>passed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: '#EF4444' }}>{report.failed}</p>
                  <p className="text-xs" style={{ color: '#9A8F83' }}>failed</p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([
                ['nino', 'ninoSource'],
                ['vrn', 'vrnSource'],
                ['businessId', null],
                ['taxYear', null],
              ] as const).map(([k, sourceKey]) => {
                // Where the value came from, under the value itself. Without
                // this, a stored VRN and a hardcoded default looked identical
                // on this page — which is exactly how 2026-09-14 lost an hour
                // to a VAT number nobody had actually set.
                const source = sourceKey ? report.context[sourceKey] : null;
                return (
                  <div key={k}>
                    <p className="text-xs uppercase" style={{ color: '#4A4035' }}>{k}</p>
                    <p className="text-xs font-mono font-semibold" style={{ color: '#C4622D' }}>{report.context[k]}</p>
                    {source && (
                      <p className="text-xs mt-0.5" style={{ color: '#9A8F83' }}>{source}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid #2E2418' }}>
              <p className="text-xs mb-1" style={{ color: '#4A4035' }}>DEBUG</p>
              <p className="text-xs font-mono" style={{ color: '#9A8F83' }}>
                env: <span style={{ color: '#C4622D' }}>{report.debug.hmrcEnv}</span> ·
                base: <span style={{ color: '#C4622D' }}>{report.debug.baseUrl}</span> ·
                token: <span style={{ color: '#C4622D' }}>{report.debug.tokenStart}… ({report.debug.tokenLen} chars)</span>
              </p>
            </div>
          </div>

          {/* Results list */}
          <div className="space-y-2">
            {report.results.map((r, i) => {
              const skipped = isSkipped(r);
              const code    = hmrcErrorCode(r);
              const tone = r.ok
                ? { border: '#D1FAE5', bg: '#F0FDF4', pillBg: '#DCFCE7', pillFg: '#16A34A' }
                : skipped
                  ? { border: '#E8E2DA', bg: '#FAF8F4', pillBg: '#F0EBE1', pillFg: '#7A6F63' }
                  : { border: '#FEE2E2', bg: '#FFF5F5', pillBg: '#FEE2E2', pillFg: '#DC2626' };
              return (
              <div key={i} className="rounded-xl overflow-hidden" style={{ border: `1.5px solid ${tone.border}` }}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  style={{ backgroundColor: tone.bg, cursor: 'pointer', border: 'none' }}
                  onClick={() => setExpanded(expanded === `${i}` ? null : `${i}`)}
                >
                  {r.ok
                    ? <CheckCircle2 size={16} color="#16A34A" className="flex-shrink-0" />
                    : skipped
                      ? <MinusCircle size={16} color="#7A6F63" className="flex-shrink-0" />
                      : <XCircle     size={16} color="#DC2626" className="flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: '#1C1208' }}>{r.name}</p>
                    <p className="text-xs font-mono truncate" style={{ color: '#9A8F83' }}>{r.method} {displayEndpoint(r)}</p>
                    {skipped && <p className="text-xs mt-0.5" style={{ color: '#7A6F63' }}>{r.error}</p>}
                  </div>
                  {code && (
                    <span className="text-xs font-mono flex-shrink-0" style={{ color: '#DC2626' }}>{code}</span>
                  )}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tone.pillBg, color: tone.pillFg }}>
                    {skipped ? 'Skipped' : (r.status ?? '—')}
                  </span>
                </button>
                {expanded === `${i}` && (
                  <div className="px-4 pb-4 pt-1" style={{ backgroundColor: tone.bg, borderTop: '1px solid #E8E2DA' }}>
                    {r.error && !skipped && <p className="text-xs mb-2" style={{ color: '#DC2626' }}>Error: {r.error}</p>}
                    <pre className="text-xs overflow-auto p-3 rounded-lg" style={{ backgroundColor: '#1C1208', color: '#C4622D', maxHeight: '240px' }}>
                      {JSON.stringify(r.data ?? {}, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

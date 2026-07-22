'use client';
import { useState } from 'react';
import Link from 'next/link';

type FphResult = {
  status: number;
  result: {
    code?: string;
    message?: string;
    errors?: { code: string; message: string; headers?: string[] }[];
    warnings?: { code: string; message: string; headers?: string[] }[];
  };
  headers: Record<string, string>;
  error?: string;
};

type FeedbackIssue = {
  api: string;
  endpoint: string;
  timestamp: string;
  header: string;
  code: string;
  message: string;
  kind: 'error' | 'warning';
};

type FeedbackReport = {
  summary: { apisQueried: number; observedRequests: number; errorCount: number; warningCount: number; codeCounts?: Record<string, number> };
  issues: FeedbackIssue[];
  apis: { api: string; status: number | null; ok: boolean; error?: string; requests?: unknown[] }[];
  error?: string;
};

export default function FphTestPage() {
  const [result, setResult] = useState<FphResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackReport | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/hmrc/test-fph');
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ status: 0, result: {}, headers: {}, error: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const runFeedback = async () => {
    setFeedbackLoading(true);
    setFeedback(null);
    setFeedbackError('');
    try {
      const res  = await fetch('/api/hmrc/fph-feedback');
      const data = (await res.json()) as FeedbackReport;
      if (data.error) setFeedbackError(data.error);
      else setFeedback(data);
    } catch (e) {
      setFeedbackError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const passed = result && !result.error && result.status === 200 &&
    (!result.result.errors || result.result.errors.length === 0);

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <Link href="/dashboard/individual" className="text-sm mb-6 inline-block" style={{ color: '#9A8F83' }}>← Back</Link>
      <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
        Fraud Prevention Headers
      </h1>
      <p style={{ color: '#9A8F83', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Validate your FPH headers against HMRC's sandbox Test API.
      </p>

      <button
        onClick={run}
        disabled={loading}
        className="px-6 py-3 rounded-xl text-sm font-medium mb-8"
        style={{ backgroundColor: '#1C1208', color: '#FDFCF8', opacity: loading ? 0.6 : 1 }}
      >
        {loading ? 'Testing…' : 'Run FPH Test'}
      </button>

      {result && (
        <div className="space-y-6">
          {/* Overall status */}
          <div className="p-5 rounded-2xl" style={{
            backgroundColor: passed ? '#E2EDE2' : '#F5E4D8',
            border: `1px solid ${passed ? '#6B8E6E40' : '#C4622D40'}`,
          }}>
            <p className="font-semibold" style={{ color: passed ? '#6B8E6E' : '#C4622D' }}>
              {passed ? '✓ All headers valid' : result.error ? `✗ Error: ${result.error}` : `✗ Validation issues found (HTTP ${result.status})`}
            </p>
            {result.result.message && (
              <p className="text-sm mt-1" style={{ color: '#4A4035' }}>{result.result.message}</p>
            )}
          </div>

          {/* Errors */}
          {result.result.errors && result.result.errors.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#C4622D' }}>Errors</p>
              <div className="space-y-2">
                {result.result.errors.map((e, i) => (
                  <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: '#F5E4D8', border: '1px solid #C4622D20' }}>
                    <p className="text-sm font-semibold" style={{ color: '#C4622D' }}>{e.code}</p>
                    <p className="text-sm mt-0.5" style={{ color: '#4A4035' }}>{e.message}</p>
                    {e.headers && <p className="text-xs mt-1" style={{ color: '#9A8F83' }}>Headers: {e.headers.join(', ')}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {result.result.warnings && result.result.warnings.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#C9963D' }}>Warnings</p>
              <div className="space-y-2">
                {result.result.warnings.map((w, i) => (
                  <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: '#F5EDDC', border: '1px solid #C9963D20' }}>
                    <p className="text-sm font-semibold" style={{ color: '#C9963D' }}>{w.code}</p>
                    <p className="text-sm mt-0.5" style={{ color: '#4A4035' }}>{w.message}</p>
                    {w.headers && <p className="text-xs mt-1" style={{ color: '#9A8F83' }}>Headers: {w.headers.join(', ')}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Headers sent */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9A8F83' }}>Headers Sent</p>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #DDD5C8' }}>
              {Object.entries(result.headers).map(([k, v], i) => (
                <div key={k} className="flex gap-4 px-4 py-2.5 text-xs" style={{
                  backgroundColor: i % 2 === 0 ? '#FDFCF8' : '#F0EBE1',
                  borderTop: i > 0 ? '1px solid #DDD5C8' : 'none',
                }}>
                  <span className="font-mono shrink-0" style={{ color: '#9A8F83', minWidth: '260px' }}>{k}</span>
                  <span className="font-mono truncate" style={{ color: v ? '#1C1208' : '#C4622D' }}>
                    {v || '(empty)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Validation-Feedback section — HMRC's per-API feedback on our last
          request. Independent from the /validate above; this is the endpoint
          HMRC asked us to consult in ticket 2026-NQM717. */}
      <div className="mt-12 pt-8" style={{ borderTop: '1px solid #EEE4D3' }}>
        <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.4rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
          Validation Feedback (per-API)
        </h2>
        <p style={{ color: '#9A8F83', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          HMRC feedback on the actual FPH headers we sent to each production endpoint in the last 30 days. Run the sandbox test harness first so recent requests exist to inspect.
        </p>

        <button
          onClick={runFeedback}
          disabled={feedbackLoading}
          className="px-6 py-3 rounded-xl text-sm font-medium mb-6"
          style={{ backgroundColor: '#1C1208', color: '#FDFCF8', opacity: feedbackLoading ? 0.6 : 1 }}
        >
          {feedbackLoading ? 'Fetching feedback…' : 'Fetch validation feedback'}
        </button>

        {feedbackError && (
          <div className="p-4 rounded-xl mb-4 text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
            {feedbackError}
          </div>
        )}

        {feedback && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl" style={{
              backgroundColor: feedback.summary.errorCount === 0 ? '#E2EDE2' : '#F5E4D8',
              border: `1px solid ${feedback.summary.errorCount === 0 ? '#6B8E6E40' : '#C4622D40'}`,
            }}>
              <p className="font-semibold" style={{ color: feedback.summary.errorCount === 0 ? '#6B8E6E' : '#C4622D' }}>
                {feedback.summary.errorCount === 0 ? '✓ No FPH errors reported' : `✗ ${feedback.summary.errorCount} error${feedback.summary.errorCount === 1 ? '' : 's'} reported`}
              </p>
              <p className="text-sm mt-1" style={{ color: '#4A4035' }}>
                {feedback.summary.observedRequests} recent requests inspected across {feedback.summary.apisQueried} APIs · {feedback.summary.warningCount} warnings
              </p>
              {feedback.summary.codeCounts && Object.keys(feedback.summary.codeCounts).length > 0 && (
                <div className="mt-3 pt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono" style={{ color: '#4A4035', borderTop: '1px solid #C4622D20' }}>
                  {Object.entries(feedback.summary.codeCounts).sort((a, b) => b[1] - a[1]).map(([code, count]) => (
                    <span key={code}>{code}: {count}</span>
                  ))}
                </div>
              )}
            </div>

            {feedback.issues.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#C4622D' }}>Issues</p>
                <div className="space-y-2">
                  {feedback.issues.map((iss, i) => (
                    <div key={i} className="p-4 rounded-xl" style={{
                      backgroundColor: iss.kind === 'error' ? '#F5E4D8' : '#F5EDDC',
                      border: `1px solid ${iss.kind === 'error' ? '#C4622D20' : '#C9963D20'}`,
                    }}>
                      <p className="text-sm font-semibold" style={{ color: iss.kind === 'error' ? '#C4622D' : '#C9963D' }}>
                        {iss.header} — {iss.code}
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: '#4A4035' }}>{iss.message}</p>
                      <p className="text-xs mt-1 font-mono" style={{ color: '#9A8F83' }}>
                        {iss.api} · {iss.endpoint}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <details>
              <summary className="text-xs font-semibold uppercase tracking-wide cursor-pointer" style={{ color: '#9A8F83' }}>Raw per-API responses ({feedback.apis.length})</summary>
              <div className="mt-3 space-y-2">
                {feedback.apis.map((api, i) => (
                  <div key={i} className="p-3 rounded-lg text-xs font-mono" style={{ backgroundColor: '#FAFAF8', border: '1px solid #E8E2DA' }}>
                    <p style={{ color: api.ok ? '#6B8E6E' : '#C4622D' }}>
                      {api.api} — HTTP {api.status ?? 'error'} · {api.requests?.length ?? 0} requests
                    </p>
                    {api.error && <p style={{ color: '#C4622D' }}>{api.error}</p>}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

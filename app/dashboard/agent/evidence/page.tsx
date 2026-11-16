'use client';
// Sandbox evidence for HMRC SDST's Agent Authorisation 2.0 production
// request: runs each of the six endpoints they listed and produces their
// "Endpoint / Timestamp" table ready to paste into the reply.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, card, h1Style, h2Style, input, labelStyle, primaryBtn, secondaryBtn } from '../ui';

type Row = { endpoint: string; method: string; path: string; timestamp: string; status: number | null; ok: boolean; detail?: string };
type Phase1 = { arn: string; rows: Row[]; client: { userId: string; password: string; nino: string; postcode: string; invitationId: string | null; clientActionUrl: string | null } };

// SDST's wording and order, exactly as in their email.
const SDST_ENDPOINTS = [
  'Create a new authorisation',
  'Get all authorisation requests for the last 30 days',
  'Get an invitation by id',
  'Cancel an invitation by id',
  'Get Status of a Relationship',
  'De-authorise an existing client relationship',
];

const STORE = 'easytax.agentEvidence.v1';

function fmt(ts: string) {
  const d = new Date(ts);
  const uk = d.toLocaleString('en-GB', { timeZone: 'Europe/London', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${d.toISOString().replace(/\.\d{3}Z$/, 'Z')} (UK ${uk})`;
}

export default function AgentEvidencePage() {
  const [phase1, setPhase1] = useState<Phase1 | null>(null);
  const [phase2, setPhase2] = useState<Row[]>([]);
  const [nino, setNino] = useState('');
  const [postcode, setPostcode] = useState('');
  const [busy, setBusy] = useState<'' | 'invitations' | 'relationship'>('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Survives a reload between the phases (the client accepts in another tab).
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) ?? 'null');
      if (s?.phase1) { setPhase1(s.phase1); setNino(s.phase1.client.nino); setPostcode(s.phase1.client.postcode); }
      if (s?.phase2) setPhase2(s.phase2);
    } catch { /* storage unavailable */ }
  }, []);
  function save(p1: Phase1 | null, p2: Row[]) {
    try { localStorage.setItem(STORE, JSON.stringify({ phase1: p1, phase2: p2 })); } catch { /* ignore */ }
  }

  async function runInvitations() {
    setBusy('invitations'); setError('');
    try {
      const r = await api<Phase1>('/api/agent/sandbox-evidence', { method: 'POST', body: JSON.stringify({ phase: 'invitations' }) });
      setPhase1(r); setPhase2([]); setNino(r.client.nino); setPostcode(r.client.postcode); save(r, []);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(''); }
  }

  async function runRelationship() {
    setBusy('relationship'); setError('');
    try {
      const r = await api<{ rows: Row[] }>('/api/agent/sandbox-evidence', { method: 'POST', body: JSON.stringify({ phase: 'relationship', nino, postcode }) });
      setPhase2(r.rows); save(phase1, r.rows);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(''); }
  }

  const all = [...(phase1?.rows ?? []), ...phase2];
  // Per SDST endpoint, the most recent call — preferring a successful one.
  const pick = (name: string) => {
    const calls = all.filter(r => r.endpoint === name);
    return [...calls].reverse().find(r => r.ok) ?? calls[calls.length - 1];
  };
  const emailText = [
    `Agent Reference Number (sandbox): ${phase1?.arn ?? '—'}`,
    '',
    'Endpoint / Timestamp (UTC)',
    '',
    ...SDST_ENDPOINTS.map(n => {
      const r = pick(n);
      return `${n} / ${r ? `${new Date(r.timestamp).toISOString().replace(/\.\d{3}Z$/, 'Z')} (HTTP ${r.status ?? 'no response'})` : 'not yet run'}`;
    }),
  ].join('\n');

  async function copy() {
    try { await navigator.clipboard.writeText(emailText); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <Link href="/dashboard/agent" className="text-sm mb-4 inline-block" style={{ color: '#6B6256', textDecoration: 'none' }}>← Agent clients</Link>
      <h1 style={h1Style}>Agent Authorisation — sandbox evidence</h1>
      <p className="text-sm mb-6" style={{ color: '#4A4035', lineHeight: 1.6 }}>
        Calls each endpoint HMRC asked about against the sandbox, with your agent sign-in and fraud prevention headers, and records the time of each call.
        Sign in to HMRC as your sandbox agent on the Agent clients page first.
      </p>

      {error && <div role="alert" className="p-4 rounded-xl mb-4 text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>{error}</div>}

      <section style={card} className="mb-4">
        <h2 style={h2Style}>1. Authorisation requests</h2>
        <p className="text-sm mb-3" style={{ color: '#4A4035' }}>
          Creates a sandbox client, then: create a request, list requests, get it by id, and create and cancel a second one.
        </p>
        <button onClick={runInvitations} disabled={!!busy} style={{ ...primaryBtn, minHeight: 44, opacity: busy ? 0.6 : 1 }}>
          {busy === 'invitations' ? 'Running…' : phase1 ? 'Run again' : 'Run'}
        </button>

        {phase1 && (
          <div className="mt-4 text-sm" style={{ color: '#4A4035', lineHeight: 1.6 }}>
            <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>Let the client accept (optional, gives a 2xx in step 2)</p>
            <p>
              Open the link in a private window and sign in as the client — user ID <code>{phase1.client.userId}</code>, password <code>{phase1.client.password}</code> — then accept.
            </p>
            {phase1.client.clientActionUrl
              ? <p className="mt-1 break-all"><a href={phase1.client.clientActionUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#A04E1C' }}>{phase1.client.clientActionUrl}</a></p>
              : <p className="mt-1">HMRC did not return a link — see the rows below.</p>}
          </div>
        )}
      </section>

      <section style={card} className="mb-4">
        <h2 style={h2Style}>2. Relationship</h2>
        <p className="text-sm mb-3" style={{ color: '#4A4035' }}>
          Checks the relationship with the client, then de-authorises it. Without acceptance HMRC answers 404 / 403, which still records the call.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <label><span style={labelStyle}>Client NINO</span><input style={input} value={nino} onChange={e => setNino(e.target.value)} /></label>
          <label><span style={labelStyle}>Client postcode</span><input style={input} value={postcode} onChange={e => setPostcode(e.target.value)} /></label>
        </div>
        <button onClick={runRelationship} disabled={!!busy || !nino || !postcode} style={{ ...primaryBtn, minHeight: 44, opacity: busy || !nino || !postcode ? 0.6 : 1 }}>
          {busy === 'relationship' ? 'Running…' : 'Run'}
        </button>
      </section>

      {all.length > 0 && (
        <section style={card} className="mb-4">
          <h2 style={h2Style}>Calls made</h2>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {all.map((r, i) => (
              <li key={i} className="text-sm" style={{ borderBottom: '1px solid #EEE4D3', paddingBottom: '0.5rem' }}>
                <div className="flex flex-wrap items-center gap-2">
                  <span style={{ fontWeight: 600, color: '#1C1208' }}>{r.endpoint}</span>
                  <span style={{ padding: '0.05rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, color: r.ok ? '#2F5232' : '#991B1B', backgroundColor: r.ok ? '#E2EDE2' : '#FEE2E2' }}>
                    {r.status ?? 'no response'}
                  </span>
                </div>
                <div className="font-mono text-xs break-all" style={{ color: '#6B6256' }}>{r.method} {r.path}</div>
                <div className="text-xs" style={{ color: '#4A4035' }}>{fmt(r.timestamp)}</div>
                {r.detail && <div className="text-xs" style={{ color: '#991B1B' }}>{r.detail}</div>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {phase1 && (
        <section style={card}>
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 style={{ ...h2Style, marginBottom: 0 }}>For the reply to HMRC</h2>
            <button onClick={copy} style={{ ...secondaryBtn, minHeight: 44 }}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
          <pre className="text-xs p-3 rounded-lg overflow-auto" style={{ backgroundColor: '#F0EBE1', color: '#1C1208', whiteSpace: 'pre-wrap' }}>{emailText}</pre>
        </section>
      )}
    </div>
  );
}

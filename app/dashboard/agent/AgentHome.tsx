'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { AgentClientView } from '@/lib/agent-types';
import { card, input, labelStyle, primaryBtn, secondaryBtn, h1Style, h2Style, StatusBadge, api } from './ui';

type Setup = { available: boolean; arn: string | null; connected: boolean; connectedAt: string | null };
type TestUser = { kind: string; userId: string; password: string; name: string | null; arn: string | null; nino: string | null; postcode: string | null; vrn: string | null; vatRegDate: string | null };

const CALLBACK_ERRORS: Record<string, string> = {
  state_mismatch: 'The HMRC sign-in could not be matched to this browser session. Please try again.',
  access_denied: 'HMRC sign-in was cancelled or refused.',
  token_exchange: 'HMRC did not accept the sign-in. Please try again.',
  arn_missing: 'Save your Agent Reference Number first.',
  db: 'Your HMRC sign-in could not be saved. Please try again.',
};

export default function AgentHome() {
  const sp = useSearchParams();
  const [setup, setSetup] = useState<Setup | null>(null);
  const [clients, setClients] = useState<AgentClientView[]>([]);
  const [arn, setArn] = useState('');
  const [error, setError] = useState(CALLBACK_ERRORS[sp.get('error') ?? ''] ?? '');
  const [status, setStatus] = useState(sp.get('connected') ? 'Signed in to HMRC as an agent.' : '');
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testUsers, setTestUsers] = useState<TestUser[]>([]);
  const [prefill, setPrefill] = useState<Partial<TestUser> | null>(null);

  const load = useCallback(async () => {
    try {
      const s = await api<Setup>('/api/agent/setup');
      setSetup(s); setArn(a => a || s.arn || '');
      if (s.arn) setClients((await api<{ clients: AgentClientView[] }>('/api/agent/clients')).clients);
    } catch (e) { setError((e as Error).message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function saveArn(e: React.FormEvent) {
    e.preventDefault(); setError(''); setBusy(true);
    try { await api('/api/agent/setup', { method: 'POST', body: JSON.stringify({ arn }) }); setStatus('Agent Reference Number saved.'); await load(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  async function refreshAll() {
    setBusy(true); setError('');
    try {
      // One call for every request sent in the last 30 days, then each client
      // is confirmed (accepted requests and live relationships).
      await api('/api/agent/invitations');
      for (const c of clients) await api(`/api/agent/clients/${c.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'refresh' }) });
      await load(); setStatus('Authorisations checked with HMRC.');
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  async function makeTestUser(kind: string) {
    setBusy(true); setError('');
    try {
      const u = await api<TestUser>('/api/agent/sandbox-users', { method: 'POST', body: JSON.stringify({ kind }) });
      setTestUsers(t => [u, ...t]);
      if (kind === 'agent' && u.arn) setArn(u.arn);
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  if (!setup) return <div className="p-4 sm:p-8" style={{ color: '#6B6256' }}>Loading…</div>;
  const step = !setup.arn ? 1 : !setup.connected ? 2 : 3;

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <h1 style={h1Style}>Agent clients</h1>
      <p className="mb-5" style={{ color: '#4A4035', lineHeight: 1.6, maxWidth: '42rem' }}>
        File Making Tax Digital updates for your clients as their HMRC-authorised agent. Your client approves you once on HMRC&apos;s website; after that you keep their records and submit their Income Tax quarterly updates and VAT returns here.
      </p>

      <div aria-live="polite">{status && <p role="status" className="mb-4 text-sm" style={{ color: '#2F5232', fontWeight: 600 }}>{status}</p>}</div>
      {error && <div role="alert" className="p-4 rounded-xl mb-4 text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>{error}</div>}

      <p className="mb-4 text-xs font-semibold" style={{ color: '#7A4A1E' }}>HMRC sandbox — test data only. No real client data is sent to HMRC.</p>

      {step < 3 && (
        <section style={card} className="mb-6" aria-labelledby="setup-h">
          <h2 id="setup-h" style={h2Style}>Set up agent mode</h2>
          <ol className="space-y-4" style={{ listStyle: 'none', padding: 0 }}>
            <li>
              <p className="text-sm font-semibold mb-2" style={{ color: '#1C1208' }}>1. Your Agent Reference Number {setup.arn && <span style={{ color: '#2F5232' }}>✓ {setup.arn}</span>}</p>
              <form onSubmit={saveArn} className="flex flex-wrap gap-2 items-end">
                <label style={{ flex: '1 1 14rem' }}>
                  <span style={labelStyle}>ARN (from your Agent Services Account)</span>
                  <input value={arn} onChange={e => setArn(e.target.value)} placeholder="XARN1234567" required style={input} autoComplete="off" />
                </label>
                <button type="submit" disabled={busy} style={primaryBtn}>{setup.arn ? 'Update' : 'Save'}</button>
              </form>
            </li>
            <li>
              <p className="text-sm font-semibold mb-2" style={{ color: step >= 2 ? '#1C1208' : '#6B6256' }}>2. Sign in to HMRC with your agent Government Gateway</p>
              <p className="text-sm mb-2" style={{ color: '#4A4035' }}>Use the Government Gateway user ID for your agent services account, not your personal one.</p>
              {step >= 2 ? <a href="/api/agent/hmrc/connect" style={primaryBtn}>Sign in to HMRC as an agent →</a>
                : <span className="text-sm" style={{ color: '#6B6256' }}>Save your ARN first.</span>}
            </li>
          </ol>
        </section>
      )}

      <SandboxHelper busy={busy} users={testUsers} onCreate={makeTestUser} onUse={u => { setPrefill(u); setShowAdd(true); }} />

      {setup.arn && (
        <section aria-labelledby="clients-h">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 id="clients-h" style={{ ...h2Style, marginBottom: 0 }}>Your clients ({clients.length})</h2>
            <div className="flex flex-wrap gap-2">
              {setup.connected && clients.length > 0 && <button type="button" onClick={refreshAll} disabled={busy} style={secondaryBtn}>{busy ? 'Checking…' : 'Check authorisations'}</button>}
              {setup.connected && <button type="button" aria-expanded={showAdd} onClick={() => setShowAdd(s => !s)} style={primaryBtn}>+ Add client</button>}
            </div>
          </div>
          {setup.connected
            ? <p className="text-xs mb-3" style={{ color: '#4A4035' }}>Signed in to HMRC as agent {setup.arn}. <a href="/api/agent/hmrc/connect" style={{ color: '#A04E1C' }}>Sign in again</a></p>
            : <p className="text-xs mb-3" style={{ color: '#7A4A1E' }}>Sign in to HMRC as an agent (step 2 above) to add clients and send authorisation requests.</p>}

          {showAdd && <AddClient key={prefill?.userId ?? 'blank'} prefill={prefill} onDone={async (msg) => { setShowAdd(false); setPrefill(null); setStatus(msg); await load(); }} onCancel={() => { setShowAdd(false); setPrefill(null); }} />}

          {clients.length === 0 ? (
            <div style={{ ...card, backgroundColor: '#F0EBE1' }}>
              <p className="text-sm" style={{ color: '#4A4035' }}>No clients yet.{setup.connected ? ' Add a client to send them an authorisation request from HMRC.' : ''}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse', color: '#1C1208' }}>
                <caption className="sr-only">Your clients and their HMRC authorisation status</caption>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #DDD5C8' }}>
                    <th scope="col" style={{ padding: '0.5rem' }}>Client</th>
                    <th scope="col" style={{ padding: '0.5rem' }}>Income Tax</th>
                    <th scope="col" style={{ padding: '0.5rem' }}>VAT</th>
                    <th scope="col" style={{ padding: '0.5rem' }}>Next step</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #F0EBE1' }}>
                      <td style={{ padding: '0.6rem 0.5rem' }}>
                        <Link href={`/dashboard/agent/clients/${c.id}`} style={{ color: '#A04E1C', fontWeight: 600 }}>{c.display_name}</Link>
                        <div className="text-xs" style={{ color: '#4A4035' }}>{[c.nino, c.vrn && `VRN ${c.vrn}`].filter(Boolean).join(' · ')}</div>
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem' }}>{c.nino ? <StatusBadge status={c.itsa_status} /> : '—'}</td>
                      <td style={{ padding: '0.6rem 0.5rem' }}>{c.vrn ? <StatusBadge status={c.vat_status} /> : '—'}</td>
                      <td style={{ padding: '0.6rem 0.5rem' }}><NextStep client={c} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function SandboxHelper({ busy, users, onCreate, onUse }: { busy: boolean; users: TestUser[]; onCreate: (k: string) => void; onUse: (u: TestUser) => void }) {
  return (
    <details className="mb-6" style={{ ...card, backgroundColor: '#F7F2E9' }}>
      <summary className="text-sm font-semibold" style={{ color: '#1C1208', cursor: 'pointer' }}>Sandbox test users</summary>
      <p className="text-sm mt-2 mb-3" style={{ color: '#4A4035', lineHeight: 1.6 }}>
        Create HMRC sandbox users to try the whole flow: an agent (gives you an ARN and the sign-in for step 2), then an individual or VAT business to add as a client. Keep the user ID and password: the client needs them to accept your request on HMRC&apos;s sandbox site.
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        <button type="button" disabled={busy} onClick={() => onCreate('agent')} style={secondaryBtn}>Create test agent</button>
        <button type="button" disabled={busy} onClick={() => onCreate('individual')} style={secondaryBtn}>Create test individual client</button>
        <button type="button" disabled={busy} onClick={() => onCreate('organisation')} style={secondaryBtn}>Create test VAT business client</button>
      </div>
      {users.map(u => (
        <div key={u.userId} className="text-xs mb-2 p-3 rounded-lg" style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8', color: '#1C1208', fontFamily: 'ui-monospace, monospace', overflowWrap: 'anywhere' }}>
          <strong>{u.kind}</strong>{u.name ? ` — ${u.name}` : ''}<br />
          user ID {u.userId} · password {u.password}
          {u.arn && <><br />ARN {u.arn}</>}
          {u.nino && <><br />NINO {u.nino} · postcode {u.postcode ?? '?'}</>}
          {u.vrn && <><br />VRN {u.vrn} · VAT registered {u.vatRegDate ?? '?'}</>}
          {u.kind !== 'agent' && <div className="mt-1"><button type="button" onClick={() => onUse(u)} style={{ ...secondaryBtn, fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>Add as client</button></div>}
        </div>
      ))}
    </details>
  );
}

function AddClient({ prefill, onDone, onCancel }: { prefill: Partial<TestUser> | null; onDone: (msg: string) => void; onCancel: () => void }) {
  const [name, setName] = useState(prefill?.name ?? '');
  const [clientType, setClientType] = useState<'personal' | 'business'>(prefill?.kind === 'organisation' ? 'business' : 'personal');
  const [itsa, setItsa] = useState(prefill ? !!prefill.nino : true);
  const [vat, setVat] = useState(prefill ? !!prefill.vrn : false);
  const [nino, setNino] = useState(prefill?.nino ?? '');
  const [postcode, setPostcode] = useState(prefill?.postcode ?? '');
  const [agentType, setAgentType] = useState<'main' | 'supporting'>('main');
  const [vrn, setVrn] = useState(prefill?.vrn ?? '');
  const [vatRegDate, setVatRegDate] = useState(prefill?.vatRegDate ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const r = await api<{ id: string; results: Record<string, string> }>('/api/agent/clients', {
        method: 'POST',
        body: JSON.stringify({ displayName: name, clientType, services: [itsa && 'itsa', vat && 'vat'].filter(Boolean), nino, postcode, agentType, vrn, vatRegDate }),
      });
      const failed = Object.entries(r.results).filter(([, v]) => v !== 'sent');
      onDone(failed.length
        ? `Client added, but HMRC refused a request — ${failed.map(([k, v]) => `${k === 'itsa' ? 'Income Tax' : 'VAT'}: ${v}`).join('; ')}. Open the client to fix and resend.`
        : 'Client added and authorisation request sent. Open the client to copy the link they need.');
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="mb-6" style={{ ...card, backgroundColor: '#F7F2E9' }} aria-labelledby="add-client-h">
      <h3 id="add-client-h" className="font-semibold mb-3" style={{ color: '#1C1208' }}>Add a client</h3>
      {error && <p role="alert" className="mb-3 text-sm" style={{ color: '#991B1B' }}>{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <label><span style={labelStyle}>Client name</span><input required value={name} onChange={e => setName(e.target.value)} style={input} /></label>
        <fieldset>
          <legend style={labelStyle}>Client is</legend>
          <div className="flex gap-3 text-sm" style={{ color: '#1C1208' }}>
            <label className="flex items-center gap-1.5"><input type="radio" name="ctype" checked={clientType === 'personal'} onChange={() => setClientType('personal')} /> An individual or sole trader</label>
            <label className="flex items-center gap-1.5"><input type="radio" name="ctype" checked={clientType === 'business'} onChange={() => { setClientType('business'); setItsa(false); setVat(true); }} /> A company or partnership</label>
          </div>
        </fieldset>
      </div>

      <fieldset className="mb-3">
        <legend style={labelStyle}>Ask to act for</legend>
        <div className="flex flex-wrap gap-4 text-sm" style={{ color: '#1C1208' }}>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={itsa} disabled={clientType === 'business'} onChange={e => setItsa(e.target.checked)} /> Income Tax (Making Tax Digital)</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={vat} onChange={e => setVat(e.target.checked)} /> VAT</label>
        </div>
      </fieldset>

      {itsa && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <label><span style={labelStyle}>National Insurance number</span><input required value={nino} onChange={e => setNino(e.target.value)} placeholder="QQ123456C" style={input} autoComplete="off" /></label>
          <label><span style={labelStyle}>Postcode HMRC has for them</span><input required value={postcode} onChange={e => setPostcode(e.target.value)} placeholder="SW1A 1AA" style={input} autoComplete="off" /></label>
          <label><span style={labelStyle}>Your role</span>
            <select value={agentType} onChange={e => setAgentType(e.target.value as 'main' | 'supporting')} style={input}>
              <option value="main">Main agent</option>
              <option value="supporting">Supporting agent</option>
            </select>
          </label>
        </div>
      )}
      {vat && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <label><span style={labelStyle}>VAT registration number</span><input required value={vrn} onChange={e => setVrn(e.target.value)} inputMode="numeric" placeholder="123456789" style={input} autoComplete="off" /></label>
          <label><span style={labelStyle}>VAT registration date</span><input required type="date" value={vatRegDate} onChange={e => setVatRegDate(e.target.value)} style={input} /></label>
        </div>
      )}
      <p className="text-xs mb-3" style={{ color: '#4A4035' }}>HMRC checks these details against its records before it creates the request.</p>
      <div className="flex gap-2">
        <button type="submit" disabled={busy || (!itsa && !vat)} style={{ ...primaryBtn, opacity: busy ? 0.6 : 1 }}>{busy ? 'Sending…' : 'Add client and send request'}</button>
        <button type="button" onClick={onCancel} style={secondaryBtn}>Cancel</button>
      </div>
    </form>
  );
}

// What the agent should do next for a client, as a link straight to the
// part of the client page where they do it.
const NEEDS_REQUEST = ['none', 'rejected', 'expired', 'cancelled', 'deauthorised'];
function nextStep(c: AgentClientView): { label: string; hint: string; anchor: string; primary: boolean } {
  const statuses = [c.nino ? c.itsa_status : null, c.vrn ? c.vat_status : null].filter(Boolean) as string[];
  if (statuses.includes('pending'))
    return { label: 'Send link to client', hint: 'Your client approves you on HMRC', anchor: 'auth-h', primary: true };
  if (statuses.some(s => NEEDS_REQUEST.includes(s)))
    return { label: 'Request authorisation', hint: 'Ask HMRC to send a request', anchor: 'auth-h', primary: true };
  if (statuses.includes('authorised'))
    return { label: 'File updates', hint: 'See what is due and what is done', anchor: 'due-h', primary: false };
  return { label: 'Open', hint: '', anchor: '', primary: false };
}

function NextStep({ client }: { client: AgentClientView }) {
  const n = nextStep(client);
  return (
    <div>
      <Link
        href={`/dashboard/agent/clients/${client.id}${n.anchor ? `#${n.anchor}` : ''}`}
        style={{ ...(n.primary ? primaryBtn : secondaryBtn), padding: '0.4rem 0.9rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
        aria-label={`${n.label} for ${client.display_name}`}
      >
        {n.label}
      </Link>
      {n.hint && <div className="text-xs mt-1" style={{ color: '#4A4035' }}>{n.hint}</div>}
    </div>
  );
}

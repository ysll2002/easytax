'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { AgentClientView, AuthStatus } from '@/lib/agent-types';
import RecordsClient from '@/app/dashboard/reconcile/RecordsClient';
import { card, primaryBtn, secondaryBtn, h1Style, h2Style, StatusBadge, api } from '../../ui';

type ItsaOb = { periodKey: string; periodStartDate: string; periodEndDate: string; dueDate: string; receivedDate?: string; status: 'Open' | 'Fulfilled' };
type VatOb = { periodKey: string; start: string; end: string; due: string; received?: string; status: 'O' | 'F' };
type Obligations = { itsa?: { obligations?: ItsaOb[]; error?: string }; vat?: { obligations?: VatOb[]; error?: string } };
type Filing = { id: string; tax_year: string; filing_type: string; period_start: string | null; period_end: string | null; turnover: number | null; net_profit: number | null; submitted_at: string };

const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
// UK tax year a date falls in, e.g. 2026-07-06 → 2026-27.
function taxYearOf(d: string) {
  const [y, m, day] = d.split('-').map(Number);
  const start = m > 4 || (m === 4 && day >= 6) ? y : y - 1;
  return `${start}-${String(start + 1).slice(2)}`;
}

export default function ClientDetail({ initial }: { initial: AgentClientView }) {
  const [client, setClient] = useState(initial);
  const [obs, setObs] = useState<Obligations | null>(null);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const loadFilingData = useCallback(async () => {
    try { setObs(await api<Obligations>(`/api/agent/clients/${client.id}/obligations`)); } catch (e) { setError((e as Error).message); }
    try { setFilings((await api<{ filings: Filing[] }>(`/api/hmrc/history?clientId=${client.id}`)).filings); } catch { /* history is optional */ }
  }, [client.id]);
  useEffect(() => { loadFilingData(); }, [loadFilingData, client.itsa_status, client.vat_status]);

  async function act(action: string, service?: 'itsa' | 'vat', confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(action + (service ?? '')); setError(''); setStatus('');
    try {
      const r = await api<{ client: AgentClientView }>(`/api/agent/clients/${client.id}`, { method: 'PATCH', body: JSON.stringify({ action, service }) });
      setClient(r.client);
      setStatus({ refresh: 'Checked with HMRC.', invite: 'New authorisation request sent.', cancel: 'Request cancelled.', deauthorise: 'You are no longer authorised for this client.' }[action] ?? 'Done.');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(''); }
  }

  const authRow = (service: 'itsa' | 'vat') => {
    const isItsa = service === 'itsa';
    const configured = isItsa ? !!client.nino : !!client.vrn;
    if (!configured) return null;
    const st = (isItsa ? client.itsa_status : client.vat_status) as AuthStatus;
    const link = isItsa ? client.itsa_client_action_url : client.vat_client_action_url;
    const expires = isItsa ? client.itsa_expires_on : client.vat_expires_on;
    const label = isItsa ? 'Income Tax' : 'VAT';
    return (
      <div className="py-3" style={{ borderTop: '1px solid #F0EBE1' }}>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-semibold text-sm" style={{ color: '#1C1208', minWidth: '6rem' }}>{label}</span>
          <StatusBadge status={st} />
          <span className="text-xs" style={{ color: '#4A4035' }}>{isItsa ? `${client.nino} · ${client.itsa_agent_type} agent` : `VRN ${client.vrn}`}</span>
        </div>
        {st === 'pending' && link && (
          <div className="text-sm mt-2" style={{ color: '#1C1208' }}>
            <p className="mb-1">Send your client this link. They sign in with their own Government Gateway to approve you{expires ? ` before ${fmt(expires)}` : ''}:</p>
            <div className="flex flex-wrap gap-2 items-center">
              <code className="text-xs p-2 rounded" style={{ backgroundColor: '#F0EBE1', overflowWrap: 'anywhere', flex: '1 1 16rem' }}>{link}</code>
              <button type="button" style={secondaryBtn} onClick={() => navigator.clipboard?.writeText(link).then(() => setStatus('Link copied.'))}>Copy link</button>
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          {st === 'pending' && <button type="button" style={secondaryBtn} disabled={!!busy} onClick={() => act('cancel', service, `Cancel the ${label} authorisation request?`)}>Cancel request</button>}
          {['none', 'rejected', 'expired', 'cancelled', 'deauthorised'].includes(st) && <button type="button" style={secondaryBtn} disabled={!!busy} onClick={() => act('invite', service)}>Send a new request</button>}
          {st === 'authorised' && <button type="button" style={secondaryBtn} disabled={!!busy} onClick={() => act('deauthorise', service, `Stop acting for ${client.display_name} for ${label}? HMRC will remove your authorisation, and your client would have to approve you again.`)}>Stop acting for client</button>}
        </div>
      </div>
    );
  };

  // A quarter is done once HMRC says it is fulfilled, or once it has been
  // submitted from EasyTax (HMRC's sandbox does not always update the
  // obligation afterwards, and this stops it being filed twice).
  const filedQuarter = (start: string, end: string) =>
    filings.find(f => f.filing_type === 'quarterly' && f.period_start === start && f.period_end === end);
  const itsaAll = obs?.itsa?.obligations ?? [];
  const itsaTodo = itsaAll.filter(o => o.status === 'Open' && !filedQuarter(o.periodStartDate, o.periodEndDate))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const itsaDone = itsaAll.filter(o => o.status === 'Fulfilled' || filedQuarter(o.periodStartDate, o.periodEndDate))
    .sort((a, b) => b.periodStartDate.localeCompare(a.periodStartDate));
  const vatAll = obs?.vat?.obligations ?? [];
  const vatTodo = vatAll.filter(o => o.status === 'O').sort((a, b) => a.due.localeCompare(b.due));
  const vatDone = vatAll.filter(o => o.status === 'F').sort((a, b) => b.start.localeCompare(a.start));
  // Filings made from EasyTax that HMRC did not return as an obligation.
  const otherFilings = filings.filter(f => !(f.filing_type === 'quarterly' && itsaAll.some(o => o.periodStartDate === f.period_start && o.periodEndDate === f.period_end)));
  const anyAuthorised = client.itsa_status === 'authorised' || client.vat_status === 'authorised';
  const todoCount = itsaTodo.length + vatTodo.length;
  const doneCount = itsaDone.length + vatDone.length + otherFilings.length;

  return (
    <div>
      <div className="p-4 sm:p-8 pb-0 sm:pb-0 max-w-4xl">
        <Link href="/dashboard/agent" className="text-sm mb-4 inline-block" style={{ color: '#4A4035' }}>← All clients</Link>
        <h1 style={h1Style}>{client.display_name}</h1>
        <p className="text-sm mb-4" style={{ color: '#4A4035' }}>{client.client_type === 'business' ? 'Company or partnership' : 'Individual or sole trader'}{client.last_checked_at ? ` · checked with HMRC ${fmt(client.last_checked_at)}` : ''}</p>

        <div aria-live="polite">{status && <p role="status" className="mb-3 text-sm" style={{ color: '#2F5232', fontWeight: 600 }}>{status}</p>}</div>
        {error && <div role="alert" className="p-4 rounded-xl mb-4 text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>{error}</div>}

        <section style={card} className="mb-6" aria-labelledby="auth-h">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="auth-h" style={{ ...h2Style, marginBottom: 0 }}>HMRC authorisation</h2>
            <button type="button" style={secondaryBtn} disabled={!!busy} onClick={() => act('refresh')}>{busy === 'refresh' ? 'Checking…' : 'Check with HMRC'}</button>
          </div>
          {authRow('itsa')}
          {authRow('vat')}
        </section>

        <section style={card} className="mb-6" aria-labelledby="due-h">
          <h2 id="due-h" style={h2Style}>To do{obs && anyAuthorised ? ` (${todoCount})` : ''}</h2>
          {!anyAuthorised ? (
            <p className="text-sm" style={{ color: '#4A4035' }}>Once your client approves you, their Income Tax and VAT deadlines appear here.</p>
          ) : !obs ? (
            <p className="text-sm" style={{ color: '#6B6256' }}>Loading…</p>
          ) : (
            <>
              {obs.itsa?.error && <p className="text-sm mb-2" style={{ color: '#991B1B' }}>Income Tax — HMRC: {obs.itsa.error}</p>}
              {obs.vat?.error && <p className="text-sm mb-2" style={{ color: '#991B1B' }}>VAT — HMRC: {obs.vat.error}</p>}
              {todoCount === 0 && !obs.itsa?.error && !obs.vat?.error && <p className="text-sm" style={{ color: '#4A4035' }}>Nothing to file right now.</p>}
              {itsaTodo.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#1C1208' }}>Income Tax quarterly updates</h3>
                  <ul className="space-y-2" style={{ listStyle: 'none', padding: 0 }}>
                    {itsaTodo.map(o => (
                      <li key={o.periodKey + o.periodStartDate} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span style={{ color: '#1C1208' }}>{fmt(o.periodStartDate)} – {fmt(o.periodEndDate)} · due {fmt(o.dueDate)}</span>
                        <Link style={primaryBtn} href={`/dashboard/individual/quarter?clientId=${client.id}&taxYear=${taxYearOf(o.periodStartDate)}&start=${o.periodStartDate}&end=${o.periodEndDate}&key=${o.periodKey}`}>Prepare update</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {vatTodo.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#1C1208' }}>VAT returns</h3>
                  <ul className="space-y-2" style={{ listStyle: 'none', padding: 0 }}>
                    {vatTodo.map(o => (
                      <li key={o.periodKey} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span style={{ color: '#1C1208' }}>{fmt(o.start)} – {fmt(o.end)} · due {fmt(o.due)}</span>
                        <Link style={primaryBtn} href={`/dashboard/individual/vat?clientId=${client.id}`}>Prepare VAT return</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>

        {anyAuthorised && obs && doneCount > 0 && (
          <section style={card} className="mb-6" aria-labelledby="done-h">
            <h2 id="done-h" style={h2Style}>Done ({doneCount})</h2>
            <ul className="space-y-2 text-sm" style={{ listStyle: 'none', padding: 0, color: '#1C1208' }}>
              {itsaDone.map(o => {
                const f = filedQuarter(o.periodStartDate, o.periodEndDate);
                const when = f?.submitted_at ?? o.receivedDate;
                return (
                  <li key={'i' + o.periodKey + o.periodStartDate} className="flex flex-wrap items-center gap-2">
                    <span aria-hidden="true" style={{ color: '#2F5232', fontWeight: 700 }}>✓</span>
                    <span>Income Tax quarterly update · {fmt(o.periodStartDate)} – {fmt(o.periodEndDate)}</span>
                    <span style={{ color: '#4A4035' }}>
                      {when ? `· submitted ${fmt(when)}` : '· submitted'}{f ? ' from EasyTax' : ''}
                    </span>
                  </li>
                );
              })}
              {vatDone.map(o => (
                <li key={'v' + o.periodKey} className="flex flex-wrap items-center gap-2">
                  <span aria-hidden="true" style={{ color: '#2F5232', fontWeight: 700 }}>✓</span>
                  <span>VAT return · {fmt(o.start)} – {fmt(o.end)}</span>
                  <span style={{ color: '#4A4035' }}>{o.received ? `· submitted ${fmt(o.received)}` : '· submitted'}</span>
                </li>
              ))}
              {otherFilings.map(f => (
                <li key={'f' + f.id} className="flex flex-wrap items-center gap-2">
                  <span aria-hidden="true" style={{ color: '#2F5232', fontWeight: 700 }}>✓</span>
                  <span>{f.filing_type === 'quarterly' ? 'Income Tax quarterly update' : f.filing_type} · {f.period_start && f.period_end ? `${fmt(f.period_start)} – ${fmt(f.period_end)}` : f.tax_year}</span>
                  <span style={{ color: '#4A4035' }}>· submitted {fmt(f.submitted_at)} from EasyTax</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <section id="records" aria-label={`${client.display_name} records`} style={{ borderTop: '1px solid #DDD5C8' }}>
        <RecordsClient
          clientId={client.id}
          headingLevel={2}
          title={`${client.display_name}'s records`}
          intro="The income and expenses you keep for this client. Quarterly updates are added up from the records you mark as business income or expense."
        />
      </section>
    </div>
  );
}

'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, TrendingDown, CheckCircle2, ChevronRight, Info, RefreshCw, FileText } from 'lucide-react';
import { hmrcFetch } from '@/lib/hmrc-client';
import { CsvImport } from '@/app/dashboard/reconcile/RecordsClient';
import { recordsUrl, aiSortIds } from '@/lib/records-client';

const EXPENSE_FIELDS = [
  { key: 'costOfGoods',          label: 'Cost of goods / materials',    hint: 'Stock, raw materials, direct costs' },
  { key: 'staffCosts',           label: 'Staff costs',                   hint: 'Wages, salaries, subcontractor fees' },
  { key: 'travelCosts',          label: 'Travel & subsistence',          hint: 'Business travel, fuel, accommodation' },
  { key: 'premisesRunningCosts', label: 'Premises & running costs',      hint: 'Rent, utilities, insurance' },
  { key: 'adminCosts',           label: 'Admin & office costs',          hint: 'Stationery, phone, postage' },
  { key: 'advertisingCosts',     label: 'Advertising & marketing',       hint: 'Website, ads, social media' },
  { key: 'professionalFees',     label: 'Professional fees',             hint: 'Accountant, legal, consultant fees' },
  { key: 'otherExpenses',        label: 'Other allowable expenses',      hint: 'Any other deductible costs' },
];

function currentTaxYear() {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${String(year + 1).slice(2)}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

const num = (v: string | undefined) => { const n = parseFloat(v || '0'); return Number.isFinite(n) ? n : 0; };
const round2 = (n: number) => Math.round(n * 100) / 100;
const sameMoney = (a: number, b: number) => Math.abs(a - b) < 0.005;
const gbp = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
type Figures = { turnover: number; expenses: Record<string, number> };

function QuarterForm() {
  const params  = useSearchParams();
  const router  = useRouter();
  void router;
  const start   = params.get('start') ?? '';
  const end     = params.get('end')   ?? '';
  // Allow overriding via ?taxYear=2025-26 — useful for HMRC sandbox testing
  // because the sandbox test data is typically populated for the previous
  // tax year, not the current one.
  const taxYear = params.get('taxYear') ?? currentTaxYear();
  // ?clientId= : an agent filing for one of their clients. Same review and
  // submit flow; the figures come from that client's records and the update
  // is sent with the agent's HMRC sign-in.
  const clientId = params.get('clientId');
  const clientQs = clientId ? `clientId=${encodeURIComponent(clientId)}` : '';
  const backHref = clientId ? `/dashboard/agent/clients/${clientId}` : '/dashboard/individual/tasks';
  // An agent's client has no separate records page: their records are
  // managed here, by uploading the statement for the quarter.
  const recordsHref = clientId ? null : '/dashboard/reconcile';

  const [turnover,   setTurnover]   = useState('');
  const [expenses,   setExpenses]   = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState('');
  const [hinted,     setHinted]     = useState<string | null>(null);
  const [pulling,    setPulling]    = useState(false);
  const [pulledAt,   setPulledAt]   = useState<string | null>(null);
  const [unreviewed, setUnreviewed] = useState(0);
  // What the records currently add up to. Any figure the customer changes is
  // compared against this and saved to their records as an adjustment.
  const [baseline,   setBaseline]   = useState<Figures | null>(null);
  const [noRecords,  setNoRecords]  = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [notice,     setNotice]     = useState('');
  const [sorting,    setSorting]    = useState<{ done: number; total: number } | null>(null);
  const [savingAdj,  setSavingAdj]  = useState(false);
  const [adjSaved,   setAdjSaved]   = useState(0);
  // Review step before anything is sent to HMRC (WCAG 3.3.4 Error Prevention:
  // a submission has legal effect, so the figures are shown back for
  // confirmation first).
  const [confirming, setConfirming] = useState(false);
  const canSubmit = pulledAt != null;

  // HMRC MTD-ITSA production requirement (In-Year #6): quarterly figures
  // come from the customer's digital record (their business records). The
  // figures are filled in from the records for the period. The customer may
  // change a figure; before anything is sent, every change is saved to their
  // records as an adjustment record dated at the end of the period, and the
  // figures are pulled from the records again. What is sent to HMRC is
  // therefore always what the records add up to.
  const handlePull = useCallback(async (): Promise<Figures | null> => {
    if (!start || !end) { setError('Missing period dates in URL.'); return null; }
    setPulling(true); setError(''); setConfirming(false);
    try {
      const res  = await fetch(`/api/individual/quarter-totals?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}${clientQs ? `&${clientQs}` : ''}`);
      const data = await res.json();
      if (res.status === 404 && data.error === 'no_records') {
        setNoRecords(true); setShowImport(true); setPulledAt(null); setBaseline(null);
        setTurnover(''); setExpenses({});
        return null;
      }
      if (!res.ok || data.error) {
        setError(data.detail ?? data.error ?? 'Failed to pull totals from your records.');
        return null;
      }
      setNoRecords(false);
      const fig: Figures = { turnover: Number(data.turnover) || 0, expenses: {} };
      const next: Record<string, string> = {};
      for (const f of EXPENSE_FIELDS) {
        fig.expenses[f.key] = Number(data.expenses[f.key] ?? 0) || 0;
        next[f.key] = String(fig.expenses[f.key]);
      }
      setTurnover(String(fig.turnover));
      setExpenses(next);
      setBaseline(fig);
      setUnreviewed(Number(data.unreviewed) || 0);
      setPulledAt(new Date().toISOString());
      return fig;
    } finally {
      setPulling(false);
    }
  }, [start, end, clientQs]);

  // Fill the figures in as soon as the page opens.
  useEffect(() => { if (start && end) handlePull(); }, [start, end, handlePull]);

  // After a statement is uploaded here: sort this period's new records with
  // AI, then fill the figures in from the records.
  async function afterImport(msg: string) {
    setShowImport(false);
    setNotice(msg.replace(' AI is now sorting them.', ''));
    try {
      const res = await fetch(`${recordsUrl(clientId)}${clientId ? '&' : '?'}start=${start}&end=${end}`);
      const data = await res.json();
      const ids: string[] = (data.records ?? []).filter((r: { category: string }) => r.category === 'unreviewed').map((r: { id: string }) => r.id);
      if (ids.length) {
        const { sorted } = await aiSortIds(clientId, ids, (done, total) => setSorting({ done, total }));
        setNotice(n => `${n} AI sorted ${sorted} of the ${ids.length} records in this quarter.`);
      }
    } catch { /* sorting is a convenience; the figures are still pulled below */ }
    finally { setSorting(null); }
    await handlePull();
  }

  // Changes the customer made to the figures, as adjustment records.
  function pendingAdjustments() {
    if (!baseline) return [];
    const out: { description: string; amount: number; category: 'business_income' | 'business_expense'; expenseBucket?: string; label: string; from: number; to: number }[] = [];
    const t = round2(num(turnover));
    if (!sameMoney(t, baseline.turnover)) {
      out.push({ label: 'Turnover', from: baseline.turnover, to: t, category: 'business_income', amount: round2(t - baseline.turnover),
        description: `Adjustment to turnover, quarterly update ${start} to ${end}` });
    }
    for (const f of EXPENSE_FIELDS) {
      const v = round2(num(expenses[f.key]));
      const was = baseline.expenses[f.key] ?? 0;
      if (!sameMoney(v, was)) {
        // Expenses are stored as money out (negative), so a higher expense is a more negative record.
        out.push({ label: f.label, from: was, to: v, category: 'business_expense', expenseBucket: f.key, amount: round2(-(v - was)),
          description: `Adjustment to ${f.label.toLowerCase()}, quarterly update ${start} to ${end}` });
      }
    }
    return out;
  }

  // Save the changes to the records, then pull the figures from the records
  // again so the submission matches them.
  async function saveAdjustments(): Promise<boolean> {
    const adj = pendingAdjustments();
    if (!adj.length) return true;
    setSavingAdj(true); setError('');
    try {
      const res = await fetch(recordsUrl(clientId), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'manual', records: adj.map(a => ({ date: end, description: a.description, amount: a.amount, category: a.category, expenseBucket: a.expenseBucket })) }),
      });
      if (!res.ok) throw new Error();
      const wanted = { t: round2(num(turnover)), e: Object.fromEntries(EXPENSE_FIELDS.map(f => [f.key, round2(num(expenses[f.key]))])) };
      const fig = await handlePull();
      if (!fig || !sameMoney(fig.turnover, wanted.t) || EXPENSE_FIELDS.some(f => !sameMoney(fig.expenses[f.key] ?? 0, wanted.e[f.key]))) {
        setError('Your changes were saved to your records, but the records now add up to different figures. Please check the figures below.');
        return false;
      }
      setAdjSaved(n => n + adj.length);
      return true;
    } catch {
      setError('Your changes could not be saved to your records, so nothing has been sent. Please try again.');
      return false;
    } finally {
      setSavingAdj(false);
    }
  }

  const totalExpenses = EXPENSE_FIELDS.reduce((sum, f) => sum + parseFloat(expenses[f.key] || '0'), 0);
  const income        = parseFloat(turnover || '0');
  const profit        = income - totalExpenses;
  const estTax        = Math.max(0, Math.max(0, profit - 12570) * 0.2 + Math.max(0, profit - 12570) * 0.09);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirming) {
      if (!(await saveAdjustments())) return;
      setConfirming(true);
      return;
    }
    setError('');
    setSubmitting(true);

    const expObj: Record<string, number> = {};
    for (const f of EXPENSE_FIELDS) expObj[f.key] = parseFloat(expenses[f.key] || '0');

    try {
      const res = await hmrcFetch(`/api/hmrc/submit-quarter${clientQs ? `?${clientQs}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxYear, periodStartDate: start, periodEndDate: end, turnover: income, expenses: expObj }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setConfirming(false); return; }
      setSubmitted(true);
    } catch {
      setError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="p-4 sm:p-8 max-w-lg">
        <div className="flex flex-col items-center text-center py-12">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#F0EBE1' }}>
            <CheckCircle2 size={36} color="#A04E1C" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
            Update Submitted
          </h1>
          <p className="text-sm mb-2" style={{ color: '#6B6256' }}>
            {start && end ? `${fmtDate(start)} – ${fmtDate(end)}` : taxYear}
          </p>
          <p className="text-sm mb-8" style={{ color: '#4A4035' }}>
            Your quarterly update has been sent to HMRC successfully.
          </p>
          <Link href={backHref}
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full font-semibold text-sm"
            style={{ backgroundColor: '#1C1208', color: '#FDFCF8', textDecoration: 'none' }}>
            Back to Filing Overview <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <Link href={backHref} className="text-sm mb-6 inline-block" style={{ color: '#6B6256', textDecoration: 'none' }}>
        ← Back to Filing Overview
      </Link>

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3" style={{ backgroundColor: '#F0EBE1', color: '#A04E1C', border: '1px solid #A04E1C30' }}>
          Quarterly Update · {taxYear}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208' }}>
          {start ? fmtDate(start) : 'Quarterly Update'}
        </h1>
        {start && end && <p className="text-sm mt-1" style={{ color: '#6B6256' }}>to {fmtDate(end)}</p>}
        {clientId && (
          <p className="text-sm mt-2 font-semibold" style={{ color: '#7A4A1E' }}>
            You are submitting this update for a client, as their agent. <Link href={backHref} style={{ color: '#A04E1C' }}>Back to client</Link>
          </p>
        )}
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-xl mb-6 text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>{error}</div>
      )}

      {/* Where the figures come from — HMRC MTD-ITSA In-Year #6. */}
      <div className="mb-6 p-4 rounded-2xl" style={{ backgroundColor: '#F5EDDC', border: '1px solid #E5CFA8' }}>
        <div className="flex items-start gap-3">
          <FileText size={16} style={{ color: '#8B6F1F', marginTop: 3, flexShrink: 0 }} />
          <div className="flex-1 text-sm" style={{ color: '#4A4035', lineHeight: 1.55 }}>
            <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>
              {noRecords ? 'Upload the bank statement for this quarter' : 'Figures are filled in from your records'}
            </p>
            <p className="mb-2 text-xs">
              {noRecords
                ? `There are no records between ${fmtDate(start)} and ${fmtDate(end)} yet. Upload a CSV statement and MTD Buddy will sort it with AI and fill in the figures.`
                : 'You can change any figure below. When you continue, each change is saved to your records as an adjustment, so your records always match what you send to HMRC.'}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <button type="button" onClick={() => setShowImport(v => !v)} aria-expanded={showImport}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ backgroundColor: '#A04E1C', color: '#FDFCF8', border: 'none', cursor: 'pointer' }}>
                Upload CSV statement
              </button>
              <button type="button" onClick={() => handlePull()} disabled={pulling || !start || !end}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ backgroundColor: '#1C1208', color: '#FDFCF8', opacity: pulling ? 0.6 : 1, cursor: pulling ? 'wait' : 'pointer', border: 'none' }}>
                {pulling
                  ? <><div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />Filling in…</>
                  : <><RefreshCw size={12} />Refill from records</>}
              </button>
              {recordsHref && <Link href={recordsHref} className="text-xs font-semibold" style={{ color: '#A04E1C', textDecoration: 'underline' }}>See all records</Link>}
              {pulledAt && (
                <span className="text-[11px]" style={{ color: '#4B6A4E' }}>
                  ✓ Filled in {new Date(pulledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <div aria-live="polite">
              {sorting && <p role="status" className="mt-2 text-xs font-semibold" style={{ color: '#7A4A1E' }}>✦ AI is sorting this quarter&apos;s records… {sorting.done} of {sorting.total}</p>}
              {notice && !sorting && <p role="status" className="mt-2 text-xs font-semibold" style={{ color: '#4B6A4E' }}>{notice}</p>}
            </div>
            {pulledAt && unreviewed > 0 && (
              <p role="status" className="mt-2 text-xs font-semibold" style={{ color: '#8A3A12' }}>
                {unreviewed} record{unreviewed === 1 ? '' : 's'} in this period {unreviewed === 1 ? 'is' : 'are'} not yet marked as business or personal and {unreviewed === 1 ? 'is' : 'are'} not included.{' '}
                {recordsHref
                  ? <Link href={recordsHref} style={{ color: '#A04E1C', textDecoration: 'underline' }}>Review them in Records</Link>
                  : 'Change a figure below if any of them should be counted.'}
              </p>
            )}
          </div>
        </div>
        {showImport && (
          <div className="mt-4" style={{ marginLeft: 0 }}>
            <CsvImport url={recordsUrl(clientId)} onDone={afterImport} onCancel={() => setShowImport(false)} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

          {/* Left: form */}
          <div className="flex-1 space-y-6">
            <div className="p-6 rounded-2xl" style={{ border: '1.5px solid #E8E2DA', backgroundColor: '#FDFCF8' }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} color="#4B6A4E" />
                <h2 className="font-bold text-sm" style={{ color: '#1C1208' }}>Income</h2>
              </div>
              <label className="block">
                <span className="text-sm block mb-1.5" style={{ color: '#4A4035' }}>Turnover for this quarter</span>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold" style={{ color: '#6B6256' }}>£</span>
                  <input
                    type="number" min="0" step="0.01" required inputMode="decimal"
                    value={turnover} placeholder="0.00" disabled={!pulledAt}
                    onChange={e => { setTurnover(e.target.value); setConfirming(false); }}
                    className="w-full pl-8 pr-4 py-3.5 rounded-xl text-base font-semibold focus-visible:outline-2 focus-visible:outline-[#A04E1C]"
                    style={{ border: `1.5px solid ${baseline && !sameMoney(num(turnover), baseline.turnover) ? '#A04E1C' : '#DDD5C8'}`, backgroundColor: '#FFFFFF', color: '#1C1208' }}
                  />
                </div>
                <ChangedNote from={baseline?.turnover} to={num(turnover)} />
              </label>
            </div>

            <div className="p-6 rounded-2xl" style={{ border: '1.5px solid #E8E2DA', backgroundColor: '#FDFCF8' }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown size={18} color="#A04E1C" />
                <h2 className="font-bold text-sm" style={{ color: '#1C1208' }}>Allowable Expenses</h2>
              </div>
              <div className="space-y-3">
                {EXPENSE_FIELDS.map(f => (
                  <div key={f.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm" style={{ color: '#4A4035' }}>{f.label}</span>
                      <button type="button" onMouseEnter={() => setHinted(f.key)} onMouseLeave={() => setHinted(null)}
                        onClick={() => setHinted(h => h === f.key ? null : f.key)}
                        aria-label={`About ${f.label}`} aria-expanded={hinted === f.key}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#6B6256' }}>
                        <Info size={13} aria-hidden />
                      </button>
                    </div>
                    {hinted === f.key && (
                      <p className="text-xs px-2 py-1 rounded-lg mb-1" style={{ backgroundColor: '#F0EBE1', color: '#4A4035' }}>{f.hint}</p>
                    )}
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B6256' }}>£</span>
                      <input
                        type="number" min="0" step="0.01" inputMode="decimal"
                        aria-label={f.label}
                        value={expenses[f.key] ?? ''}
                        placeholder="0.00" disabled={!pulledAt}
                        onChange={e => { const v = e.target.value; setExpenses(x => ({ ...x, [f.key]: v })); setConfirming(false); }}
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl text-sm focus-visible:outline-2 focus-visible:outline-[#A04E1C]"
                        style={{ border: `1px solid ${baseline && !sameMoney(num(expenses[f.key]), baseline.expenses[f.key] ?? 0) ? '#A04E1C' : '#DDD5C8'}`, backgroundColor: '#FFFFFF', color: '#1C1208' }}
                      />
                    </div>
                    <ChangedNote from={baseline?.expenses[f.key]} to={num(expenses[f.key])} />
                  </div>
                ))}
              </div>
            </div>

            {confirming && canSubmit && (
              <div role="region" aria-labelledby="confirm-heading" className="p-5 rounded-2xl" style={{ border: '1.5px solid #1C1208', backgroundColor: '#FFFFFF' }}>
                <h2 id="confirm-heading" className="font-bold text-sm mb-3" style={{ color: '#1C1208' }}>Check before you submit to HMRC</h2>
                <dl className="text-sm space-y-1.5 mb-3" style={{ color: '#1C1208' }}>
                  <div className="flex justify-between gap-4"><dt>Period</dt><dd style={{ fontWeight: 600 }}>{start && end ? `${fmtDate(start)} – ${fmtDate(end)}` : taxYear}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Turnover</dt><dd style={{ fontWeight: 600 }}>£{income.toFixed(2)}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Total expenses</dt><dd style={{ fontWeight: 600 }}>£{totalExpenses.toFixed(2)}</dd></div>
                </dl>
                <p className="text-xs mb-4" style={{ color: '#4A4035', lineHeight: 1.55 }}>
                  These figures will be sent to HMRC as your quarterly update.{adjSaved > 0 ? ` ${adjSaved} change${adjSaved === 1 ? ' was' : 's were'} saved to your records as adjustment${adjSaved === 1 ? '' : 's'}.` : ''} If something is wrong, go back and change it. You can also correct a quarterly update later by submitting it again.
                </p>
                <button type="button" onClick={() => setConfirming(false)} className="text-sm font-semibold" style={{ background: 'none', border: 'none', padding: 0, color: '#A04E1C', textDecoration: 'underline', cursor: 'pointer' }}>
                  Go back and edit
                </button>
              </div>
            )}

            <button type="submit" disabled={submitting || savingAdj || !canSubmit}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold"
              style={{ backgroundColor: '#A04E1C', color: '#FDFCF8', opacity: (submitting || !canSubmit) ? 0.5 : 1, cursor: (submitting || !canSubmit) ? 'not-allowed' : 'pointer', border: 'none', fontSize: '0.95rem' }}
              title={!canSubmit ? 'Upload a statement or add records for this quarter first.' : undefined}>
              {savingAdj
                ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Saving your changes to records…</>
                : submitting
                ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Submitting to HMRC…</>
                : canSubmit && confirming
                ? <>Confirm and submit to HMRC <ChevronRight size={16} /></>
                : canSubmit
                ? <>Review and submit <ChevronRight size={16} /></>
                : <>Add records for this quarter first</>}
            </button>
          </div>

          {/* Right: live summary */}
          <div className="w-full lg:w-72 lg:flex-shrink-0 lg:sticky lg:top-8">
            <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid #DDD5C8' }}>
              <div className="px-5 py-4" style={{ backgroundColor: '#1C1208' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#C9BFB2' }}>LIVE SUMMARY</p>
                <p className="text-xs" style={{ color: '#A89D90' }}>
                  {start && end
                    ? `${new Date(start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : taxYear}
                </p>
              </div>
              <div className="p-5 space-y-3" style={{ backgroundColor: '#FDFCF8' }}>
                <div className="flex justify-between text-sm"><span style={{ color: '#6B6256' }}>Turnover</span><span style={{ fontWeight: 600, color: '#4B6A4E' }}>+£{income.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: '#6B6256' }}>Total expenses</span><span style={{ fontWeight: 600, color: '#A04E1C' }}>−£{totalExpenses.toFixed(2)}</span></div>
                <div style={{ borderTop: '1px solid #E8E2DA', paddingTop: '0.75rem' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold" style={{ color: '#1C1208' }}>Net profit</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: profit >= 0 ? '#4B6A4E' : '#EF4444' }}>£{profit.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4" style={{ backgroundColor: '#F0EBE1', borderTop: '1px solid #E8E2DA' }}>
                <p className="text-xs mb-1" style={{ color: '#6B6256' }}>Estimated tax on this quarter</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#A04E1C' }}>£{estTax.toFixed(2)}</p>
                <p className="text-xs mt-1" style={{ color: '#6B6256' }}>Indicative only — final bill calculated at year end.</p>
              </div>
              {EXPENSE_FIELDS.some(f => parseFloat(expenses[f.key] || '0') > 0) && (
                <div className="px-5 py-4" style={{ backgroundColor: '#F8F7F5', borderTop: '1px solid #E8E2DA' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#1C1208' }}>Expense breakdown</p>
                  {EXPENSE_FIELDS.filter(f => parseFloat(expenses[f.key] || '0') > 0).map(f => (
                    <div key={f.key} className="flex justify-between text-xs mb-1" style={{ color: '#4A4035' }}>
                      <span style={{ maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.label}</span>
                      <span>£{parseFloat(expenses[f.key]).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// Under a figure the customer changed: what the records say, and what happens.
function ChangedNote({ from, to }: { from: number | undefined; to: number }) {
  if (from == null || sameMoney(from, to)) return null;
  return (
    <p className="text-xs mt-1" style={{ color: '#7A4A1E' }}>
      Changed from {gbp(from)} in your records. It will be saved as an adjustment of {to > from ? '+' : '−'}{gbp(Math.abs(round2(to - from)))} when you continue.
    </p>
  );
}

export default function QuarterPage() {
  return <Suspense><QuarterForm /></Suspense>;
}

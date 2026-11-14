'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReconcileChat from '@/components/ReconcileChat';
import type { ReconcileAction, Tx } from '@/app/api/ai/reconcile/route';
import {
  EXPENSE_BUCKETS, suggestBucket, bucketOf,
  type BusinessRecord, type RecordCategory, type ExpenseBucket,
} from '@/lib/records';
import { parseCsv, guessColumns, extractRows, type ColumnMap, type StatementRow } from '@/lib/csv-statement';

// The Records page: the customer's digital record for MTD. Records are added
// by hand or imported from a CSV statement the customer downloads from their
// bank, then marked as business income, business expense or personal. The
// quarterly update and the company reports are added up from these records.

const CATEGORIES: { value: RecordCategory; label: string; color: string; bg: string }[] = [
  { value: 'unreviewed',       label: 'Unreviewed',       color: '#6B6256', bg: '#F0EBE1' },
  { value: 'business_income',  label: 'Business income',  color: '#4B6A4E', bg: '#E2EDE2' },
  { value: 'business_expense', label: 'Business expense', color: '#8A6418', bg: '#F5EDDC' },
  { value: 'personal',         label: 'Personal',         color: '#6B6256', bg: '#F0EBE1' },
];

type Filter = 'all' | RecordCategory;
const MAX_UNDO = 20;
const ID_CHUNK = 200;

const card = { padding: '1.25rem', borderRadius: '1rem', backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' } as const;
const input = { width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.6rem', border: '1px solid #B8AE9F', backgroundColor: '#FDFCF8', fontSize: '0.875rem', color: '#1C1208' } as const;
const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1C1208', marginBottom: '0.3rem' } as const;
const primaryBtn = { padding: '0.6rem 1.2rem', borderRadius: '2rem', border: 'none', backgroundColor: '#A04E1C', color: '#FDFCF8', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' } as const;
const secondaryBtn = { padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid #DDD5C8', backgroundColor: '#F0EBE1', color: '#1C1208', fontWeight: 500, fontSize: '0.8rem', cursor: 'pointer' } as const;

const gbp = (n: number) => `£${Math.abs(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().slice(0, 10);

async function send(method: 'PATCH' | 'DELETE', body: object) {
  const res = await fetch('/api/records', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
}

// PATCH in chunks, grouped by the value being set.
async function patchGroups(groups: Map<string, string[]>, field: 'category' | 'expenseBucket') {
  for (const [value, ids] of groups) {
    for (let i = 0; i < ids.length; i += ID_CHUNK) {
      await send('PATCH', { ids: ids.slice(i, i + ID_CHUNK), [field]: value === '' ? null : value });
    }
  }
}

export default function RecordsClient({ title, intro }: { title: string; intro: string }) {
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [history, setHistory] = useState<BusinessRecord[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [panel, setPanel] = useState<'none' | 'add' | 'import'>('none');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/records');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setRecords(data.records ?? []);
      setError('');
    } catch {
      setError('Could not load your records. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Apply a change locally, then save it. On failure, reload from the server
  // so the screen never shows something that was not saved.
  const commit = useCallback(async (next: BusinessRecord[], save: () => Promise<void>) => {
    setHistory(h => [...h.slice(-MAX_UNDO + 1), records]);
    setRecords(next);
    try { await save(); }
    catch { setError('That change could not be saved. Your records have been reloaded.'); load(); }
  }, [records, load]);

  const setCategory = (ids: string[], category: RecordCategory) => {
    const idSet = new Set(ids);
    const next = records.map(r => idSet.has(r.id) ? { ...r, category } : r);
    commit(next, () => patchGroups(new Map([[category, ids]]), 'category'));
  };

  const setBucket = (id: string, bucket: ExpenseBucket) => {
    const next = records.map(r => r.id === id ? { ...r, expense_bucket: bucket } : r);
    commit(next, () => patchGroups(new Map([[bucket, [id]]]), 'expenseBucket'));
  };

  const remove = (id: string) => {
    const r = records.find(x => x.id === id);
    if (!r || !window.confirm(`Delete "${r.description}" (${gbp(r.amount)}) on ${r.txn_date}? This cannot be undone.`)) return;
    setRecords(prev => prev.filter(x => x.id !== id));
    setHistory([]); // undo cannot bring back a deleted record
    send('DELETE', { ids: [id] }).then(() => setStatus('Record deleted.')).catch(() => { setError('The record could not be deleted.'); load(); });
  };

  const applyActions = (actions: ReconcileAction[]) => {
    let next = records;
    const groups = new Map<string, string[]>();
    for (const action of actions) {
      const idSet = new Set(action.ids);
      next = next.map(r => idSet.has(r.id) ? { ...r, category: action.category } : r);
      groups.set(action.category, [...(groups.get(action.category) ?? []), ...action.ids]);
    }
    commit(next, () => patchGroups(groups, 'category'));
  };

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    const byId = new Map(prev.map(r => [r.id, r]));
    const cats = new Map<string, string[]>();
    const buckets = new Map<string, string[]>();
    for (const r of records) {
      const before = byId.get(r.id);
      if (!before) continue;
      if (before.category !== r.category) cats.set(before.category, [...(cats.get(before.category) ?? []), r.id]);
      if (before.expense_bucket !== r.expense_bucket) {
        const k = before.expense_bucket ?? '';
        buckets.set(k, [...(buckets.get(k) ?? []), r.id]);
      }
    }
    setHistory(h => h.slice(0, -1));
    setRecords(prev);
    patchGroups(cats, 'category').then(() => patchGroups(buckets, 'expenseBucket'))
      .catch(() => { setError('Undo could not be saved. Your records have been reloaded.'); load(); });
  };

  const filtered = useMemo(() => records.filter(r => {
    if (filter !== 'all' && r.category !== filter) return false;
    if (search && !r.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [records, filter, search]);

  const counts = Object.fromEntries(CATEGORIES.map(c => [c.value, records.filter(r => r.category === c.value).length])) as Record<RecordCategory, number>;
  const income = records.filter(r => r.category === 'business_income').reduce((s, r) => s + r.amount, 0);
  const spend = records.filter(r => r.category === 'business_expense').reduce((s, r) => s - r.amount, 0);

  const chatTx: Tx[] = useMemo(() => records.map(r => ({
    transaction_id: r.id, timestamp: r.txn_date, description: r.description,
    amount: r.amount, currency: 'GBP', category: r.category,
  })), [records]);

  const onAdded = (msg: string) => { setStatus(msg); setPanel('none'); load(); };

  return (
    <div className="flex flex-col lg:flex-row h-full" style={{ minHeight: 0 }}>
      <div className="flex-1 overflow-y-auto p-4 sm:p-8" style={{ minWidth: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div style={{ maxWidth: '40rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.4rem' }}>{title}</h1>
            <p style={{ color: '#4A4035', fontSize: '0.9rem', lineHeight: 1.6 }}>{intro}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <button type="button" style={primaryBtn} aria-expanded={panel === 'add'} onClick={() => setPanel(p => p === 'add' ? 'none' : 'add')}>+ Add a record</button>
            <button type="button" style={secondaryBtn} aria-expanded={panel === 'import'} onClick={() => setPanel(p => p === 'import' ? 'none' : 'import')}>Import CSV statement</button>
            {records.length > 0 && (
              <button type="button" style={{ ...secondaryBtn, backgroundColor: chatOpen ? '#1C1208' : '#F0EBE1', color: chatOpen ? '#FDFCF8' : '#1C1208' }} aria-pressed={chatOpen} onClick={() => setChatOpen(o => !o)}>✦ AI assistant</button>
            )}
          </div>
        </div>

        <div aria-live="polite">
          {status && <p role="status" className="mb-4 text-sm" style={{ color: '#4B6A4E', fontWeight: 600 }}>{status}</p>}
        </div>
        {error && <div role="alert" className="p-4 rounded-xl mb-4 text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>{error}</div>}

        {panel === 'add' && <AddRecordForm onDone={onAdded} onCancel={() => setPanel('none')} />}
        {panel === 'import' && <CsvImport onDone={onAdded} onCancel={() => setPanel('none')} />}

        {loading ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: '#6B6256' }}>Loading your records…</p>
        ) : records.length === 0 ? (
          panel === 'none' && (
            <div style={{ ...card, backgroundColor: '#F0EBE1' }}>
              <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>No records yet</p>
              <p className="text-sm" style={{ color: '#4A4035', lineHeight: 1.6 }}>
                Add your business income and expenses one by one, or download a CSV statement from your bank&apos;s website or app and import it. EasyTax does not connect to your bank account.
              </p>
            </div>
          )
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Business income', value: gbp(income), color: '#4B6A4E' },
                { label: 'Business expenses', value: gbp(spend), color: '#8A6418' },
                { label: 'Not yet reviewed', value: String(counts.unreviewed), color: '#6B6256' },
              ].map(item => (
                <div key={item.label} style={{ padding: '1rem', borderRadius: '1rem', backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
                  <p style={{ fontSize: '0.75rem', color: '#4A4035', marginBottom: '0.3rem' }}>{item.label}</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              <div role="group" aria-label="Show records" className="flex gap-1 overflow-x-auto max-w-full" style={{ backgroundColor: '#F0EBE1', borderRadius: '2rem', padding: '0.25rem', flexShrink: 0 }}>
                {(['all', ...CATEGORIES.map(c => c.value)] as Filter[]).map(f => (
                  <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}
                    style={{ padding: '0.4rem 0.9rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 500, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', backgroundColor: filter === f ? '#1C1208' : 'transparent', color: filter === f ? '#FDFCF8' : '#4A4035' }}>
                    {f === 'all' ? `All ${records.length}` : `${CATEGORIES.find(c => c.value === f)?.label} ${counts[f as RecordCategory]}`}
                  </button>
                ))}
              </div>
              <label className="w-full sm:flex-1" style={{ minWidth: 0 }}>
                <span className="sr-only">Search records</span>
                <input type="search" placeholder="Search records…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...input, borderRadius: '2rem' }} />
              </label>
            </div>

            {filter === 'unreviewed' && filtered.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 mb-3 text-sm" style={{ color: '#4A4035' }}>
                <span>Mark all {filtered.length} shown as:</span>
                {CATEGORIES.filter(c => c.value !== 'unreviewed').map(c => (
                  <button key={c.value} type="button" style={secondaryBtn} onClick={() => setCategory(filtered.map(r => r.id), c.value)}>{c.label}</button>
                ))}
              </div>
            )}
            {history.length > 0 && (
              <button type="button" onClick={undo} className="mb-3" style={secondaryBtn}>↩ Undo last change</button>
            )}

            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none', padding: 0 }}>
              {filtered.map(r => (
                <li key={r.id} style={{ ...card, padding: '0.875rem 1rem' }}>
                  <div className="flex items-start gap-3">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 500, color: '#1C1208', fontSize: '0.9rem', overflowWrap: 'anywhere' }}>{r.description}</p>
                      <p style={{ fontSize: '0.75rem', color: '#4A4035', marginTop: '0.1rem' }}>
                        {new Date(r.txn_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {r.source === 'csv' ? ' · imported' : ' · added by hand'}
                      </p>
                    </div>
                    <p style={{ fontWeight: 700, color: r.amount >= 0 ? '#4B6A4E' : '#A04E1C', whiteSpace: 'nowrap' }}>
                      <span className="sr-only">{r.amount >= 0 ? 'Money in ' : 'Money out '}</span>
                      {r.amount >= 0 ? '+' : '−'}{gbp(r.amount)}
                    </p>
                    <button type="button" onClick={() => remove(r.id)} aria-label={`Delete ${r.description}`} style={{ background: 'none', border: 'none', color: '#6B6256', cursor: 'pointer', fontSize: '1rem', padding: '0 0.25rem' }}>✕</button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <div role="group" aria-label={`Category for ${r.description}`} className="flex flex-wrap gap-1">
                      {CATEGORIES.map(c => (
                        <button key={c.value} type="button" aria-pressed={r.category === c.value} onClick={() => r.category !== c.value && setCategory([r.id], c.value)}
                          style={{ padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', border: r.category === c.value ? `1.5px solid ${c.color}` : '1px solid transparent', backgroundColor: r.category === c.value ? c.bg : 'transparent', color: r.category === c.value ? c.color : '#4A4035' }}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                    {r.category === 'business_expense' && (
                      <label className="flex items-center gap-1 text-xs" style={{ color: '#4A4035' }}>
                        <span className="sr-only">HMRC expense category for {r.description}</span>
                        <select value={bucketOf(r)} onChange={e => setBucket(r.id, e.target.value as ExpenseBucket)} style={{ ...input, width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                          {EXPENSE_BUCKETS.map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
                        </select>
                      </label>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {filtered.length === 0 && <p style={{ color: '#6B6256', textAlign: 'center', padding: '2rem' }}>No records match your filter.</p>}
          </>
        )}
      </div>

      {chatOpen && records.length > 0 && (
        <>
          <div className="fixed inset-0 z-30 lg:hidden" style={{ backgroundColor: 'rgba(28,18,8,0.4)' }} onClick={() => setChatOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-40 lg:static lg:z-auto lg:flex-shrink-0 flex flex-col" style={{ height: '60vh', borderTop: '1px solid #DDD5C8' }}>
            <div className="flex flex-col h-full lg:w-[360px] lg:border-l lg:border-t-0" style={{ borderColor: '#DDD5C8', backgroundColor: '#FDFCF8' }}>
              <div className="flex justify-end px-3 pt-2 lg:hidden">
                <button type="button" aria-label="Close AI assistant" onClick={() => setChatOpen(false)} style={{ color: '#6B6256', fontSize: '1.25rem', background: 'none', border: 'none' }}>✕</button>
              </div>
              <div className="flex-1 min-h-0">
                <ReconcileChat transactions={chatTx} onActions={applyActions} onUndo={undo} canUndo={history.length > 0} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AddRecordForm({ onDone, onCancel }: { onDone: (msg: string) => void; onCancel: () => void }) {
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState<'business_income' | 'business_expense' | 'personal'>('business_expense');
  const [direction, setDirection] = useState<'in' | 'out'>('out');
  const [bucket, setBucket] = useState<ExpenseBucket | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!date || !description.trim() || !Number.isFinite(value) || value <= 0) {
      setError('Enter a date, a description and an amount greater than £0.');
      return;
    }
    const moneyIn = kind === 'business_income' || (kind === 'personal' && direction === 'in');
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/records', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'manual', records: [{
          date, description: description.trim(), amount: moneyIn ? value : -value, category: kind,
          expenseBucket: kind === 'business_expense' ? (bucket || suggestBucket(description)) : undefined,
        }] }),
      });
      if (!res.ok) throw new Error();
      onDone('Record added.');
    } catch {
      setError('The record could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-6" style={{ ...card, backgroundColor: '#F7F2E9' }} aria-labelledby="add-record-heading">
      <h2 id="add-record-heading" className="font-semibold mb-3" style={{ color: '#1C1208' }}>Add a record</h2>
      {error && <p role="alert" className="mb-3 text-sm" style={{ color: '#991B1B' }}>{error}</p>}
      <fieldset className="mb-3">
        <legend style={labelStyle}>Type</legend>
        <div className="flex flex-wrap gap-3 text-sm" style={{ color: '#1C1208' }}>
          {([['business_income', 'Business income'], ['business_expense', 'Business expense'], ['personal', 'Personal (not counted)']] as const).map(([v, l]) => (
            <label key={v} className="flex items-center gap-1.5"><input type="radio" name="kind" value={v} checked={kind === v} onChange={() => setKind(v)} /> {l}</label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <label><span style={labelStyle}>Date</span><input type="date" required value={date} max={today()} onChange={e => setDate(e.target.value)} style={input} /></label>
        <label className="sm:col-span-2"><span style={labelStyle}>Description</span><input type="text" required maxLength={200} value={description} onChange={e => setDescription(e.target.value)} placeholder={kind === 'business_income' ? 'e.g. Invoice 104 — Acme Ltd' : 'e.g. Train to client meeting'} style={input} /></label>
        <label><span style={labelStyle}>Amount (£)</span><input type="number" required min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} style={input} /></label>
        {kind === 'business_expense' && (
          <label className="sm:col-span-2"><span style={labelStyle}>HMRC expense category</span>
            <select value={bucket || suggestBucket(description)} onChange={e => setBucket(e.target.value as ExpenseBucket)} style={input}>
              {EXPENSE_BUCKETS.map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>
          </label>
        )}
        {kind === 'personal' && (
          <fieldset className="sm:col-span-2">
            <legend style={labelStyle}>Direction</legend>
            <div className="flex gap-3 text-sm" style={{ color: '#1C1208' }}>
              <label className="flex items-center gap-1.5"><input type="radio" name="dir" checked={direction === 'in'} onChange={() => setDirection('in')} /> Money in</label>
              <label className="flex items-center gap-1.5"><input type="radio" name="dir" checked={direction === 'out'} onChange={() => setDirection('out')} /> Money out</label>
            </div>
          </fieldset>
        )}
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Save record'}</button>
        <button type="button" onClick={onCancel} style={secondaryBtn}>Cancel</button>
      </div>
    </form>
  );
}

const NONE = -1;

function CsvImport({ onDone, onCancel }: { onDone: (msg: string) => void; onCancel: () => void }) {
  const [fileName, setFileName] = useState('');
  const [header, setHeader] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [map, setMap] = useState<ColumnMap | null>(null);
  const [mode, setMode] = useState<'single' | 'split'>('single');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(''); setMap(null);
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('That file is larger than 5 MB. Export a shorter date range from your bank.'); return; }
    const all = parseCsv(await file.text());
    if (all.length < 2) { setError('That file has no rows. Check it is a CSV statement exported from your bank.'); return; }
    // Some banks put account details above the real header row: use the
    // first row that has a date-like column name.
    const headerIdx = Math.max(0, all.findIndex(r => r.some(c => /date/i.test(c))));
    const h = all[headerIdx];
    const guess = guessColumns(h);
    setFileName(file.name);
    setHeader(h);
    setRows(all.slice(headerIdx + 1));
    setMode(guess.amount === NONE && (guess.moneyIn !== NONE || guess.moneyOut !== NONE) ? 'split' : 'single');
    setMap(guess);
  }

  const effective: ColumnMap | null = map && (mode === 'single'
    ? { ...map, moneyIn: NONE, moneyOut: NONE }
    : { ...map, amount: NONE });
  const parsed: { ok: StatementRow[]; skipped: number } = effective ? extractRows(rows, effective) : { ok: [], skipped: 0 };

  async function doImport() {
    if (!parsed.ok.length) return;
    setImporting(true); setError('');
    let added = 0, dupes = 0;
    try {
      for (let i = 0; i < parsed.ok.length; i += 2000) {
        const res = await fetch('/api/records', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'csv', records: parsed.ok.slice(i, i + 2000) }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        added += data.added; dupes += data.duplicates;
      }
      onDone(added === 0
        ? `Nothing new to import: all ${dupes} row${dupes === 1 ? ' was' : 's were'} already imported.`
        : `Imported ${added} record${added === 1 ? '' : 's'}${dupes ? ` (${dupes} already imported, skipped)` : ''}. Mark each one as business or personal below.`);
    } catch {
      setError(`The import stopped after ${added} records. Please try again — records already imported will not be duplicated.`);
    } finally {
      setImporting(false);
    }
  }

  const colSelect = (label: string, key: keyof ColumnMap, optional = false) => (
    <label>
      <span style={labelStyle}>{label}</span>
      <select value={map?.[key] ?? NONE} onChange={e => setMap(m => m && { ...m, [key]: Number(e.target.value) })} style={input}>
        <option value={NONE}>{optional ? '(none)' : 'Choose a column'}</option>
        {header.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
      </select>
    </label>
  );

  return (
    <section className="mb-6" style={{ ...card, backgroundColor: '#F7F2E9' }} aria-labelledby="csv-heading">
      <h2 id="csv-heading" className="font-semibold mb-1" style={{ color: '#1C1208' }}>Import a CSV statement</h2>
      <p className="text-sm mb-3" style={{ color: '#4A4035', lineHeight: 1.6 }}>
        Download a statement as CSV from your bank&apos;s website or app, then choose it here. The file is read in your browser; only the rows you import are saved. Importing the same statement twice does not create duplicates.
      </p>
      {error && <p role="alert" className="mb-3 text-sm" style={{ color: '#991B1B' }}>{error}</p>}
      <label className="block mb-3">
        <span style={labelStyle}>CSV file</span>
        <input type="file" accept=".csv,text/csv" onChange={onFile} className="text-sm" style={{ color: '#1C1208' }} />
      </label>

      {map && (
        <>
          <p className="text-sm mb-2" style={{ color: '#1C1208' }}>Check which columns hold each value in <strong>{fileName}</strong>:</p>
          <fieldset className="mb-3">
            <legend style={labelStyle}>How does the statement show amounts?</legend>
            <div className="flex flex-wrap gap-3 text-sm" style={{ color: '#1C1208' }}>
              <label className="flex items-center gap-1.5"><input type="radio" name="mode" checked={mode === 'single'} onChange={() => setMode('single')} /> One amount column (money out is negative)</label>
              <label className="flex items-center gap-1.5"><input type="radio" name="mode" checked={mode === 'split'} onChange={() => setMode('split')} /> Separate money in and money out columns</label>
            </div>
          </fieldset>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            {colSelect('Date', 'date')}
            {colSelect('Description', 'description')}
            {mode === 'single' ? colSelect('Amount', 'amount') : <>{colSelect('Money in', 'moneyIn', true)}{colSelect('Money out', 'moneyOut', true)}</>}
          </div>

          <p role="status" className="text-sm mb-2" style={{ color: '#1C1208' }}>
            {parsed.ok.length} row{parsed.ok.length === 1 ? '' : 's'} ready to import{parsed.skipped ? `, ${parsed.skipped} skipped (no date, description or amount — e.g. balance lines)` : ''}.
          </p>
          {parsed.ok.length > 0 && (
            <div className="overflow-x-auto mb-3">
              <table className="text-xs w-full" style={{ borderCollapse: 'collapse', color: '#1C1208' }}>
                <caption className="sr-only">First rows of the statement as they will be imported</caption>
                <thead><tr>{['Date', 'Description', 'Amount'].map(h => <th key={h} scope="col" style={{ textAlign: 'left', padding: '0.3rem', borderBottom: '1px solid #DDD5C8' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {parsed.ok.slice(0, 5).map((r, i) => (
                    <tr key={i}>
                      <td style={{ padding: '0.3rem', whiteSpace: 'nowrap' }}>{r.date}</td>
                      <td style={{ padding: '0.3rem' }}>{r.description}</td>
                      <td style={{ padding: '0.3rem', whiteSpace: 'nowrap', color: r.amount >= 0 ? '#4B6A4E' : '#A04E1C' }}>{r.amount >= 0 ? '+' : '−'}{gbp(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs mb-3" style={{ color: '#4A4035' }}>Imported records start as “Unreviewed” and are not counted until you mark them as business income or expense.</p>
        </>
      )}

      <div className="flex gap-2">
        {map && (
          <button type="button" disabled={importing || parsed.ok.length === 0} onClick={doImport} style={{ ...primaryBtn, opacity: importing || parsed.ok.length === 0 ? 0.6 : 1 }}>
            {importing ? 'Importing…' : `Import ${parsed.ok.length} record${parsed.ok.length === 1 ? '' : 's'}`}
          </button>
        )}
        <button type="button" onClick={onCancel} style={secondaryBtn}>Cancel</button>
      </div>
    </section>
  );
}

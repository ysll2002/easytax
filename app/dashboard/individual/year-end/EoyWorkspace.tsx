'use client';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { hmrcFetch } from '@/lib/hmrc-client';
import SchemaForm, { pruneValue, fitToSchema, humanize } from '@/components/hmrc/SchemaForm';
import type { Endpoint } from '@/lib/hmrc-eoy/catalog';

// Everything HMRC holds for the tax year beyond the guided declaration steps:
// business details, property income, accounting adjustments, losses,
// employment, pensions, state benefits, charges, expenses and tax liability
// adjustments. One card per HMRC endpoint, grouped by subject; each shows what
// it does, takes the identifiers it needs, and shows HMRC's answer — including
// HMRC's own error codes and messages — as HMRC sent it.
//
// Property quarterly and period summaries are not typed in here: they are
// added up from the records on the Records page (no manual keying in an MTD
// submission), and the card only asks which period.

type WsEndpoint = Endpoint & { recordsBuilt: boolean; allowed: boolean };
type Catalog = {
  who: { label: string; agentType: 'main' | 'supporting' | null; businessId: string | null; isAgent: boolean };
  sandbox: boolean;
  sections: { key: string; title: string; intro: string; ids: string[] }[];
  endpoints: WsEndpoint[];
};
type CallResult = {
  status: number; ok: boolean; correlationId: string | null; body: unknown;
  sent?: { method: string; path: string; body?: unknown; records?: number };
  error?: string; code?: string;
};
type Preview = { body: unknown; records: number; problems: string[] };

const card = { padding: '1rem', borderRadius: '1rem', backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' } as const;
const input = { width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.5rem', border: '1px solid #B8AE9F', backgroundColor: '#FDFCF8', fontSize: '0.85rem', color: '#1C1208' } as const;
const lbl = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#1C1208', marginBottom: '0.2rem' } as const;
const primaryBtn = { padding: '0.5rem 1.1rem', borderRadius: '2rem', border: 'none', backgroundColor: '#A04E1C', color: '#FDFCF8', fontWeight: 600, fontSize: '0.825rem', cursor: 'pointer' } as const;
const secondaryBtn = { padding: '0.45rem 0.95rem', borderRadius: '2rem', border: '1px solid #DDD5C8', backgroundColor: '#F0EBE1', color: '#1C1208', fontWeight: 500, fontSize: '0.78rem', cursor: 'pointer' } as const;

const METHOD_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  GET:    { text: 'Retrieve', color: '#2F5232', bg: '#E2EDE2' },
  POST:   { text: 'Send',     color: '#7A4A1E', bg: '#F5EDDC' },
  PUT:    { text: 'Save',     color: '#7A4A1E', bg: '#F5EDDC' },
  DELETE: { text: 'Delete',   color: '#991B1B', bg: '#FEE2E2' },
};

// Identifiers HMRC returns that other endpoints take as path parameters.
// propId is the foreign property's propertyId.
const ID_PARAMS: Record<string, string[]> = {
  businessId: ['businessId'], calculationId: ['calculationId', 'id'], employmentId: ['employmentId'],
  benefitId: ['benefitId'], submissionId: ['submissionId'], periodId: ['periodId'], propId: ['propertyId'],
};
const ID_KEYS = new Set(Object.values(ID_PARAMS).flat());

function harvest(body: unknown, found: Record<string, Set<string>>) {
  const walk = (v: unknown, parentKey = '') => {
    if (Array.isArray(v)) { v.forEach(x => walk(x, parentKey)); return; }
    if (!v || typeof v !== 'object') return;
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if (typeof x === 'string' && ID_KEYS.has(k) && !(k === 'id' && !/calculation/i.test(parentKey))) {
        for (const [param, keys] of Object.entries(ID_PARAMS)) {
          if (keys.includes(k)) (found[param] ??= new Set()).add(x);
        }
      } else walk(x, k);
    }
  };
  walk(body);
}

/** Standard quarters of a tax year ("2026-27"). */
function quarters(taxYear: string) {
  const y = Number(taxYear.slice(0, 4));
  return [
    { label: 'Quarter 1 (6 Apr – 5 Jul)', start: `${y}-04-06`, end: `${y}-07-05` },
    { label: 'Quarter 2 (6 Jul – 5 Oct)', start: `${y}-07-06`, end: `${y}-10-05` },
    { label: 'Quarter 3 (6 Oct – 5 Jan)', start: `${y}-10-06`, end: `${y + 1}-01-05` },
    { label: 'Quarter 4 (6 Jan – 5 Apr)', start: `${y + 1}-01-06`, end: `${y + 1}-04-05` },
  ];
}

/** HMRC's error answer, as a list: { code, message, errors: [{ code, message, paths }] }. */
function hmrcErrors(body: unknown): { code: string; message: string; paths?: string[] }[] {
  if (!body || typeof body !== 'object') return [];
  const b = body as { code?: string; message?: string; errors?: { code?: string; message?: string; paths?: string[] }[] };
  const out: { code: string; message: string; paths?: string[] }[] = [];
  if (b.errors?.length) {
    for (const e of b.errors) out.push({ code: e.code ?? '', message: e.message ?? '', paths: e.paths });
  } else if (b.code || b.message) {
    out.push({ code: b.code ?? '', message: b.message ?? '' });
  }
  return out;
}

export default function EoyWorkspace({ taxYear, clientId }: { taxYear: string; clientId?: string }) {
  const qs = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
  const [cat, setCat] = useState<Catalog | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [section, setSection] = useState('business');
  const [ids, setIds] = useState<Record<string, string[]>>({});
  const [lastGet, setLastGet] = useState<Record<string, unknown>>({});
  const [businesses, setBusinesses] = useState<{ businessId: string; typeOfBusiness?: string; tradingName?: string }[]>([]);

  useEffect(() => {
    hmrcFetch(`/api/hmrc/eoy${qs}`)
      .then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? `Request failed (${r.status})`);
        setCat(d);
        if (d.who.businessId) setIds(p => ({ ...p, businessId: [d.who.businessId] }));
      })
      .catch(err => setLoadErr(err instanceof Error ? err.message : String(err)));
  }, [qs]);

  const onResult = useCallback((e: WsEndpoint, res: CallResult) => {
    if (!res.ok) return;
    const found: Record<string, Set<string>> = {};
    harvest(res.body, found);
    setIds(prev => {
      const next = { ...prev };
      for (const [k, set] of Object.entries(found)) next[k] = [...new Set([...(prev[k] ?? []), ...set])];
      return next;
    });
    if (e.method === 'GET') setLastGet(p => ({ ...p, [e.path]: res.body }));
    if (e.summary === 'List All Businesses') {
      const list = (res.body as { listOfBusinesses?: { businessId: string; typeOfBusiness?: string; tradingName?: string }[] })?.listOfBusinesses ?? [];
      setBusinesses(list);
    }
  }, []);

  const byId = useMemo(() => new Map((cat?.endpoints ?? []).map(e => [e.id, e])), [cat]);

  if (loadErr) return <div role="alert" className="p-4 rounded-xl text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>{loadErr}</div>;
  if (!cat) return <p style={{ color: '#6B6256' }}>Loading…</p>;

  const current = cat.sections.find(s => s.key === section) ?? cat.sections[0];

  return (
    <div>
      {cat.who.isAgent && (
        <p className="mb-3 text-sm" style={{ color: '#4A4035' }}>
          Working on <strong>{cat.who.label}</strong>&apos;s return{cat.who.agentType === 'supporting' ? ' as their supporting agent: HMRC lets supporting agents use only some of these.' : '.'}
        </p>
      )}
      <nav aria-label="Year-end sections" className="flex flex-wrap gap-1 mb-4" style={{ backgroundColor: '#F0EBE1', borderRadius: '1rem', padding: '0.3rem' }}>
        {cat.sections.map(s => (
          <button key={s.key} type="button" aria-pressed={s.key === current.key} onClick={() => setSection(s.key)}
            style={{ padding: '0.35rem 0.8rem', borderRadius: '1rem', fontSize: '0.78rem', fontWeight: 500, border: 'none', cursor: 'pointer', backgroundColor: s.key === current.key ? '#1C1208' : 'transparent', color: s.key === current.key ? '#FDFCF8' : '#4A4035' }}>
            {s.title}
          </button>
        ))}
      </nav>

      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>{current.title}</h2>
      <p className="text-sm mb-4" style={{ color: '#4A4035', lineHeight: 1.6, maxWidth: '44rem' }}>{current.intro}</p>
      {(current.key === 'uk-property' || current.key === 'foreign-property' || current.key === 'historic-fhl') && (
        <p className="text-sm mb-4 p-3 rounded-xl" style={{ backgroundColor: '#F5EDDC', color: '#1C1208', lineHeight: 1.6, maxWidth: '44rem' }}>
          Quarterly and period summaries are added up from your records. On the Records page, mark rent and property costs as business income or expense,
          choose <strong>{current.key === 'foreign-property' ? 'Foreign property' : 'UK property'}</strong> as the income source and pick the HMRC property category.
          {current.key === 'foreign-property' && ' Give each foreign property record the property ID HMRC issued (from 2026-27) or the country code (earlier years).'}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {current.ids.map(id => {
          const e = byId.get(id);
          return e ? (
            <EndpointCard key={e.id} e={e} taxYear={taxYear} qs={qs} sandbox={cat.sandbox} ids={ids} businesses={businesses}
              lastGet={lastGet[e.path]} onResult={onResult} />
          ) : null;
        })}
      </div>
    </div>
  );
}

function EndpointCard({ e, taxYear, qs, sandbox, ids, businesses, lastGet, onResult }: {
  e: WsEndpoint; taxYear: string; qs: string; sandbox: boolean; ids: Record<string, string[]>;
  businesses: { businessId: string; typeOfBusiness?: string; tradingName?: string }[];
  lastGet: unknown; onResult: (e: WsEndpoint, r: CallResult) => void;
}) {
  const [open, setOpen] = useState(false);
  const params = useMemo(() => [...e.path.matchAll(/\{([A-Za-z]+)\}/g)].map(m => m[1]).filter(p => p !== 'nino'), [e.path]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [query, setQuery] = useState<Record<string, string>>({});
  const [scenario, setScenario] = useState('');
  const [variant, setVariant] = useState(() => {
    // The variant for the chosen tax year where HMRC titles them that way.
    const i = e.bodies.findIndex(b => /onwards|and after/i.test(b.title));
    return i >= 0 ? i : 0;
  });
  const [body, setBody] = useState<unknown>(undefined);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CallResult | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const qtrs = quarters(taxYear);
  const [qIdx, setQIdx] = useState(0);
  const [fhl, setFhl] = useState(false);

  const cumulative = /cumulative/.test(e.path);
  const recordsWindow = () => {
    const q = qtrs[qIdx];
    // Cumulative summaries run from the start of the tax year to the end of
    // the quarter; period summaries cover the quarter.
    return { fromDate: cumulative ? qtrs[0].start : q.start, toDate: q.end, periodStart: q.start, fhl };
  };
  const paramValue = (p: string) => values[p] ?? (p === 'taxYear' ? taxYear : (p === 'businessId' ? ids.businessId?.[0] ?? '' : ''));

  async function send(previewOnly = false) {
    if (e.method === 'DELETE' && !previewOnly && !window.confirm(`${e.summary}: this deletes the data at HMRC. Continue?`)) return;
    setBusy(true);
    if (!previewOnly) setResult(null);
    try {
      const p = Object.fromEntries(params.map(k => [k, paramValue(k)]));
      const r = await hmrcFetch(`/api/hmrc/eoy${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: e.id, params: p, query, scenario: scenario || undefined,
          body: e.recordsBuilt ? undefined : pruneValue(body),
          records: e.recordsBuilt ? recordsWindow() : undefined,
          preview: previewOnly || undefined,
        }),
      });
      const d = await r.json().catch(() => ({ error: `Unexpected response (${r.status})` }));
      if (previewOnly) {
        if (d.error) setResult({ status: r.status, ok: false, correlationId: null, body: null, error: d.error });
        else setPreview(d);
        return;
      }
      const res: CallResult = d.error && d.status === undefined ? { status: r.status, ok: false, correlationId: null, body: null, error: d.error, code: d.code } : d;
      setResult(res);
      onResult(e, res);
    } catch (err) {
      setResult({ status: 0, ok: false, correlationId: null, body: null, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  }

  const m = METHOD_LABEL[e.method];
  const schema = e.bodies[variant]?.schema;
  const scenarios = e.scenarios;
  const errors = result && !result.ok ? hmrcErrors(result.body) : [];

  return (
    <section style={{ ...card, opacity: e.allowed ? 1 : 0.6 }} aria-labelledby={`${e.id}-h`}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-start gap-3 text-left" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '0.4rem', color: m.color, backgroundColor: m.bg, whiteSpace: 'nowrap', marginTop: '0.1rem' }}>{m.text}</span>
        <span style={{ flex: 1 }}>
          <span id={`${e.id}-h`} style={{ display: 'block', fontWeight: 600, color: '#1C1208', fontSize: '0.9rem' }}>{e.summary}</span>
          <span style={{ display: 'block', fontSize: '0.7rem', color: '#6B6256' }}>{e.api} {e.version}{!e.allowed && ' · not available for this account'}</span>
        </span>
        <span aria-hidden="true" style={{ color: '#6B6256' }}>{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="mt-3">
          {e.description && <p className="text-xs mb-3" style={{ color: '#4A4035', lineHeight: 1.55 }}>{e.description.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')}</p>}

          {(params.length > 0 || e.query.length > 0 || (sandbox && scenarios.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              {params.map(p => (
                <ParamInput key={p} name={p} value={paramValue(p)} onChange={v => setValues(s => ({ ...s, [p]: v }))} ids={ids[p] ?? []} businesses={businesses} />
              ))}
              {e.query.map(q => (
                <label key={q.name}>
                  <span style={lbl}>{humanize(q.name)}{q.required ? ' *' : ' (optional)'}</span>
                  {q.enum ? (
                    <select value={query[q.name] ?? ''} onChange={ev => setQuery(s => ({ ...s, [q.name]: ev.target.value }))} style={input}>
                      <option value="">—</option>
                      {q.enum.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={query[q.name] ?? ''} onChange={ev => setQuery(s => ({ ...s, [q.name]: ev.target.value }))} style={input} />
                  )}
                </label>
              ))}
              {sandbox && scenarios.length > 0 && (
                <label>
                  <span style={lbl}>Sandbox test scenario</span>
                  <select value={scenario} onChange={ev => setScenario(ev.target.value)} style={input}>
                    <option value="">Default (success)</option>
                    {scenarios.map(s => <option key={s.value} value={s.value} title={s.desc}>{s.value}</option>)}
                  </select>
                </label>
              )}
            </div>
          )}

          {e.recordsBuilt ? (
            <div className="mb-3 p-3 rounded-xl" style={{ backgroundColor: '#F7F2E9' }}>
              <p className="text-xs mb-2" style={{ color: '#4A4035' }}>The figures come from your records for the period below{cumulative ? ', added up from the start of the tax year' : ''}.</p>
              <div className="flex flex-wrap items-end gap-3">
                <label>
                  <span style={lbl}>Period</span>
                  <select value={qIdx} onChange={ev => { setQIdx(Number(ev.target.value)); setPreview(null); }} style={{ ...input, width: 'auto' }}>
                    {qtrs.map((q, i) => <option key={i} value={i}>{q.label}</option>)}
                  </select>
                </label>
                {/period/.test(e.path) && !/historic/.test(e.id) && !/furnished/.test(e.path) && (
                  <label className="flex items-center gap-2 text-sm" style={{ color: '#1C1208' }}>
                    <input type="checkbox" checked={fhl} onChange={ev => { setFhl(ev.target.checked); setPreview(null); }} />
                    These are furnished holiday lettings (before 2025-26)
                  </label>
                )}
                <button type="button" style={secondaryBtn} disabled={busy} onClick={() => send(true)}>Show the figures</button>
              </div>
              {preview && (
                <div className="mt-2">
                  <p className="text-xs" style={{ color: '#1C1208' }}>{preview.records} record{preview.records === 1 ? '' : 's'} counted.</p>
                  {preview.problems.map((p, i) => <p key={i} className="text-xs" style={{ color: '#991B1B' }}>{p}</p>)}
                  <pre className="text-xs mt-1 p-2 rounded-lg overflow-x-auto" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', maxHeight: '16rem' }}>{JSON.stringify(preview.body, null, 2)}</pre>
                </div>
              )}
            </div>
          ) : schema ? (
            <div className="mb-3">
              {e.bodies.length > 1 && (
                <label className="block mb-2" style={{ maxWidth: '24rem' }}>
                  <span style={lbl}>Which tax years</span>
                  <select value={variant} onChange={ev => { setVariant(Number(ev.target.value)); setBody(undefined); }} style={input}>
                    {e.bodies.map((b, i) => <option key={i} value={i}>{b.title}</option>)}
                  </select>
                </label>
              )}
              <div className="flex flex-wrap gap-2 mb-2">
                {lastGet !== undefined && lastGet !== null && (
                  <button type="button" style={secondaryBtn} onClick={() => setBody(fitToSchema(lastGet, schema))}>Fill in what HMRC holds</button>
                )}
                {sandbox && e.bodies[variant]?.example != null && (
                  <button type="button" style={secondaryBtn} onClick={() => setBody(fitToSchema(e.bodies[variant].example, schema))}>Fill in HMRC&apos;s test example</button>
                )}
                {body !== undefined && <button type="button" style={secondaryBtn} onClick={() => setBody(undefined)}>Clear</button>}
              </div>
              <SchemaForm key={`${variant}`} schema={schema} value={body} onChange={setBody} />
            </div>
          ) : null}

          <button type="button" disabled={busy || !e.allowed} onClick={() => send()} style={{ ...primaryBtn, opacity: busy || !e.allowed ? 0.6 : 1, backgroundColor: e.method === 'DELETE' ? '#991B1B' : '#A04E1C' }}>
            {busy ? 'Sending to HMRC…' : `${m.text} — ${e.summary}`}
          </button>

          {result && (
            <div className="mt-3" aria-live="polite">
              {result.ok ? (
                <p role="status" className="text-sm font-semibold" style={{ color: '#2F5232' }}>
                  HMRC accepted this ({result.status}){result.sent?.records !== undefined ? ` — built from ${result.sent.records} record${result.sent.records === 1 ? '' : 's'}` : ''}.
                </p>
              ) : (
                <div role="alert" className="p-3 rounded-xl text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                  <p className="font-semibold">{result.error ?? `HMRC did not accept this (${result.status}).`}</p>
                  {errors.map((er, i) => (
                    <p key={i} className="mt-1">
                      <code style={{ fontSize: '0.75rem' }}>{er.code}</code> — {er.message}
                      {er.paths?.length ? <span style={{ display: 'block', fontSize: '0.72rem' }}>Fields: {er.paths.join(', ')}</span> : null}
                    </p>
                  ))}
                </div>
              )}
              {result.correlationId && <p className="text-xs mt-1" style={{ color: '#6B6256' }}>HMRC reference (correlation ID): {result.correlationId}</p>}
              {result.body != null && (
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer" style={{ color: '#4A4035' }}>What HMRC sent back</summary>
                  <pre className="text-xs mt-1 p-2 rounded-lg overflow-x-auto" style={{ backgroundColor: '#F7F2E9', color: '#1C1208', maxHeight: '24rem' }}>{JSON.stringify(result.body, null, 2)}</pre>
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ParamInput({ name, value, onChange, ids, businesses }: {
  name: string; value: string; onChange: (v: string) => void; ids: string[];
  businesses: { businessId: string; typeOfBusiness?: string; tradingName?: string }[];
}) {
  const listId = useId();
  if (name === 'calculationType') {
    return (
      <label>
        <span style={lbl}>Calculation type</span>
        <select value={value} onChange={e => onChange(e.target.value)} style={input}>
          <option value="">—</option>
          <option value="in-year">In-year estimate</option>
          <option value="intent-to-finalise">Intent to finalise (before the final declaration)</option>
          <option value="intent-to-amend">Intent to amend (after the return is filed)</option>
        </select>
      </label>
    );
  }
  if (name === 'typeOfBusiness') {
    return (
      <label>
        <span style={lbl}>Type of business</span>
        <select value={value} onChange={e => onChange(e.target.value)} style={input}>
          <option value="">—</option>
          <option value="self-employment">Self-employment</option>
          <option value="uk-property">UK property</option>
          <option value="foreign-property">Foreign property</option>
        </select>
      </label>
    );
  }
  const options = name === 'businessId'
    ? [...new Set([...businesses.map(b => b.businessId), ...ids])]
    : ids;
  return (
    <label>
      <span style={lbl}>{name === 'propId' ? 'Property ID' : humanize(name)}</span>
      <input type="text" list={listId} value={value} onChange={e => onChange(e.target.value)} style={input}
        placeholder={name === 'taxYear' ? '2026-27' : name === 'businessId' ? 'From “List All Businesses”' : ''} />
      <datalist id={listId}>
        {options.map(o => {
          const b = businesses.find(x => x.businessId === o);
          return <option key={o} value={o}>{b ? `${b.typeOfBusiness ?? ''} ${b.tradingName ?? ''}`.trim() : undefined}</option>;
        })}
      </datalist>
    </label>
  );
}

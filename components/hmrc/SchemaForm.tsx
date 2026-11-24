'use client';
import { useId, useState } from 'react';
import type { JsonSchema } from '@/lib/hmrc-eoy/catalog';

// A form for one HMRC request body, rendered from the JSON schema HMRC
// publishes for it (lib/hmrc-eoy/catalog.json). Each field is labelled from
// its name, with HMRC's own description as help text; required fields are
// marked. Empty fields are left out of the request rather than sent as
// zeros or empty objects, which HMRC rejects.

type Json = unknown;

const input = { width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.5rem', border: '1px solid #B8AE9F', backgroundColor: '#FDFCF8', fontSize: '0.85rem', color: '#1C1208' } as const;
const smallBtn = { padding: '0.3rem 0.75rem', borderRadius: '1rem', border: '1px solid #DDD5C8', backgroundColor: '#F0EBE1', color: '#1C1208', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' } as const;

/** "premisesRunningCosts" → "Premises running costs". */
export function humanize(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  const fixed = words
    .replace(/\buk\b/g, 'UK').replace(/\bfhl\b/g, 'FHL').replace(/\beea\b/g, 'EEA').replace(/\bpaye\b/g, 'PAYE')
    .replace(/\bnic(s?)\b/g, 'NIC$1').replace(/\bid\b/g, 'ID').replace(/\bvat\b/g, 'VAT').replace(/\bcgt\b/g, 'CGT')
    .replace(/\bqops\b/g, 'QOPS').replace(/\bmtd\b/g, 'MTD').replace(/\bbik\b/g, 'BiK');
  return fixed.charAt(0).toUpperCase() + fixed.slice(1);
}

function typeOf(s: JsonSchema): string {
  if (Array.isArray(s.type)) return s.type.find(t => t !== 'null') ?? 'string';
  if (s.type) return s.type;
  if (s.properties) return 'object';
  if (s.items) return 'array';
  if (s.enum) return 'string';
  return 'string';
}

/** allOf merged into one object schema. */
function merged(s: JsonSchema): JsonSchema {
  if (!s.allOf) return s;
  const out: JsonSchema = { ...s, allOf: undefined, properties: { ...(s.properties ?? {}) }, required: [...(s.required ?? [])] };
  for (const part of s.allOf) {
    const m = merged(part);
    Object.assign(out.properties!, m.properties ?? {});
    out.required!.push(...(m.required ?? []));
    if (!out.type && m.type) out.type = m.type;
  }
  return out;
}

const variantsOf = (s: JsonSchema) => s.oneOf ?? s.anyOf ?? null;

function isEmpty(v: Json): boolean {
  if (v === undefined || v === null || v === '') return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.values(v as Record<string, Json>).every(isEmpty);
  return false;
}

/** The value with empty fields, objects and arrays removed. */
export function pruneValue(v: Json): Json {
  if (Array.isArray(v)) {
    const arr = v.map(pruneValue).filter(x => !isEmpty(x));
    return arr.length ? arr : undefined;
  }
  if (v && typeof v === 'object') {
    const out: Record<string, Json> = {};
    for (const [k, x] of Object.entries(v as Record<string, Json>)) {
      const p = pruneValue(x);
      if (!isEmpty(p)) out[k] = p;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return v === '' ? undefined : v;
}

/** Keep only what the schema describes — for filling a form from an HMRC retrieve response. */
export function fitToSchema(v: Json, s: JsonSchema): Json {
  const sc = merged(s);
  const vars = variantsOf(sc);
  if (vars) return fitToSchema(v, vars[0]);
  const t = typeOf(sc);
  if (t === 'object') {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
    const out: Record<string, Json> = {};
    for (const [k, ps] of Object.entries(sc.properties ?? {})) {
      const f = fitToSchema((v as Record<string, Json>)[k], ps);
      if (f !== undefined) out[k] = f;
    }
    return Object.keys(out).length ? out : undefined;
  }
  if (t === 'array') return Array.isArray(v) ? v.map(x => fitToSchema(x, sc.items ?? {})).filter(x => x !== undefined) : undefined;
  if (t === 'number' || t === 'integer') return typeof v === 'number' ? v : undefined;
  if (t === 'boolean') return typeof v === 'boolean' ? v : undefined;
  return typeof v === 'string' ? v : undefined;
}

function Help({ text }: { text?: string }) {
  if (!text) return null;
  const clean = text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (!clean) return null;
  return <span style={{ display: 'block', fontSize: '0.7rem', color: '#6B6256', marginTop: '0.15rem', lineHeight: 1.4 }}>{clean.length > 220 ? clean.slice(0, 217) + '…' : clean}</span>;
}

export default function SchemaForm({ schema, value, onChange, disabled }: {
  schema: JsonSchema; value: Json; onChange: (v: Json) => void; disabled?: boolean;
}) {
  return <Field name="" schema={schema} value={value} onChange={onChange} required root disabled={disabled} />;
}

function Field({ name, schema, value, onChange, required, root, disabled }: {
  name: string; schema: JsonSchema; value: Json; onChange: (v: Json) => void; required?: boolean; root?: boolean; disabled?: boolean;
}) {
  const id = useId();
  const s = merged(schema);
  const vars = variantsOf(s);
  if (vars) return <Variants name={name} variants={vars} value={value} onChange={onChange} required={required} disabled={disabled} />;
  const t = typeOf(s);
  const label = s.title && !root && s.title.length < 60 && !/request/i.test(s.title) ? s.title : humanize(name);
  const star = required ? <span aria-hidden="true" style={{ color: '#A04E1C' }}> *</span> : null;
  const reqText = required ? <span className="sr-only"> (required)</span> : null;

  if (t === 'object') {
    return <ObjectField name={name} schema={s} value={value} onChange={onChange} required={required} root={root} disabled={disabled} />;
  }
  if (t === 'array') {
    return <ArrayField name={name} schema={s} value={value} onChange={onChange} required={required} disabled={disabled} />;
  }

  const labelEl = (
    <label htmlFor={id} style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#1C1208', marginBottom: '0.2rem' }}>
      {label}{star}{reqText}
    </label>
  );

  if (t === 'boolean') {
    return (
      <div>
        {labelEl}
        <select id={id} disabled={disabled} value={value === true ? 'true' : value === false ? 'false' : ''} onChange={e => onChange(e.target.value === '' ? undefined : e.target.value === 'true')} style={input}>
          <option value="">—</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
        <Help text={s.description} />
      </div>
    );
  }

  if (s.enum) {
    return (
      <div>
        {labelEl}
        <select id={id} disabled={disabled} value={value === undefined || value === null ? '' : String(value)} onChange={e => onChange(e.target.value === '' ? undefined : e.target.value)} style={input}>
          <option value="">—</option>
          {s.enum.map(o => <option key={String(o)} value={String(o)}>{String(o)}</option>)}
        </select>
        <Help text={s.description} />
      </div>
    );
  }

  if (t === 'number' || t === 'integer') {
    return (
      <div>
        {labelEl}
        <input id={id} type="number" inputMode="decimal" disabled={disabled}
          step={t === 'integer' ? 1 : (s.multipleOf ?? 0.01)} min={s.minimum} max={s.maximum}
          value={typeof value === 'number' ? value : ''}
          onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))} style={input} />
        <Help text={s.description} />
      </div>
    );
  }

  const isDate = s.format === 'date' || /date$/i.test(name) && !/update/i.test(name);
  return (
    <div>
      {labelEl}
      <input id={id} type={isDate ? 'date' : 'text'} disabled={disabled} maxLength={s.maxLength}
        value={typeof value === 'string' ? value : ''} onChange={e => onChange(e.target.value === '' ? undefined : e.target.value)} style={input} />
      <Help text={s.description} />
    </div>
  );
}

function ObjectField({ name, schema, value, onChange, required, root, disabled }: {
  name: string; schema: JsonSchema; value: Json; onChange: (v: Json) => void; required?: boolean; root?: boolean; disabled?: boolean;
}) {
  const obj = (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as Record<string, Json>;
  // Optional sections start closed so an untouched one is not sent.
  const [open, setOpen] = useState<boolean>(!!root || !!required || !isEmpty(value));
  const props = Object.entries(schema.properties ?? {});
  const req = new Set(schema.required ?? []);
  const set = (k: string, v: Json) => onChange({ ...obj, [k]: v });
  const label = humanize(name);

  const body = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {props.map(([k, ps]) => {
        const t = typeOf(merged(ps));
        const wide = t === 'object' || t === 'array' || !!variantsOf(merged(ps));
        return (
          <div key={k} className={wide ? 'sm:col-span-2' : ''}>
            <Field name={k} schema={ps} value={obj[k]} onChange={v => set(k, v)} required={req.has(k)} disabled={disabled} />
          </div>
        );
      })}
    </div>
  );
  if (root) return body;

  return (
    <fieldset style={{ border: '1px solid #DDD5C8', borderRadius: '0.75rem', padding: '0.75rem', backgroundColor: '#FBF8F2' }}>
      <legend style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1C1208', padding: '0 0.35rem' }}>
        {label}{required && <span aria-hidden="true" style={{ color: '#A04E1C' }}> *</span>}
      </legend>
      <Help text={schema.description} />
      {open ? (
        <div className="mt-2">
          {body}
          {!required && (
            <button type="button" disabled={disabled} style={{ ...smallBtn, marginTop: '0.6rem' }} onClick={() => { onChange(undefined); setOpen(false); }}>Remove {label.toLowerCase()}</button>
          )}
        </div>
      ) : (
        <button type="button" disabled={disabled} style={{ ...smallBtn, marginTop: '0.4rem' }} onClick={() => setOpen(true)}>+ Add {label.toLowerCase()}</button>
      )}
    </fieldset>
  );
}

function ArrayField({ name, schema, value, onChange, required, disabled }: {
  name: string; schema: JsonSchema; value: Json; onChange: (v: Json) => void; required?: boolean; disabled?: boolean;
}) {
  const arr = Array.isArray(value) ? value : [];
  const item = schema.items ?? { type: 'string' };
  const label = humanize(name);
  const max = schema.maxItems ?? 100;
  return (
    <fieldset style={{ border: '1px solid #DDD5C8', borderRadius: '0.75rem', padding: '0.75rem', backgroundColor: '#FBF8F2' }}>
      <legend style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1C1208', padding: '0 0.35rem' }}>
        {label}{required && <span aria-hidden="true" style={{ color: '#A04E1C' }}> *</span>}
      </legend>
      <Help text={schema.description} />
      <div className="flex flex-col gap-3 mt-2">
        {arr.map((v, i) => (
          <div key={i} style={{ borderLeft: '3px solid #E8DCC4', paddingLeft: '0.6rem' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6B6256', marginBottom: '0.3rem' }}>{label} {i + 1}</p>
            <Field name={`${name}Item`} schema={item} value={v} disabled={disabled}
              onChange={nv => onChange(arr.map((x, j) => j === i ? nv : x))} required root={typeOf(merged(item)) === 'object'} />
            <button type="button" disabled={disabled} style={{ ...smallBtn, marginTop: '0.4rem' }} onClick={() => onChange(arr.filter((_, j) => j !== i))}>Remove</button>
          </div>
        ))}
      </div>
      {arr.length < max && (
        <button type="button" disabled={disabled} style={{ ...smallBtn, marginTop: '0.5rem' }} onClick={() => onChange([...arr, typeOf(merged(item)) === 'object' ? {} : undefined])}>+ Add {arr.length ? 'another' : 'one'}</button>
      )}
    </fieldset>
  );
}

function Variants({ name, variants, value, onChange, required, disabled }: {
  name: string; variants: JsonSchema[]; value: Json; onChange: (v: Json) => void; required?: boolean; disabled?: boolean;
}) {
  const [i, setI] = useState(0);
  const id = useId();
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#1C1208', marginBottom: '0.2rem' }}>
        {humanize(name || 'type')}: which applies?
      </label>
      <select id={id} disabled={disabled} value={i} onChange={e => { setI(Number(e.target.value)); onChange(undefined); }} style={{ ...input, marginBottom: '0.5rem' }}>
        {variants.map((v, j) => <option key={j} value={j}>{v.title ?? v.description?.slice(0, 80) ?? `Option ${j + 1}`}</option>)}
      </select>
      <Field name={name} schema={variants[i]} value={value} onChange={onChange} required={required} disabled={disabled} />
    </div>
  );
}

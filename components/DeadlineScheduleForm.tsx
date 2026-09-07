'use client';

import { useState } from 'react';
import { CalendarClock, Check, Loader2 } from 'lucide-react';
import { getStoredAnonId, trackClient } from './PageViewTracker';

// "Email me my deadlines."
//
// This replaces the ask, not the mechanism. The launch waitlist wanted an
// address in exchange for a message at an unknown future date about filing that
// HMRC has not yet approved — 9 visitors saw it in a week and none of them
// filled it in. This wants the same address in exchange for something the
// product can deliver in the next sixty seconds: the reader's own MTD quarterly
// dates and final declaration date, worked out from the income they enter.
//
// The dates are also rendered on the page. Someone who came for the answer gets
// the answer whether or not the email lands, which is the difference between a
// tool and a lead-gate.

type Row = { label: string; period: string; due: string };

const SEGMENTS: { value: string; label: string }[] = [
  { value: 'sole_trader',     label: 'Sole trader / freelancer' },
  { value: 'landlord',        label: 'Landlord' },
  { value: 'limited_company', label: 'Limited company' },
  { value: 'accountant',      label: 'Accountant / bookkeeper' },
];

const FIELD: React.CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: '0.75rem',
  border: '1px solid #DDD5C8',
  backgroundColor: '#FDFCF8',
  color: '#1C1208',
  fontSize: '0.95rem',
  minHeight: '44px',
  width: '100%',
};

export default function DeadlineScheduleForm({
  source,
  defaultIncome,
  heading = 'Get your MTD deadlines by email',
  blurb = 'Tell us your qualifying income and we will work out which tax year brings you into Making Tax Digital, your four quarterly dates and your final declaration date — and email them to you now.',
}: {
  /** Which page captured the address, e.g. 'checker' or 'article'. */
  source: string;
  /** Pre-fills the income when the visitor has already entered it elsewhere on
   *  the page — asking the same question twice is how a form gets abandoned. */
  defaultIncome?: number | null;
  heading?: string;
  blurb?: string;
}) {
  const [email, setEmail]     = useState('');
  const [income, setIncome]   = useState(defaultIncome != null ? String(defaultIncome) : '');
  const [segment, setSegment] = useState('');
  const [state, setState]     = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [rows, setRows]       = useState<Row[]>([]);
  const [summary, setSummary] = useState('');
  const [emailed, setEmailed] = useState(true);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === 'loading') return;

    const parsed = Number(income.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setState('error');
      setMessage('Enter your qualifying income — gross turnover plus gross property income.');
      return;
    }

    setState('loading');
    setMessage('');
    trackClient('schedule_started', { source });

    let utm: Record<string, string> = {};
    try {
      utm = JSON.parse(sessionStorage.getItem('et_utm') ?? '{}');
    } catch {
      // No attribution stored — never a reason to fail the request.
    }

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          qualifyingIncome: parsed,
          segment: segment || null,
          source,
          anonId:   getStoredAnonId(),
          path:     window.location.pathname,
          referrer: document.referrer || null,
          ...utm,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setState('error');
        setMessage(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setRows(data.schedule?.rows ?? []);
      setSummary(data.schedule?.summary ?? '');
      setEmailed(data.emailed !== false);
      setMessage(data.warning ?? '');
      setState('done');
    } catch {
      setState('error');
      setMessage('Network error. Please try again.');
    }
  };

  if (state === 'done') {
    return (
      <div
        className="p-5 sm:p-6 rounded-2xl"
        style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #6B8E6E40' }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#6B8E6E' }}
          >
            <Check size={16} color="#FDFCF8" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold mb-1" style={{ color: '#1C1208', fontSize: '0.95rem' }}>
              {emailed ? 'Sent — check your inbox.' : 'Here are your dates.'}
            </p>
            {summary && (
              <p className="text-sm" style={{ color: '#4A4035', lineHeight: 1.6 }}>{summary}</p>
            )}
            {message && (
              <p className="text-sm mt-2" style={{ color: '#B3261E', lineHeight: 1.6 }}>{message}</p>
            )}
          </div>
        </div>

        {/* The answer stays on the page. A visitor who mistyped their address,
            or whose mail lands in spam, has still got what they came for. */}
        {rows.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 420, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Return', 'Period', 'Due'].map(h => (
                    <th
                      key={h}
                      align="left"
                      className="text-xs"
                      style={{
                        padding: '8px 10px',
                        color: '#9A8F83',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        borderBottom: '1px solid #E8E2DA',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.label}>
                    <td className="text-sm" style={{ padding: '10px', color: '#1C1208', fontWeight: 600, borderBottom: '1px solid #F0EBE1' }}>
                      {r.label}
                    </td>
                    <td className="text-xs" style={{ padding: '10px', color: '#9A8F83', borderBottom: '1px solid #F0EBE1' }}>
                      {r.period}
                    </td>
                    <td className="text-sm" style={{ padding: '10px', color: '#C4622D', fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid #F0EBE1' }}>
                      {r.due}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs mt-4" style={{ color: '#9A8F83', lineHeight: 1.6 }}>
          We will email you before each of these deadlines, and once when MTD filing opens in
          EasyTax. Nothing else, and you can unsubscribe from any of it in one click.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-7 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E8E2DA' }}>
      <div className="flex items-center gap-2 mb-2">
        <CalendarClock size={16} color="#C4622D" strokeWidth={2} />
        <p
          style={{
            fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
            fontSize: '1.15rem',
            fontWeight: 700,
            color: '#1C1208',
          }}
        >
          {heading}
        </p>
      </div>
      <p className="text-sm mb-4" style={{ color: '#9A8F83', lineHeight: 1.6 }}>{blurb}</p>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address"
            style={FIELD}
          />
          <input
            type="text"
            inputMode="numeric"
            required
            value={income}
            onChange={e => setIncome(e.target.value)}
            placeholder="Qualifying income, e.g. 55000"
            aria-label="Qualifying income in pounds"
            style={FIELD}
          />
        </div>

        <select
          value={segment}
          onChange={e => setSegment(e.target.value)}
          aria-label="What best describes you?"
          style={{ ...FIELD, color: segment ? '#1C1208' : '#9A8F83' }}
        >
          <option value="">What best describes you? (optional)</option>
          {SEGMENTS.map(s => (
            <option key={s.value} value={s.value} style={{ color: '#1C1208' }}>{s.label}</option>
          ))}
        </select>

        <button
          type="submit"
          disabled={state === 'loading'}
          className="w-full sm:w-auto sm:self-start inline-flex items-center justify-center gap-2"
          style={{
            padding: '0.8rem 1.75rem',
            borderRadius: '50px',
            border: 'none',
            backgroundColor: state === 'loading' ? '#C4622D99' : '#C4622D',
            color: '#FDFCF8',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: state === 'loading' ? 'default' : 'pointer',
            minHeight: '44px',
          }}
        >
          {state === 'loading' ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Working out your dates…
            </>
          ) : (
            <>Email me my deadlines →</>
          )}
        </button>

        {state === 'error' && (
          <p className="text-sm" role="alert" style={{ color: '#B3261E' }}>{message}</p>
        )}

        <p className="text-xs" style={{ color: '#9A8F83', lineHeight: 1.6 }}>
          Qualifying income is gross self-employment turnover plus gross property income, before
          expenses. We use it once to work out your dates — no account needed.
        </p>
      </form>
    </div>
  );
}

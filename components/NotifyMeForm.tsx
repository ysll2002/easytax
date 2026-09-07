'use client';

import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { getStoredAnonId } from './PageViewTracker';

// Email capture for visitors who are interested but cannot be converted yet,
// because HMRC production approval is still pending. Asking for an address and
// a segment is a far lower commitment than creating an account, and the
// segment is what makes the launch email worth opening.

const SEGMENTS: { value: string; label: string }[] = [
  { value: 'sole_trader',     label: 'Sole trader / freelancer' },
  { value: 'landlord',        label: 'Landlord' },
  { value: 'limited_company', label: 'Limited company' },
  { value: 'accountant',      label: 'Accountant / bookkeeper' },
];

export default function NotifyMeForm({
  source,
  heading = 'Be first to file',
  blurb = 'MTD ITSA filing opens as soon as HMRC signs off our production access. Leave your email and we will tell you the day it goes live — no other mail, unsubscribe in one click.',
  variant = 'card',
}: {
  /** Which page captured the address, e.g. 'home' or 'pricing'. */
  source: string;
  heading?: string;
  blurb?: string;
  /** `card` is the full block with the segment select. `compact` drops the
   *  select and stacks to a single row — it is what goes in the footer and
   *  mid-article, where the ask has to be small enough not to interrupt. */
  variant?: 'card' | 'compact';
}) {
  const [email, setEmail]     = useState('');
  const [segment, setSegment] = useState('');
  const [state, setState]     = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === 'loading') return;
    setState('loading');
    setMessage('');

    let utm: Record<string, string> = {};
    try {
      utm = JSON.parse(sessionStorage.getItem('et_utm') ?? '{}');
    } catch {
      // No attribution available — not worth failing the signup over.
    }

    try {
      const res = await fetch('/api/notify-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
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
      setState('done');
      setMessage(
        data.alreadySubscribed
          ? "You're already on the list — we'll be in touch."
          : "You're on the list. We'll email you the day filing opens.",
      );
    } catch {
      setState('error');
      setMessage('Network error. Please try again.');
    }
  };

  // Compact: no segment select, one row on desktop, stacked on mobile. Always
  // rendered on a light surface — the footer gives it its own cream card
  // rather than the component carrying a second colour scheme.
  if (variant === 'compact') {
    if (state === 'done') {
      return (
        <div
          className="p-4 rounded-xl flex items-start gap-2.5"
          style={{ backgroundColor: '#F0EBE1', border: '1px solid #6B8E6E40' }}
        >
          <Check size={16} color="#6B8E6E" strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm" style={{ color: '#1C1208', lineHeight: 1.5 }}>{message}</p>
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Bell size={15} color="#C4622D" strokeWidth={2} className="flex-shrink-0" />
          <p className="font-semibold text-sm" style={{ color: '#1C1208' }}>{heading}</p>
        </div>
        <p className="text-xs mb-3" style={{ color: '#9A8F83', lineHeight: 1.6 }}>{blurb}</p>

        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address"
            className="flex-1 min-w-0"
            style={{
              padding: '0.7rem 0.9rem',
              borderRadius: '0.75rem',
              border: '1px solid #DDD5C8',
              backgroundColor: '#FDFCF8',
              color: '#1C1208',
              fontSize: '0.9rem',
              minHeight: '44px',
            }}
          />
          <button
            type="submit"
            disabled={state === 'loading'}
            className="flex-shrink-0"
            style={{
              padding: '0.7rem 1.4rem',
              borderRadius: '50px',
              border: 'none',
              backgroundColor: state === 'loading' ? '#C4622D99' : '#C4622D',
              color: '#FDFCF8',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: state === 'loading' ? 'default' : 'pointer',
              minHeight: '44px',
            }}
          >
            {state === 'loading' ? 'Adding you…' : 'Notify me'}
          </button>
        </form>

        {state === 'error' && (
          <p className="text-xs mt-2" role="alert" style={{ color: '#B3261E' }}>{message}</p>
        )}
      </div>
    );
  }

  if (state === 'done') {
    return (
      <div
        className="p-5 sm:p-6 rounded-2xl flex items-start gap-3"
        style={{ backgroundColor: '#F0EBE1', border: '1px solid #6B8E6E40' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#6B8E6E' }}
        >
          <Check size={16} color="#FDFCF8" strokeWidth={2.5} />
        </div>
        <div>
          <p className="font-semibold mb-1" style={{ color: '#1C1208', fontSize: '0.95rem' }}>
            Thanks — you&apos;re on the list.
          </p>
          <p className="text-sm" style={{ color: '#4A4035', lineHeight: 1.5 }}>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-5 sm:p-7 rounded-2xl"
      style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E8E2DA' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Bell size={16} color="#C4622D" strokeWidth={2} />
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
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className="w-full"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.75rem',
            border: '1px solid #DDD5C8',
            backgroundColor: '#FDFCF8',
            color: '#1C1208',
            fontSize: '0.95rem',
            minHeight: '44px',
          }}
        />

        <select
          value={segment}
          onChange={e => setSegment(e.target.value)}
          aria-label="What best describes you?"
          className="w-full"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.75rem',
            border: '1px solid #DDD5C8',
            backgroundColor: '#FDFCF8',
            color: segment ? '#1C1208' : '#9A8F83',
            fontSize: '0.95rem',
            minHeight: '44px',
          }}
        >
          <option value="">What best describes you? (optional)</option>
          {SEGMENTS.map(s => (
            <option key={s.value} value={s.value} style={{ color: '#1C1208' }}>{s.label}</option>
          ))}
        </select>

        <button
          type="submit"
          disabled={state === 'loading'}
          className="w-full sm:w-auto sm:self-start"
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
          {state === 'loading' ? 'Adding you…' : 'Notify me at launch →'}
        </button>

        {state === 'error' && (
          <p className="text-sm" role="alert" style={{ color: '#B3261E' }}>{message}</p>
        )}
      </form>
    </div>
  );
}

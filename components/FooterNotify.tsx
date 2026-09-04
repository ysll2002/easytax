'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { getStoredAnonId } from './PageViewTracker';

// Compact launch capture that lives in the site-wide footer.
//
// The full NotifyMeForm sits on three pages (/, /pricing, /trust). Every other
// page — the 109 Tax Tips articles and the 13 comparison/guide landing pages,
// i.e. everything organic search will actually land on — had no capture at
// all, so a reader arriving from search could only convert by creating an
// account, which is not yet possible to use because HMRC production approval
// is pending. Putting a one-field version in the footer covers every page in
// one change.
//
// `source` is stored on the row so the launch list can be attributed per
// surface in /api/admin/daily-metrics rather than lumped together.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function FooterNotify() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === 'loading') return;

    if (!EMAIL_RE.test(email)) {
      setState('error');
      setMessage('Enter a valid email address.');
      return;
    }

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
          source: 'footer',
          anonId: getStoredAnonId(),
          path: window.location.pathname,
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
          ? "You're already on the list."
          : "You're on the list — we'll email you the day filing opens.",
      );
    } catch {
      setState('error');
      setMessage('Network error. Please try again.');
    }
  };

  if (state === 'done') {
    return (
      <div className="flex items-start gap-2.5">
        <Check size={16} color="#6B8E6E" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2 }} />
        <p className="text-sm" style={{ color: '#DDD5C8', lineHeight: 1.5 }}>{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address for launch notification"
          className="flex-1 min-w-0"
          style={{
            padding: '0.7rem 0.9rem',
            borderRadius: '0.6rem',
            border: '1px solid #3D3025',
            backgroundColor: '#2E2418',
            color: '#FDFCF8',
            fontSize: '0.9rem',
            minHeight: '44px',
          }}
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          style={{
            padding: '0.7rem 1.4rem',
            borderRadius: '0.6rem',
            border: 'none',
            backgroundColor: state === 'loading' ? '#C4622D99' : '#C4622D',
            color: '#FDFCF8',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: state === 'loading' ? 'default' : 'pointer',
            minHeight: '44px',
            whiteSpace: 'nowrap',
          }}
        >
          {state === 'loading' ? 'Adding…' : 'Notify me'}
        </button>
      </div>
      {state === 'error' && (
        <p className="text-xs" role="alert" style={{ color: '#E8A08A' }}>{message}</p>
      )}
    </form>
  );
}

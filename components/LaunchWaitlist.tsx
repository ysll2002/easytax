'use client';
import { useState } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { track } from '@/lib/track';

type Props = {
  source: 'pricing' | 'dashboard' | 'mtd-checker' | 'homepage';
  /** Pre-fill for logged-in users; renders a one-click button instead of an input. */
  defaultEmail?: string;
  /** 'light' for cream backgrounds, 'dark' for the dark-brown sections. */
  tone?: 'light' | 'dark';
  buttonLabel?: string;
};

export default function LaunchWaitlist({ source, defaultEmail, tone = 'light', buttonLabel = 'Reserve my founder price' }: Props) {
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const dark = tone === 'dark';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === 'loading') return;
    setState('loading');
    setMessage('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
        track('waitlist_failed', { source, reason: data.code || 'api_error' });
        return;
      }
      setState('done');
      setMessage(data.already_on_list ? "You're already on the list — we'll email you the moment live filing opens." : "Done. We'll email you once, the moment live HMRC filing opens.");
      track('waitlist_joined', { source, already: !!data.already_on_list, stored: data.stored });
    } catch {
      setState('error');
      setMessage('Network error. Please try again.');
      track('waitlist_failed', { source, reason: 'network' });
    }
  }

  if (state === 'done') {
    return (
      <div className="flex items-start gap-2 text-sm" style={{ color: dark ? '#FDFCF8' : '#1C1208' }}>
        <CheckCircle2 size={18} color="#6B8E6E" className="flex-shrink-0 mt-0.5" />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-2">
        {!defaultEmail && (
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address"
            className="flex-1 px-4 rounded-full text-sm"
            style={{ minHeight: 46, border: `1.5px solid ${dark ? '#4A4035' : '#DDD5C8'}`, backgroundColor: dark ? '#2E2418' : '#FFFFFF', color: dark ? '#FDFCF8' : '#1C1208', outline: 'none' }}
          />
        )}
        <button
          type="submit"
          disabled={state === 'loading'}
          className="inline-flex items-center justify-center gap-2 px-6 rounded-full font-semibold text-sm whitespace-nowrap"
          style={{ minHeight: 46, backgroundColor: '#C4622D', color: '#FDFCF8', border: 'none', cursor: state === 'loading' ? 'wait' : 'pointer', opacity: state === 'loading' ? 0.7 : 1 }}
        >
          {state === 'loading' ? 'Saving…' : buttonLabel} {state !== 'loading' && <ArrowRight size={15} />}
        </button>
      </div>
      {defaultEmail && (
        <p className="text-xs mt-2" style={{ color: dark ? '#9A8F83' : '#9A8F83' }}>We&apos;ll use {defaultEmail}. One email when live filing opens — nothing else.</p>
      )}
      {state === 'error' && <p className="text-xs mt-2" style={{ color: '#C4622D' }}>{message}</p>}
    </form>
  );
}

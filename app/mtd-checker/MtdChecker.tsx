'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, CheckCircle2, Info, MinusCircle } from 'lucide-react';
import {
  checkMandation,
  formatDeadlineDate,
  daysUntil,
  MANDATION_BANDS,
  type MandationResult,
} from '@/lib/mtd-deadlines';
import { trackClient, getStoredAnonId } from '@/components/PageViewTracker';

// Three questions, one answer.
//
// The question this answers — "does MTD actually apply to me, and from when?"
// — is the highest-intent thing a UK sole trader or landlord is searching for
// right now, and the site had no page that answered it. /timetable lists the
// dates but leaves the reader to work out which ones are theirs.
//
// The lookback is the part most tools get wrong and the reason this is worth
// building rather than writing another explainer: mandation is decided by the
// qualifying income on the return for the tax year *two years before* MTD
// starts, not by what you earn today. See lib/mtd-deadlines.ts.

const INCOME_BANDS: { value: string; label: string; amount: number }[] = [
  { value: 'under-20k', label: 'Under £20,000',        amount: 15_000 },
  { value: '20-30k',    label: '£20,000 – £30,000',    amount: 25_000 },
  { value: '30-50k',    label: '£30,000 – £50,000',    amount: 40_000 },
  { value: 'over-50k',  label: 'Over £50,000',         amount: 60_000 },
];

const SOURCES: { value: string; label: string; qualifying: boolean; segment: string }[] = [
  { value: 'sole_trader',     label: 'Self-employment / sole trader',   qualifying: true,  segment: 'sole_trader' },
  { value: 'landlord',        label: 'UK property rental',              qualifying: true,  segment: 'landlord' },
  { value: 'both',            label: 'Both self-employment and rental', qualifying: true,  segment: 'sole_trader' },
  { value: 'limited_company', label: 'Only a limited company salary or dividends', qualifying: false, segment: 'limited_company' },
];

const card: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E8E2DA',
  borderRadius: '1rem',
};

const label: React.CSSProperties = {
  fontSize: '0.95rem',
  fontWeight: 600,
  color: '#1C1208',
  marginBottom: '0.75rem',
  display: 'block',
};

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="w-full text-left transition-all"
      style={{
        padding: '0.85rem 1rem',
        borderRadius: '0.75rem',
        border: selected ? '1.5px solid #C4622D' : '1.5px solid #E8E2DA',
        backgroundColor: selected ? '#F0EBE1' : '#FDFCF8',
        color: '#1C1208',
        fontSize: '0.92rem',
        fontWeight: selected ? 600 : 400,
        cursor: 'pointer',
        minHeight: '44px',
      }}
    >
      {children}
    </button>
  );
}

export default function MtdChecker() {
  const [source, setSource] = useState<string>('');
  const [band, setBand] = useState<string>('');
  const [result, setResult] = useState<MandationResult | null>(null);

  const [email, setEmail] = useState('');
  const [mailState, setMailState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [mailMessage, setMailMessage] = useState('');

  const canSubmit = source !== '' && band !== '';

  const run = () => {
    const chosenSource = SOURCES.find(s => s.value === source);
    const chosenBand = INCOME_BANDS.find(b => b.value === band);
    if (!chosenSource || !chosenBand) return;

    const outcome = checkMandation(chosenBand.amount, chosenSource.qualifying);
    setResult(outcome);

    trackClient('checker_completed', {
      source: chosenSource.value,
      band: chosenBand.value,
      mandated: outcome.mandated,
      startTaxYear: outcome.mandated ? outcome.band.startTaxYear : null,
    });
  };

  const reset = () => {
    setResult(null);
    setMailState('idle');
    setMailMessage('');
  };

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mailState === 'loading') return;
    setMailState('loading');
    setMailMessage('');

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
          segment: SOURCES.find(s => s.value === source)?.segment ?? null,
          source: 'mtd-checker',
          anonId: getStoredAnonId(),
          path: window.location.pathname,
          referrer: document.referrer || null,
          ...utm,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMailState('error');
        setMailMessage(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setMailState('done');
      setMailMessage(
        data.alreadySubscribed
          ? "You're already on the list — we'll be in touch."
          : "Saved. We'll remind you before your first deadline.",
      );
    } catch {
      setMailState('error');
      setMailMessage('Network error. Please try again.');
    }
  };

  // ── Result ──
  if (result) {
    const mandated = result.mandated;
    const deadline = mandated ? result.firstQuarterlyDeadline : null;

    return (
      <div style={card} className="p-5 sm:p-7">
        <div className="flex items-start gap-3 mb-4">
          {mandated ? (
            <CheckCircle2 size={22} color="#C4622D" strokeWidth={2} style={{ flexShrink: 0, marginTop: 3 }} />
          ) : (
            <MinusCircle size={22} color="#6B8E6E" strokeWidth={2} style={{ flexShrink: 0, marginTop: 3 }} />
          )}
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
                fontSize: 'clamp(1.35rem, 3.5vw, 1.75rem)',
                fontWeight: 700,
                color: '#1C1208',
                lineHeight: 1.25,
              }}
            >
              {mandated
                ? `You'll need to use MTD from ${formatDeadlineDate(result.band.startDate)}`
                : result.reason === 'no-qualifying-income'
                  ? 'MTD for Income Tax does not apply to you'
                  : 'You are not in scope yet'}
            </h2>
          </div>
        </div>

        {mandated ? (
          <>
            <p className="text-sm mb-5" style={{ color: '#4A4035', lineHeight: 1.7 }}>
              Your qualifying income is over £{result.band.threshold.toLocaleString('en-GB')}, so HMRC
              will assess your <strong>{result.band.assessedTaxYear}</strong> Self Assessment return and
              require quarterly updates from the <strong>{result.band.startTaxYear}</strong> tax year
              onwards. That means four quarterly updates plus a final declaration each year, filed from
              MTD-compatible software.
            </p>

            {deadline && (
              <div
                className="p-4 rounded-xl mb-5 flex items-start gap-3"
                style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}
              >
                <Calendar size={17} color="#C4622D" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1C1208' }}>
                    Your first quarterly deadline: {formatDeadlineDate(deadline.date)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#4A4035', lineHeight: 1.6 }}>
                    {deadline.desc} That is {daysUntil(deadline.date).toLocaleString('en-GB')} days away.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm mb-5" style={{ color: '#4A4035', lineHeight: 1.7 }}>
            {result.reason === 'no-qualifying-income' ? (
              <>
                MTD for Income Tax applies to gross income from self-employment and UK property. A
                salary or dividends from your own limited company are not qualifying income, so
                quarterly updates are not required for them. Your company&apos;s own VAT and
                Corporation Tax obligations are unaffected by this.
              </>
            ) : (
              <>
                Your qualifying income is at or below £20,000, which is under every announced
                threshold — the lowest, £20,000, starts on 6 April 2028. You can carry on filing one
                Self Assessment return a year. If your income grows past a threshold, HMRC assesses
                the return two tax years before mandation, so it is worth re-checking each year.
              </>
            )}
          </p>
        )}

        {/* Reminder capture. The person most likely to leave an address is the
            one who has just been told a deadline applies to them. */}
        {mailState === 'done' ? (
          <div
            className="p-4 rounded-xl flex items-start gap-2.5"
            style={{ backgroundColor: '#F0EBE1', border: '1px solid #6B8E6E40' }}
          >
            <CheckCircle2 size={17} color="#6B8E6E" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
            <p className="text-sm" style={{ color: '#1C1208', lineHeight: 1.55 }}>{mailMessage}</p>
          </div>
        ) : (
          <form onSubmit={subscribe} className="flex flex-col gap-2 mb-4">
            <label htmlFor="checker-email" className="text-sm font-semibold" style={{ color: '#1C1208' }}>
              {mandated ? 'Get a reminder before your deadline' : 'Tell me if the rules change'}
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="checker-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 min-w-0"
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
              <button
                type="submit"
                disabled={mailState === 'loading'}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '50px',
                  border: 'none',
                  backgroundColor: mailState === 'loading' ? '#C4622D99' : '#C4622D',
                  color: '#FDFCF8',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: mailState === 'loading' ? 'default' : 'pointer',
                  minHeight: '44px',
                  whiteSpace: 'nowrap',
                }}
              >
                {mailState === 'loading' ? 'Saving…' : 'Remind me'}
              </button>
            </div>
            {mailState === 'error' && (
              <p className="text-xs" role="alert" style={{ color: '#B3261E' }}>{mailMessage}</p>
            )}
          </form>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center mt-5 pt-5" style={{ borderTop: '1px solid #E8E2DA' }}>
          <Link
            href="/register"
            onClick={() => trackClient('checker_cta_click', { target: 'register', mandated })}
            className="inline-flex items-center justify-center gap-2"
            style={{
              backgroundColor: '#1C1208',
              color: '#FDFCF8',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              padding: '0.75rem 1.5rem',
              borderRadius: '50px',
              minHeight: '44px',
            }}
          >
            Create a free account <ArrowRight size={15} />
          </Link>
          <Link
            href="/timetable"
            onClick={() => trackClient('checker_cta_click', { target: 'timetable', mandated })}
            className="inline-flex items-center justify-center"
            style={{ color: '#C4622D', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, minHeight: '44px' }}
          >
            See every MTD deadline →
          </Link>
          <button
            type="button"
            onClick={reset}
            style={{
              background: 'none',
              border: 'none',
              color: '#9A8F83',
              fontSize: '0.85rem',
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            Start again
          </button>
        </div>
      </div>
    );
  }

  // ── Questions ──
  return (
    <div style={card} className="p-5 sm:p-7">
      <fieldset style={{ border: 'none', padding: 0, margin: '0 0 1.5rem' }}>
        <legend style={label}>1. Where does your income come from?</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SOURCES.map(s => (
            <OptionButton key={s.value} selected={source === s.value} onClick={() => setSource(s.value)}>
              {s.label}
            </OptionButton>
          ))}
        </div>
      </fieldset>

      <fieldset style={{ border: 'none', padding: 0, margin: '0 0 1.25rem' }}>
        <legend style={label}>
          2. What is your gross annual income from those sources?
        </legend>
        <div
          className="flex items-start gap-2 mb-3 p-3 rounded-xl"
          style={{ backgroundColor: '#F8F5F0', border: '1px solid #E8E2DA' }}
        >
          <Info size={15} color="#C4622D" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
          <p className="text-xs" style={{ color: '#4A4035', lineHeight: 1.6 }}>
            <strong>Gross, not profit.</strong> HMRC looks at your turnover and rents before you
            deduct any expenses. This catches people out: £60,000 of turnover with £45,000 of costs
            is still over the £50,000 threshold.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {INCOME_BANDS.map(b => (
            <OptionButton key={b.value} selected={band === b.value} onClick={() => setBand(b.value)}>
              {b.label}
            </OptionButton>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={run}
        disabled={!canSubmit}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2"
        style={{
          padding: '0.85rem 2rem',
          borderRadius: '50px',
          border: 'none',
          backgroundColor: canSubmit ? '#C4622D' : '#DDD5C8',
          color: canSubmit ? '#FDFCF8' : '#9A8F83',
          fontSize: '0.95rem',
          fontWeight: 600,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          minHeight: '44px',
        }}
      >
        Check my MTD start date <ArrowRight size={16} />
      </button>

      <p className="text-xs mt-4" style={{ color: '#9A8F83', lineHeight: 1.6 }}>
        Nothing is submitted anywhere and no account is needed — the answer is worked out in your
        browser from the thresholds below.
      </p>

      <div className="mt-5 pt-5" style={{ borderTop: '1px solid #E8E2DA' }}>
        <p className="text-xs font-semibold mb-2" style={{ color: '#1C1208' }}>The thresholds</p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {MANDATION_BANDS.map(b => (
            <li key={b.startDate} className="text-xs" style={{ color: '#4A4035', lineHeight: 1.9 }}>
              Over £{b.threshold.toLocaleString('en-GB')} in {b.assessedTaxYear} → MTD from{' '}
              {formatDeadlineDate(b.startDate)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

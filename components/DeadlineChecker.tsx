'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { trackClient } from './PageViewTracker';
import {
  quartersForTaxYear,
  finalDeclarationFor,
  firstMandatedTaxYear,
  nextQuarterDeadline,
  daysUntil,
  thresholdForTaxYear,
  type QuarterDeadline,
} from '@/lib/mtd-dates';

// "Am I in MTD, and when are my deadlines?" is the single most-asked question
// among UK sole traders and landlords right now, and the answer is genuinely
// fiddly: the threshold steps down each year, the deadlines are the 7th (not
// the 5th, as half the internet says), and the quarters do not line up with
// calendar quarters. Answering it properly is worth more inbound attention
// than another comparison page, and it ends on the one CTA we can honestly
// make today — join the launch list.

type IncomeKind = 'self_employment' | 'property';

const KINDS: { value: IncomeKind; label: string; hint: string }[] = [
  { value: 'self_employment', label: 'Self-employment', hint: 'Sole trader, freelance or contract work' },
  { value: 'property',        label: 'UK property',     hint: 'Rental income from land or property' },
];

function formatGbp(n: number): string {
  return `£${n.toLocaleString('en-GB')}`;
}

export default function DeadlineChecker() {
  const [kinds, setKinds]   = useState<IncomeKind[]>([]);
  const [income, setIncome] = useState('');
  const [result, setResult] = useState<null | { mandatedFrom: number | null; income: number }>(null);
  const started = useRef(false);

  // Fired once, on the first real interaction, so the funnel can separate
  // "landed on the page" from "actually engaged with the tool".
  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    trackClient('checker_started');
  };

  const toggleKind = (k: IncomeKind) => {
    markStarted();
    setKinds(prev => (prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]));
    setResult(null);
  };

  const parsedIncome = useMemo(() => {
    const n = Number(income.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [income]);

  const canSubmit = kinds.length > 0 && parsedIncome !== null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || parsedIncome === null) return;
    const mandatedFrom = firstMandatedTaxYear(parsedIncome);
    setResult({ mandatedFrom, income: parsedIncome });
    trackClient('checker_completed', {
      // Banded, never the raw figure — this is someone's income and there is
      // no reason for us to store it.
      income_band:
        parsedIncome > 50_000 ? 'over_50k'
        : parsedIncome > 30_000 ? '30k_50k'
        : parsedIncome > 20_000 ? '20k_30k'
        : 'under_20k',
      kinds: kinds.join('+'),
      mandated_from: mandatedFrom ?? 'not_mandated',
    });
  };

  return (
    <div>
      <form onSubmit={submit} className="rounded-2xl p-5 sm:p-8" style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' }}>
        <fieldset className="border-0 p-0 m-0 mb-7">
          <legend className="text-sm font-semibold mb-1 p-0" style={{ color: '#1C1208' }}>
            1. What kind of income do you have?
          </legend>
          <p className="text-xs mb-4" style={{ color: '#9A8F83' }}>Select all that apply.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {KINDS.map(k => {
              const on = kinds.includes(k.value);
              return (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => toggleKind(k.value)}
                  aria-pressed={on}
                  className="text-left rounded-xl px-4 py-3 transition-all"
                  style={{
                    minHeight: 64,
                    backgroundColor: on ? '#F5E4D8' : '#F0EBE1',
                    border: `1px solid ${on ? '#C4622D' : '#DDD5C8'}`,
                  }}
                >
                  <span className="block text-sm font-medium" style={{ color: '#1C1208' }}>{k.label}</span>
                  <span className="block text-xs mt-0.5" style={{ color: '#9A8F83' }}>{k.hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mb-7">
          <label htmlFor="qualifying-income" className="block text-sm font-semibold mb-1" style={{ color: '#1C1208' }}>
            2. Combined gross income from those sources
          </label>
          <p className="text-xs mb-3" style={{ color: '#9A8F83' }}>
            Turnover and rent <strong>before</strong> deducting any expenses — HMRC calls this your
            qualifying income. Employment and dividend income do not count.
          </p>
          <div className="relative" style={{ maxWidth: 260 }}>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#9A8F83' }}>£</span>
            <input
              id="qualifying-income"
              type="text"
              inputMode="numeric"
              value={income}
              onChange={e => { markStarted(); setIncome(e.target.value); setResult(null); }}
              placeholder="45,000"
              className="w-full rounded-xl pl-8 pr-4 text-sm outline-none"
              style={{ minHeight: 48, backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8', color: '#1C1208' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 px-7 rounded-full text-sm font-semibold transition-all"
          style={{
            minHeight: 48,
            backgroundColor: canSubmit ? '#C4622D' : '#DDD5C8',
            color: canSubmit ? '#FDFCF8' : '#9A8F83',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          Show my deadlines <ArrowRight size={16} />
        </button>
      </form>

      {result && <Result mandatedFrom={result.mandatedFrom} income={result.income} />}
    </div>
  );
}

function Result({ mandatedFrom, income }: { mandatedFrom: number | null; income: number }) {
  if (mandatedFrom === null) {
    const lowest = thresholdForTaxYear(2028);
    return (
      <Panel tone="neutral" icon={<Info size={20} style={{ color: '#4A4035' }} />}
             title="You are not in MTD for Income Tax — for now">
        <p>
          At {formatGbp(income)} of qualifying income you are below every threshold announced so
          far. The lowest confirmed threshold is {formatGbp(lowest)} from April 2028.
        </p>
        <p>
          You still file a Self Assessment return in the usual way, by 31 January after the end of
          each tax year. If your income grows past {formatGbp(lowest)}, you would come into MTD from
          the following April.
        </p>
      </Panel>
    );
  }

  const taxYearLabel = `${mandatedFrom}/${String(mandatedFrom + 1).slice(-2)}`;
  const quarters = quartersForTaxYear(mandatedFrom);
  const final = finalDeclarationFor(mandatedFrom);
  const now = new Date();
  const alreadyStarted = now >= quarters[0].periodStart;
  const upcoming = nextQuarterDeadline(now);
  const showCountdown = alreadyStarted && upcoming !== null;

  return (
    <Panel
      tone="active"
      icon={<CheckCircle2 size={20} style={{ color: '#3F7D5C' }} />}
      title={
        alreadyStarted
          ? `You are in MTD for Income Tax now (since April ${mandatedFrom})`
          : `You come into MTD for Income Tax in April ${mandatedFrom}`
      }
    >
      <p>
        At {formatGbp(income)} of qualifying income you pass the{' '}
        {formatGbp(thresholdForTaxYear(mandatedFrom))} threshold that applies from 6 April{' '}
        {mandatedFrom}. From then you must keep digital records and send four quarterly updates
        plus a final declaration for the {taxYearLabel} tax year, instead of one Self Assessment
        return.
      </p>

      {showCountdown && upcoming && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3 my-5"
          style={{ backgroundColor: '#F5E4D8', border: '1px solid #C4622D40' }}
        >
          <CalendarClock size={18} style={{ color: '#C4622D', flexShrink: 0, marginTop: 2 }} />
          <p className="text-sm m-0" style={{ color: '#1C1208' }}>
            <strong>Your next deadline is {upcoming.deadlineLabel}</strong> — {daysUntil(upcoming.deadline, now)}{' '}
            days away. That is the {upcoming.key} update, covering {upcoming.periodLabel}.
          </p>
        </div>
      )}

      <h3 className="text-sm font-semibold mt-6 mb-3" style={{ color: '#1C1208' }}>
        Your {taxYearLabel} deadlines
      </h3>
      {/* Stacked rows on mobile, three columns from `sm` up. A horizontally
          scrolling table hid the "Due by" column — the one thing the reader
          came for — behind a swipe on a 390px screen. */}
      <ul className="list-none p-0 m-0">
        {[
          ...quarters.map((q: QuarterDeadline) => ({
            key: q.key,
            label: `${q.key} update`,
            period: q.periodLabel,
            due: q.deadlineLabel,
          })),
          {
            key: 'final',
            label: 'Final declaration',
            period: `Whole ${taxYearLabel} year`,
            due: final.deadlineLabel,
          },
        ].map(row => (
          <li
            key={row.key}
            className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-4 py-3"
            style={{ borderBottom: '1px solid #F0EBE1' }}
          >
            <span className="text-sm font-medium sm:w-36 sm:flex-shrink-0" style={{ color: '#1C1208' }}>
              {row.label}
            </span>
            <span className="text-xs sm:text-sm sm:flex-1" style={{ color: '#9A8F83' }}>
              {row.period}
            </span>
            <span className="text-sm font-semibold sm:text-right sm:flex-shrink-0" style={{ color: '#C4622D' }}>
              Due {row.due}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-xs mt-4" style={{ color: '#9A8F83' }}>
        Quarterly updates report cumulative totals since 6 April, so each one restates the year so
        far rather than just the new quarter. Deadlines fall on the 7th — one month and two days
        after the quarter ends.
      </p>
    </Panel>
  );
}

function Panel({
  tone,
  icon,
  title,
  children,
}: {
  tone: 'active' | 'neutral';
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5 sm:p-8 mt-6"
      style={{
        backgroundColor: '#FDFCF8',
        border: `1px solid ${tone === 'active' ? '#3F7D5C40' : '#DDD5C8'}`,
      }}
      aria-live="polite"
    >
      <div className="flex items-start gap-3 mb-4">
        <span style={{ flexShrink: 0, marginTop: 2 }}>{icon}</span>
        <h2
          className="m-0"
          style={{
            fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
            fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
            fontWeight: 700,
            color: '#1C1208',
            lineHeight: 1.3,
          }}
        >
          {title}
        </h2>
      </div>
      <div className="text-sm leading-relaxed space-y-3" style={{ color: '#4A4035' }}>
        {children}
      </div>
      <div className="mt-7 pt-6" style={{ borderTop: '1px solid #F0EBE1' }}>
        <p className="text-sm mb-4" style={{ color: '#4A4035' }}>
          EasyTax files these updates for £20 + VAT each, with no subscription. Our HMRC production
          access is still being approved, so we cannot take live submissions yet — join the list and
          we will tell you the day it opens.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/#notify"
            className="inline-flex items-center justify-center gap-2 px-6 rounded-full text-sm font-semibold"
            style={{ minHeight: 48, backgroundColor: '#1C1208', color: '#FDFCF8' }}
          >
            Tell me when filing opens
          </Link>
          <Link
            href="/timetable"
            className="inline-flex items-center justify-center gap-2 px-6 rounded-full text-sm font-medium"
            style={{ minHeight: 48, border: '1px solid #DDD5C8', color: '#4A4035' }}
          >
            See the full MTD timetable
          </Link>
        </div>
      </div>
    </div>
  );
}

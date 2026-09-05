'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { trackClient } from './PageViewTracker';
import {
  calculatePenalties,
  selectableTaxYears,
  filingDeadlineFor,
  taxYearLabel,
  formatDate,
  HMRC_PENALTIES_URL,
  type PenaltyLine,
  type PenaltyResult,
} from '@/lib/sa-penalties';

// "How much is the fine for filing my tax return late" is a question people
// type when they are already anxious and already late. The honest answer is a
// number and a breakdown, given immediately and without an email gate — which
// is also why the page is worth linking to. The CTA at the end is the launch
// list, because we cannot take live filings until HMRC signs off.

const TOOL = 'sa_penalty';

function gbp(n: number): string {
  return `£${Math.abs(n).toLocaleString('en-GB')}`;
}

/** `<input type="date">` wants YYYY-MM-DD in the local calendar. */
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function PenaltyCalculator() {
  const years = useMemo(() => selectableTaxYears(), []);
  const [taxYear, setTaxYear] = useState(years[0]);
  const [filingDate, setFilingDate] = useState(isoDate(new Date()));
  const [taxDue, setTaxDue] = useState('');
  const [unpaid, setUnpaid] = useState(true);
  const [result, setResult] = useState<PenaltyResult | null>(null);
  const started = useRef(false);

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    trackClient('tool_started', { tool: TOOL });
  };

  const parsedTax = useMemo(() => {
    const n = Number(taxDue.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) && n >= 0 ? n : null;
  }, [taxDue]);

  const parsedDate = useMemo(() => {
    const d = new Date(`${filingDate}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [filingDate]);

  const canSubmit = parsedTax !== null && parsedDate !== null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || parsedTax === null || parsedDate === null) return;

    const r = calculatePenalties({
      taxYearStart: taxYear,
      filingDate: parsedDate,
      // When the tax is still unpaid, the payment penalties are measured to the
      // same date — that is the reader's position today, which is what they
      // are asking about.
      paymentDate: unpaid ? parsedDate : null,
      taxDue: parsedTax,
    });
    setResult(r);

    trackClient('tool_completed', {
      tool: TOOL,
      // Banded, never the figure itself.
      penalty_band:
        r.total === 0 ? 'none'
        : r.total < 200 ? 'under_200'
        : r.total < 1000 ? '200_1000'
        : r.total < 3000 ? '1000_3000'
        : 'over_3000',
      days_late: r.daysLateFiling,
      tax_year: taxYear,
      unpaid,
    });
  };

  const deadline = filingDeadlineFor(taxYear);

  return (
    <div>
      <form
        onSubmit={submit}
        className="rounded-2xl p-5 sm:p-8"
        style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' }}
      >
        {/* 1. Tax year */}
        <fieldset className="border-0 p-0 m-0 mb-7">
          <legend className="text-sm font-semibold mb-1 p-0" style={{ color: '#1C1208' }}>
            1. Which tax year is the return for?
          </legend>
          <p className="text-xs mb-4" style={{ color: '#9A8F83' }}>
            The {taxYearLabel(taxYear)} return was due online by {formatDate(deadline)}.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {years.map(y => {
              const on = y === taxYear;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => { markStarted(); setTaxYear(y); setResult(null); }}
                  aria-pressed={on}
                  className="rounded-xl px-3 py-3 text-sm font-medium transition-all"
                  style={{
                    minHeight: 48,
                    backgroundColor: on ? '#F5E4D8' : '#F0EBE1',
                    border: `1px solid ${on ? '#C4622D' : '#DDD5C8'}`,
                    color: '#1C1208',
                  }}
                >
                  {taxYearLabel(y)}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* 2. Filing date */}
        <div className="mb-7">
          <label htmlFor="filing-date" className="block text-sm font-semibold mb-1" style={{ color: '#1C1208' }}>
            2. When did you file, or when will you?
          </label>
          <p className="text-xs mb-3" style={{ color: '#9A8F83' }}>
            Leave it at today to see where you stand right now.
          </p>
          <input
            id="filing-date"
            type="date"
            value={filingDate}
            onChange={e => { markStarted(); setFilingDate(e.target.value); setResult(null); }}
            className="w-full rounded-xl px-4 text-sm outline-none"
            style={{
              minHeight: 48,
              maxWidth: 260,
              backgroundColor: '#F0EBE1',
              border: '1px solid #DDD5C8',
              color: '#1C1208',
            }}
          />
        </div>

        {/* 3. Tax owed */}
        <div className="mb-7">
          <label htmlFor="tax-due" className="block text-sm font-semibold mb-1" style={{ color: '#1C1208' }}>
            3. How much tax do you owe for that year?
          </label>
          <p className="text-xs mb-3" style={{ color: '#9A8F83' }}>
            Enter 0 if you owe nothing — the £100 penalty applies either way. The 6 and 12 month
            penalties are a percentage of this figure.
          </p>
          <div className="relative" style={{ maxWidth: 260 }}>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#9A8F83' }}>£</span>
            <input
              id="tax-due"
              type="text"
              inputMode="numeric"
              value={taxDue}
              onChange={e => { markStarted(); setTaxDue(e.target.value); setResult(null); }}
              placeholder="3,200"
              className="w-full rounded-xl pl-8 pr-4 text-sm outline-none"
              style={{ minHeight: 48, backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8', color: '#1C1208' }}
            />
          </div>
        </div>

        {/* 4. Paid? */}
        <div className="mb-7">
          <span className="block text-sm font-semibold mb-3" style={{ color: '#1C1208' }}>
            4. Have you paid the tax?
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { value: false, label: 'Paid on time', hint: 'Only late filing penalties apply' },
              { value: true,  label: 'Still unpaid', hint: 'Late payment penalties apply too' },
            ].map(opt => {
              const on = unpaid === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => { markStarted(); setUnpaid(opt.value); setResult(null); }}
                  aria-pressed={on}
                  className="text-left rounded-xl px-4 py-3 transition-all"
                  style={{
                    minHeight: 64,
                    backgroundColor: on ? '#F5E4D8' : '#F0EBE1',
                    border: `1px solid ${on ? '#C4622D' : '#DDD5C8'}`,
                  }}
                >
                  <span className="block text-sm font-medium" style={{ color: '#1C1208' }}>{opt.label}</span>
                  <span className="block text-xs mt-0.5" style={{ color: '#9A8F83' }}>{opt.hint}</span>
                </button>
              );
            })}
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
          Work out what I owe <ArrowRight size={16} />
        </button>
      </form>

      {result && <Result result={result} />}
    </div>
  );
}

function Result({ result }: { result: PenaltyResult }) {
  if (result.onTime) {
    return (
      <Panel
        tone="ok"
        icon={<CheckCircle2 size={20} style={{ color: '#3F7D5C' }} />}
        title="Nothing is late — no penalty"
      >
        <p>
          On the dates you gave, the return and the payment were both in on time. The deadline for
          that year was {result.deadlineLabel}.
        </p>
      </Panel>
    );
  }

  return (
    <Panel
      tone="warn"
      icon={<AlertTriangle size={20} style={{ color: '#C4622D' }} />}
      title={`${gbp(result.total)} in penalties`}
    >
      <p>
        The deadline was {result.deadlineLabel} and the return is {result.daysLateFiling.toLocaleString('en-GB')} days
        late. Penalties stack, so each band below is charged on top of the ones before it.
      </p>

      {result.filing.length > 0 && (
        <Section title="Late filing" total={result.filingTotal} lines={result.filing} />
      )}
      {result.payment.length > 0 && (
        <Section title="Late payment" total={result.paymentTotal} lines={result.payment} />
      )}

      <div
        className="flex items-baseline justify-between gap-4 rounded-xl px-4 py-3 mt-6"
        style={{ backgroundColor: '#F5E4D8', border: '1px solid #C4622D40' }}
      >
        <span className="text-sm font-semibold" style={{ color: '#1C1208' }}>Total penalties</span>
        <span className="text-lg font-bold" style={{ color: '#C4622D' }}>{gbp(result.total)}</span>
      </div>

      <p className="text-xs mt-4" style={{ color: '#9A8F83' }}>
        HMRC also charges interest on tax paid late, which is not included above — the rate tracks
        the Bank of England base rate and changes through the year, so we would rather send you to{' '}
        <a href={HMRC_PENALTIES_URL} rel="noopener nofollow" target="_blank" style={{ color: '#9A8F83', textDecoration: 'underline' }}>
          HMRC&apos;s current figures
        </a>{' '}
        than quote one that may be out of date. If you had a reasonable excuse — a serious illness or
        a bereavement, for instance — you can appeal a penalty rather than simply pay it.
      </p>

      {result.mtdCaveat && (
        <p className="text-xs mt-3" style={{ color: '#9A8F83' }}>
          Note for {taxYearLabel(result.deadline.getUTCFullYear() - 2)} onwards: if you are mandated
          into Making Tax Digital for Income Tax, quarterly updates fall under a separate
          points-based penalty system rather than the amounts above.{' '}
          <Link href="/mtd-deadline-checker" style={{ color: '#9A8F83', textDecoration: 'underline' }}>
            Check whether you are in MTD
          </Link>
          .
        </p>
      )}
    </Panel>
  );
}

function Section({ title, total, lines }: { title: string; total: number; lines: PenaltyLine[] }) {
  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <h3 className="text-sm font-semibold m-0" style={{ color: '#1C1208' }}>{title}</h3>
        <span className="text-sm font-semibold" style={{ color: '#4A4035' }}>{gbp(total)}</span>
      </div>
      <ul className="list-none p-0 m-0">
        {lines.map(line => (
          <li
            key={line.key}
            className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-4 py-3"
            style={{ borderBottom: '1px solid #F0EBE1' }}
          >
            <span className="text-sm font-medium sm:w-40 sm:flex-shrink-0" style={{ color: '#1C1208' }}>
              {line.label}
            </span>
            <span className="text-xs sm:text-sm sm:flex-1" style={{ color: '#9A8F83' }}>
              {line.basis}
            </span>
            <span className="text-sm font-semibold sm:text-right sm:flex-shrink-0" style={{ color: '#C4622D' }}>
              {gbp(line.amount)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Panel({
  tone,
  icon,
  title,
  children,
}: {
  tone: 'ok' | 'warn';
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5 sm:p-8 mt-6"
      style={{
        backgroundColor: '#FDFCF8',
        border: `1px solid ${tone === 'ok' ? '#3F7D5C40' : '#C4622D40'}`,
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
          Filing on time is the only way to avoid all of this. EasyTax files Self Assessment and MTD
          quarterly updates for £20 + VAT each, with no subscription. Our HMRC production access is
          still being approved, so we cannot take live submissions yet — join the list and we will
          tell you the day it opens.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/#notify"
            onClick={() => trackClient('tool_cta_click', { tool: TOOL, cta: 'notify' })}
            className="inline-flex items-center justify-center gap-2 px-6 rounded-full text-sm font-semibold"
            style={{ minHeight: 48, backgroundColor: '#1C1208', color: '#FDFCF8' }}
          >
            Tell me when filing opens
          </Link>
          <Link
            href="/payments-on-account-calculator"
            onClick={() => trackClient('tool_cta_click', { tool: TOOL, cta: 'poa' })}
            className="inline-flex items-center justify-center gap-2 px-6 rounded-full text-sm font-medium"
            style={{ minHeight: 48, border: '1px solid #DDD5C8', color: '#4A4035' }}
          >
            Work out next year&apos;s payments
          </Link>
        </div>
      </div>
    </div>
  );
}

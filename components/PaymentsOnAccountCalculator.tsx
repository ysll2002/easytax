'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Wallet, Info, ArrowRight } from 'lucide-react';
import { trackClient } from './PageViewTracker';
import {
  calculatePaymentsOnAccount,
  selectableTaxYears,
  taxYearLabel,
  POA_THRESHOLD,
  DEDUCTED_AT_SOURCE_LIMIT,
  type PoaResult,
} from '@/lib/payments-on-account';

// The first year someone owes more than £1,000 through Self Assessment, their
// January payment is 150% of the tax they were expecting. Nothing on the HMRC
// calculation tells them that in advance in plain money terms. This tool does.

const TOOL = 'payments_on_account';

function gbp(n: number): string {
  return `£${Math.abs(Math.round(n)).toLocaleString('en-GB')}`;
}

export default function PaymentsOnAccountCalculator() {
  const years = useMemo(() => selectableTaxYears(), []);
  const [taxYear, setTaxYear] = useState(years[0]);
  const [liability, setLiability] = useState('');
  const [deducted, setDeducted] = useState('');
  const [alreadyPaid, setAlreadyPaid] = useState('');
  const [result, setResult] = useState<PoaResult | null>(null);
  const started = useRef(false);

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    trackClient('tool_started', { tool: TOOL });
  };

  const num = (s: string): number | null => {
    if (!s.trim()) return 0;
    const n = Number(s.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  const parsedLiability = useMemo(() => {
    const n = Number(liability.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [liability]);

  const canSubmit =
    parsedLiability !== null && num(deducted) !== null && num(alreadyPaid) !== null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || parsedLiability === null) return;

    const r = calculatePaymentsOnAccount({
      taxYearStart: taxYear,
      liability: parsedLiability,
      deductedAtSource: num(deducted) ?? 0,
      poaAlreadyMade: num(alreadyPaid) ?? 0,
    });
    setResult(r);

    trackClient('tool_completed', {
      tool: TOOL,
      poa_required: r.poaRequired,
      exemption: r.exemptionReason ?? 'none',
      // Banded, never the figure itself.
      liability_band:
        parsedLiability < 1000 ? 'under_1k'
        : parsedLiability < 5000 ? '1k_5k'
        : parsedLiability < 15000 ? '5k_15k'
        : 'over_15k',
      tax_year: taxYear,
    });
  };

  const field = (
    id: string,
    label: string,
    hint: React.ReactNode,
    value: string,
    set: (v: string) => void,
    placeholder: string,
  ) => (
    <div className="mb-7">
      <label htmlFor={id} className="block text-sm font-semibold mb-1" style={{ color: '#1C1208' }}>
        {label}
      </label>
      <p className="text-xs mb-3" style={{ color: '#9A8F83' }}>{hint}</p>
      <div className="relative" style={{ maxWidth: 260 }}>
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#9A8F83' }}>£</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={e => { markStarted(); set(e.target.value); setResult(null); }}
          placeholder={placeholder}
          className="w-full rounded-xl pl-8 pr-4 text-sm outline-none"
          style={{ minHeight: 48, backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8', color: '#1C1208' }}
        />
      </div>
    </div>
  );

  return (
    <div>
      <form
        onSubmit={submit}
        className="rounded-2xl p-5 sm:p-8"
        style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' }}
      >
        <fieldset className="border-0 p-0 m-0 mb-7">
          <legend className="text-sm font-semibold mb-1 p-0" style={{ color: '#1C1208' }}>
            1. Which tax year is the bill for?
          </legend>
          <p className="text-xs mb-4" style={{ color: '#9A8F83' }}>
            The year your Self Assessment calculation covers.
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

        {field(
          'liability',
          '2. Tax owed through Self Assessment',
          <>Income Tax and Class 4 National Insurance for the year, <strong>before</strong> deducting
          anything you have already paid on account.</>,
          liability,
          setLiability,
          '6,000',
        )}

        {field(
          'deducted',
          '3. Tax already collected at source (optional)',
          <>PAYE, CIS deductions or tax taken off at source for the same year. If more than{' '}
          {Math.round(DEDUCTED_AT_SOURCE_LIMIT * 100)}% of your tax was collected this way, no
          payments on account are due.</>,
          deducted,
          setDeducted,
          '0',
        )}

        {field(
          'already-paid',
          '4. Payments on account already made (optional)',
          <>What you paid towards this year in the two instalments last January and July. Leave at 0
          if this is your first Self Assessment year.</>,
          alreadyPaid,
          setAlreadyPaid,
          '0',
        )}

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
          Show my payment schedule <ArrowRight size={16} />
        </button>
      </form>

      {result && <Result result={result} />}
    </div>
  );
}

function Result({ result }: { result: PoaResult }) {
  const nextYear = taxYearLabel(result.taxYearStart + 1);

  return (
    <div
      className="rounded-2xl p-5 sm:p-8 mt-6"
      style={{ backgroundColor: '#FDFCF8', border: '1px solid #C4622D40' }}
      aria-live="polite"
    >
      <div className="flex items-start gap-3 mb-4">
        <span style={{ flexShrink: 0, marginTop: 2 }}>
          <Wallet size={20} style={{ color: '#C4622D' }} />
        </span>
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
          {gbp(result.dueNextJanuary)} due on {result.schedule[0].dueLabel}
        </h2>
      </div>

      <div className="text-sm leading-relaxed space-y-3" style={{ color: '#4A4035' }}>
        {result.poaRequired ? (
          <p>
            Your {result.taxYearLabel} bill is {gbp(result.totalLiability)}, but that is not what
            leaves your account in January. Because you owe more than £
            {POA_THRESHOLD.toLocaleString('en-GB')} through Self Assessment, HMRC also takes the
            first of two payments on account towards {nextYear} on the same day — so you pay{' '}
            <strong>{gbp(result.dueNextJanuary)}</strong>, not {gbp(result.balancingPayment)}.
          </p>
        ) : result.exemptionReason === 'under_threshold' ? (
          <p>
            Your {result.taxYearLabel} bill of {gbp(result.totalLiability)} is below the £
            {POA_THRESHOLD.toLocaleString('en-GB')} threshold, so no payments on account are due.
            You pay the bill in one go and nothing in July.
          </p>
        ) : (
          <p>
            More than {Math.round(DEDUCTED_AT_SOURCE_LIMIT * 100)}% of your tax for{' '}
            {result.taxYearLabel} was already collected at source, so no payments on account are
            due even though the bill is over £{POA_THRESHOLD.toLocaleString('en-GB')}. You pay the
            balance in one go and nothing in July.
          </p>
        )}
      </div>

      <h3 className="text-sm font-semibold mt-6 mb-3" style={{ color: '#1C1208' }}>
        Your payment schedule
      </h3>
      <ul className="list-none p-0 m-0">
        {result.schedule.map(row => (
          <li
            key={row.key}
            className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-4 py-3"
            style={{ borderBottom: '1px solid #F0EBE1' }}
          >
            <span className="text-sm font-medium sm:w-48 sm:flex-shrink-0" style={{ color: '#1C1208' }}>
              {row.label}
              <span className="block text-xs font-normal" style={{ color: '#9A8F83' }}>
                {row.dueLabel}
              </span>
            </span>
            <span className="text-xs sm:text-sm sm:flex-1" style={{ color: '#9A8F83' }}>
              {row.note}
            </span>
            <span className="text-sm font-semibold sm:text-right sm:flex-shrink-0" style={{ color: '#C4622D' }}>
              {row.amount < 0 ? `−${gbp(row.amount)}` : gbp(row.amount)}
            </span>
          </li>
        ))}
      </ul>

      {result.poaRequired && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3 mt-5"
          style={{ backgroundColor: '#F5E4D8', border: '1px solid #C4622D40' }}
        >
          <Info size={18} style={{ color: '#C4622D', flexShrink: 0, marginTop: 2 }} />
          <p className="text-sm m-0" style={{ color: '#1C1208' }}>
            Payments on account are an <strong>estimate</strong> based on this year. If you expect
            {' '}{nextYear} to be a worse year, you can apply to HMRC to reduce them — but if you
            reduce them too far, HMRC charges interest on the shortfall.
          </p>
        </div>
      )}

      <div className="mt-7 pt-6" style={{ borderTop: '1px solid #F0EBE1' }}>
        <p className="text-sm mb-4" style={{ color: '#4A4035' }}>
          EasyTax works your liability out from your bank transactions and files it for £20 + VAT,
          with no subscription. Our HMRC production access is still being approved, so we cannot take
          live submissions yet — join the list and we will tell you the day it opens.
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
            href="/self-assessment-penalty-calculator"
            onClick={() => trackClient('tool_cta_click', { tool: TOOL, cta: 'penalty' })}
            className="inline-flex items-center justify-center gap-2 px-6 rounded-full text-sm font-medium"
            style={{ minHeight: 48, border: '1px solid #DDD5C8', color: '#4A4035' }}
          >
            What if I miss the deadline?
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, TrendingDown, CheckCircle2, ChevronRight, Info } from 'lucide-react';

const EXPENSE_FIELDS = [
  { key: 'costOfGoods',          label: 'Cost of goods / materials',    hint: 'Stock, raw materials, direct costs' },
  { key: 'staffCosts',           label: 'Staff costs',                   hint: 'Wages, salaries, subcontractor fees' },
  { key: 'travelCosts',          label: 'Travel & subsistence',          hint: 'Business travel, fuel, accommodation' },
  { key: 'premisesRunningCosts', label: 'Premises & running costs',      hint: 'Rent, utilities, insurance' },
  { key: 'adminCosts',           label: 'Admin & office costs',          hint: 'Stationery, phone, postage' },
  { key: 'advertisingCosts',     label: 'Advertising & marketing',       hint: 'Website, ads, social media' },
  { key: 'professionalFees',     label: 'Professional fees',             hint: 'Accountant, legal, consultant fees' },
  { key: 'otherExpenses',        label: 'Other allowable expenses',      hint: 'Any other deductible costs' },
];

function currentTaxYear() {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${String(year + 1).slice(2)}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function QuarterForm() {
  const params  = useSearchParams();
  const router  = useRouter();
  void router;
  const start   = params.get('start') ?? '';
  const end     = params.get('end')   ?? '';
  // Allow overriding via ?taxYear=2025-26 — useful for HMRC sandbox testing
  // because the sandbox test data is typically populated for the previous
  // tax year, not the current one.
  const taxYear = params.get('taxYear') ?? currentTaxYear();

  const [turnover,   setTurnover]   = useState('');
  const [expenses,   setExpenses]   = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState('');
  const [hinted,     setHinted]     = useState<string | null>(null);

  const totalExpenses = EXPENSE_FIELDS.reduce((sum, f) => sum + parseFloat(expenses[f.key] || '0'), 0);
  const income        = parseFloat(turnover || '0');
  const profit        = income - totalExpenses;
  const estTax        = Math.max(0, Math.max(0, profit - 12570) * 0.2 + Math.max(0, profit - 12570) * 0.09);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const expObj: Record<string, number> = {};
    for (const f of EXPENSE_FIELDS) expObj[f.key] = parseFloat(expenses[f.key] || '0');

    try {
      const res = await fetch('/api/hmrc/submit-quarter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxYear, periodStartDate: start, periodEndDate: end, turnover: income, expenses: expObj }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setSubmitted(true);
    } catch {
      setError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="p-4 sm:p-8 max-w-lg">
        <div className="flex flex-col items-center text-center py-12">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#F0EBE1' }}>
            <CheckCircle2 size={36} color="#C4622D" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
            Update Submitted
          </h1>
          <p className="text-sm mb-2" style={{ color: '#9A8F83' }}>
            {start && end ? `${fmtDate(start)} – ${fmtDate(end)}` : taxYear}
          </p>
          <p className="text-sm mb-8" style={{ color: '#4A4035' }}>
            Your quarterly update has been sent to HMRC successfully.
          </p>
          <Link href="/dashboard/tax/tasks"
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full font-semibold text-sm"
            style={{ backgroundColor: '#1C1208', color: '#FDFCF8', textDecoration: 'none' }}>
            Back to Filing Overview <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <Link href="/dashboard/tax/tasks" className="text-sm mb-6 inline-block" style={{ color: '#9A8F83', textDecoration: 'none' }}>
        ← Back to Filing Overview
      </Link>

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3" style={{ backgroundColor: '#F0EBE1', color: '#C4622D', border: '1px solid #C4622D30' }}>
          Quarterly Update · {taxYear}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208' }}>
          {start ? fmtDate(start) : 'Quarterly Update'}
        </h1>
        {start && end && <p className="text-sm mt-1" style={{ color: '#9A8F83' }}>to {fmtDate(end)}</p>}
      </div>

      {error && (
        <div className="p-4 rounded-xl mb-6 text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

          {/* Left: form */}
          <div className="flex-1 space-y-6">
            <div className="p-6 rounded-2xl" style={{ border: '1.5px solid #E8E2DA', backgroundColor: '#FDFCF8' }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} color="#6B8E6E" />
                <h2 className="font-bold text-sm" style={{ color: '#1C1208' }}>Income</h2>
              </div>
              <label className="block">
                <span className="text-sm block mb-1.5" style={{ color: '#4A4035' }}>Turnover for this quarter</span>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold" style={{ color: '#9A8F83' }}>£</span>
                  <input
                    type="number" min="0" step="0.01" required
                    value={turnover} onChange={e => setTurnover(e.target.value)} placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3.5 rounded-xl text-base font-semibold"
                    style={{ border: '1.5px solid #DDD5C8', backgroundColor: '#FFFFFF', outline: 'none', color: '#1C1208' }}
                  />
                </div>
                <p className="text-xs mt-1.5" style={{ color: '#9A8F83' }}>Total income received in this period, before expenses.</p>
              </label>
            </div>

            <div className="p-6 rounded-2xl" style={{ border: '1.5px solid #E8E2DA', backgroundColor: '#FDFCF8' }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown size={18} color="#C4622D" />
                <h2 className="font-bold text-sm" style={{ color: '#1C1208' }}>Allowable Expenses</h2>
              </div>
              <div className="space-y-3">
                {EXPENSE_FIELDS.map(f => (
                  <div key={f.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm" style={{ color: '#4A4035' }}>{f.label}</span>
                      <button type="button" onMouseEnter={() => setHinted(f.key)} onMouseLeave={() => setHinted(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9A8F83' }}>
                        <Info size={13} />
                      </button>
                    </div>
                    {hinted === f.key && (
                      <p className="text-xs px-2 py-1 rounded-lg mb-1" style={{ backgroundColor: '#F0EBE1', color: '#4A4035' }}>{f.hint}</p>
                    )}
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#9A8F83' }}>£</span>
                      <input
                        type="number" min="0" step="0.01"
                        value={expenses[f.key] ?? ''} onChange={e => setExpenses(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl text-sm"
                        style={{ border: '1px solid #DDD5C8', backgroundColor: '#FFFFFF', outline: 'none', color: '#1C1208' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold"
              style={{ backgroundColor: '#C4622D', color: '#FDFCF8', opacity: submitting ? 0.7 : 1, cursor: submitting ? 'wait' : 'pointer', border: 'none', fontSize: '0.95rem' }}>
              {submitting
                ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Submitting to HMRC…</>
                : <>Submit Quarterly Update <ChevronRight size={16} /></>}
            </button>
          </div>

          {/* Right: live summary */}
          <div className="w-full lg:w-72 lg:flex-shrink-0 lg:sticky lg:top-8">
            <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid #DDD5C8' }}>
              <div className="px-5 py-4" style={{ backgroundColor: '#1C1208' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#9A8F83' }}>LIVE SUMMARY</p>
                <p className="text-xs" style={{ color: '#4A4035' }}>
                  {start && end
                    ? `${new Date(start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : taxYear}
                </p>
              </div>
              <div className="p-5 space-y-3" style={{ backgroundColor: '#FDFCF8' }}>
                <div className="flex justify-between text-sm"><span style={{ color: '#9A8F83' }}>Turnover</span><span style={{ fontWeight: 600, color: '#6B8E6E' }}>+£{income.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: '#9A8F83' }}>Total expenses</span><span style={{ fontWeight: 600, color: '#C4622D' }}>−£{totalExpenses.toFixed(2)}</span></div>
                <div style={{ borderTop: '1px solid #E8E2DA', paddingTop: '0.75rem' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold" style={{ color: '#1C1208' }}>Net profit</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: profit >= 0 ? '#6B8E6E' : '#EF4444' }}>£{profit.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4" style={{ backgroundColor: '#F0EBE1', borderTop: '1px solid #E8E2DA' }}>
                <p className="text-xs mb-1" style={{ color: '#9A8F83' }}>Estimated tax on this quarter</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#C4622D' }}>£{estTax.toFixed(2)}</p>
                <p className="text-xs mt-1" style={{ color: '#9A8F83' }}>Indicative only — final bill calculated at year end.</p>
              </div>
              {EXPENSE_FIELDS.some(f => parseFloat(expenses[f.key] || '0') > 0) && (
                <div className="px-5 py-4" style={{ backgroundColor: '#F8F7F5', borderTop: '1px solid #E8E2DA' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#1C1208' }}>Expense breakdown</p>
                  {EXPENSE_FIELDS.filter(f => parseFloat(expenses[f.key] || '0') > 0).map(f => (
                    <div key={f.key} className="flex justify-between text-xs mb-1" style={{ color: '#4A4035' }}>
                      <span style={{ maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.label}</span>
                      <span>£{parseFloat(expenses[f.key]).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function QuarterPage() {
  return <Suspense><QuarterForm /></Suspense>;
}

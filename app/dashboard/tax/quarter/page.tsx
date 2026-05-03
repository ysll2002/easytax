'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const EXPENSE_FIELDS: { key: string; label: string }[] = [
  { key: 'costOfGoods',          label: 'Cost of goods / materials' },
  { key: 'staffCosts',           label: 'Staff costs' },
  { key: 'travelCosts',          label: 'Travel and subsistence' },
  { key: 'premisesRunningCosts', label: 'Premises and running costs' },
  { key: 'adminCosts',           label: 'Admin and office costs' },
  { key: 'advertisingCosts',     label: 'Advertising and marketing' },
  { key: 'professionalFees',     label: 'Professional fees (accountant etc.)' },
  { key: 'otherExpenses',        label: 'Other allowable expenses' },
];

function currentTaxYear() {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${String(year + 1).slice(2)}`;
}

function QuarterForm() {
  const params   = useSearchParams();
  const router   = useRouter();
  const start    = params.get('start') ?? '';
  const end      = params.get('end')   ?? '';
  const taxYear  = currentTaxYear();

  const [turnover,  setTurnover]  = useState('');
  const [expenses,  setExpenses]  = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error,     setError]     = useState('');

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const totalExpenses = EXPENSE_FIELDS.reduce((sum, f) => sum + parseFloat(expenses[f.key] || '0'), 0);
  const profit = parseFloat(turnover || '0') - totalExpenses;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const expObj: Record<string, number> = {};
    for (const f of EXPENSE_FIELDS) {
      expObj[f.key] = parseFloat(expenses[f.key] || '0');
    }

    try {
      const res = await fetch('/api/hmrc/submit-quarter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxYear,
          periodStartDate: start,
          periodEndDate:   end,
          turnover: parseFloat(turnover),
          expenses: expObj,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      router.push('/dashboard/tax/tasks?submitted=1');
    } catch {
      setError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/dashboard/tax/tasks" className="text-sm mb-6 inline-block" style={{ color: '#9A8F83' }}>← Back</Link>

      <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
        Quarterly Update
      </h1>
      <p className="text-sm mb-6" style={{ color: '#9A8F83' }}>
        {start && end ? `${fmtDate(start)} – ${fmtDate(end)}` : taxYear}
      </p>

      {error && (
        <div className="p-4 rounded-xl mb-5 text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Income */}
        <section>
          <h2 className="font-semibold mb-3" style={{ color: '#1C1208' }}>Income</h2>
          <label className="block">
            <span className="text-sm block mb-1" style={{ color: '#4A4035' }}>Turnover (£)</span>
            <input
              type="number" min="0" step="0.01" required
              value={turnover}
              onChange={e => setTurnover(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{ border: '1px solid #DDD5C8', backgroundColor: '#FDFCF8', outline: 'none', color: '#1C1208' }}
            />
          </label>
        </section>

        {/* Expenses */}
        <section>
          <h2 className="font-semibold mb-3" style={{ color: '#1C1208' }}>Expenses</h2>
          <div className="space-y-3">
            {EXPENSE_FIELDS.map(f => (
              <label key={f.key} className="flex items-center justify-between gap-4">
                <span className="text-sm flex-1" style={{ color: '#4A4035' }}>{f.label}</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#9A8F83' }}>£</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={expenses[f.key] ?? ''}
                    onChange={e => setExpenses(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder="0.00"
                    className="w-36 pl-7 pr-3 py-2.5 rounded-xl text-sm"
                    style={{ border: '1px solid #DDD5C8', backgroundColor: '#FDFCF8', outline: 'none', color: '#1C1208' }}
                  />
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Summary */}
        <div className="p-5 rounded-2xl space-y-2 text-sm" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
          <div className="flex justify-between" style={{ color: '#4A4035' }}>
            <span>Turnover</span><span>£{parseFloat(turnover || '0').toFixed(2)}</span>
          </div>
          <div className="flex justify-between" style={{ color: '#4A4035' }}>
            <span>Total expenses</span><span>−£{totalExpenses.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold pt-2" style={{ color: '#1C1208', borderTop: '1px solid #DDD5C8' }}>
            <span>Net profit</span>
            <span style={{ color: profit >= 0 ? '#6B8E6E' : '#C4622D' }}>£{profit.toFixed(2)}</span>
          </div>
        </div>

        <button type="submit" disabled={submitting}
          className="w-full py-3.5 rounded-xl font-medium text-sm"
          style={{ backgroundColor: '#C4622D', color: '#FDFCF8', opacity: submitting ? 0.6 : 1, cursor: submitting ? 'wait' : 'pointer' }}>
          {submitting ? 'Submitting to HMRC…' : 'Submit Quarterly Update →'}
        </button>
      </form>
    </div>
  );
}

export default function QuarterPage() {
  return (
    <Suspense>
      <QuarterForm />
    </Suspense>
  );
}

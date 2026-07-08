'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Calculator, ChevronRight } from 'lucide-react';

function currentTaxYear() {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${String(year + 1).slice(2)}`;
}

type Calc = {
  id:        string;
  incomeTax: number | undefined;
  class4Nic: number | undefined;
  totalDue:  number | undefined;
};

export default function CalculatePage() {
  const [taxYear, setTaxYear] = useState(currentTaxYear());
  const [calc,    setCalc]    = useState<Calc | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleCalculate() {
    setError(''); setCalc(null); setLoading(true);
    try {
      const r = await fetch('/api/hmrc/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxYear }),
      });
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      // The Trigger endpoint returns a calculationId; poll Retrieve up to a few
      // times because HMRC computes asynchronously.
      for (let i = 0; i < 8; i++) {
        await new Promise(res => setTimeout(res, 1800));
        const r2 = await fetch(`/api/hmrc/calculate?taxYear=${taxYear}&calculationId=${d.calculationId}`);
        const d2 = await r2.json();
        if (d2.calculation) {
          const c = d2.calculation.taxCalculation;
          setCalc({
            id:        d.calculationId,
            incomeTax: c?.incomeTax?.totalIncomeTaxDue,
            class4Nic: c?.nics?.class4Nics?.totalAmount,
            totalDue:  c?.totalIncomeTaxAndNicsDue,
          });
          return;
        }
      }
      setError('Calculation is still running — try again in a moment.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger calculation.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <Link href="/dashboard/individual" className="text-sm mb-6 inline-block" style={{ color: '#9A8F83', textDecoration: 'none' }}>
        ← Back to Self Assessment
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <Calculator size={24} color="#C4622D" />
        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208' }}>
          Tax Calculation
        </h1>
      </div>
      <p className="text-sm mb-8" style={{ color: '#9A8F83' }}>
        Request an in-year tax calculation from HMRC based on the data you&apos;ve submitted for {taxYear}.
      </p>

      <div className="p-6 rounded-2xl mb-6" style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' }}>
        <div className="flex items-center gap-3 mb-5">
          <label className="text-sm font-medium" style={{ color: '#4A4035' }}>Tax year</label>
          <input
            type="text" value={taxYear} onChange={e => setTaxYear(e.target.value)}
            style={{ border: '1px solid #DDD5C8', backgroundColor: '#FDFCF8', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', width: '7rem' }}
          />
        </div>
        <button onClick={handleCalculate} disabled={loading}
          className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full"
          style={{ backgroundColor: '#1C1208', color: '#FDFCF8', opacity: loading ? 0.6 : 1, cursor: loading ? 'wait' : 'pointer', border: 'none' }}>
          {loading
            ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />Calculating…</>
            : <>Calculate My Tax <ChevronRight size={16} /></>}
        </button>
        {error && (
          <div className="mt-4 p-3 rounded-xl text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>{error}</div>
        )}
      </div>

      {calc && (
        <div className="p-6 rounded-2xl mb-6" style={{ backgroundColor: '#F5EDDC', border: '1px solid #E5CFA8' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8B6F1F' }}>Result — {taxYear}</p>
          {[
            { label: 'Income Tax', value: calc.incomeTax },
            { label: 'Class 4 NIC', value: calc.class4Nic },
          ].filter(r => r.value !== undefined).map(r => (
            <div key={r.label} className="flex justify-between text-sm mb-2" style={{ color: '#4A4035' }}>
              <span>{r.label}</span>
              <span className="font-semibold">£{r.value!.toFixed(2)}</span>
            </div>
          ))}
          {calc.totalDue !== undefined && (
            <div className="flex justify-between text-sm font-bold pt-2 mt-1" style={{ color: '#1C1208', borderTop: '1px solid #E5CFA8' }}>
              <span>Total Due</span>
              <span style={{ color: '#C4622D', fontSize: '1.15rem' }}>£{calc.totalDue.toFixed(2)}</span>
            </div>
          )}
          {/* HMRC MTD-ITSA production requirement (Software Approvals checklist,
              General #14a): in-year calculations must be displayed with the
              accuracy disclaimer. Wording matches the checklist example. */}
          <p className="text-xs mt-4 leading-relaxed pt-3" style={{ color: '#4A4035', borderTop: '1px solid #E5CFA8' }}>
            This calculation is only based on information HMRC have received about your income and expenses to {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}. This may change as we receive further information about you during the tax year.
          </p>
        </div>
      )}

      <div className="text-xs" style={{ color: '#9A8F83', lineHeight: 1.55 }}>
        <p>
          This calculation reflects the current view HMRC has of your Self Assessment. It is an estimate — you can request an updated calculation any time before the final declaration deadline.
        </p>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { type Obligation } from '@/lib/hmrc';

type CalcState = { id: string | null; incomeTax?: number; class4Nic?: number; totalDue?: number };

function currentTaxYear() {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${String(year + 1).slice(2)}`;
}

function quarterLabel(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${fmt(s)} – ${fmt(e)}`;
}

export default function TasksPage() {
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [calc, setCalc]               = useState<CalcState>({ id: null });
  const [calcLoading, setCalcLoading] = useState(false);
  const [declaring, setDeclaring]     = useState(false);
  const [declared, setDeclared]       = useState(false);

  const taxYear = currentTaxYear();

  useEffect(() => {
    fetch('/api/hmrc/obligations')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setObligations(d.obligations ?? []);
      })
      .catch(() => setError('Could not reach HMRC'))
      .finally(() => setLoading(false));
  }, []);

  const quarterlyObs = obligations.filter(o => o.periodKey !== '#001');
  const finalObs     = obligations.find(o => o.periodKey === '#001');
  const allFulfilled = quarterlyObs.length > 0 && quarterlyObs.every(o => o.status === 'Fulfilled');

  async function handleCalculate() {
    setCalcLoading(true);
    try {
      const r = await fetch('/api/hmrc/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxYear }),
      });
      const d = await r.json();
      if (d.error) { setError(d.error); return; }

      // Poll for result
      for (let i = 0; i < 6; i++) {
        await new Promise(res => setTimeout(res, 2000));
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
          break;
        }
      }
    } finally {
      setCalcLoading(false);
    }
  }

  async function handleFinalDeclaration() {
    if (!confirm('This will submit your final Self Assessment to HMRC. Are you sure?')) return;
    setDeclaring(true);
    try {
      const r = await fetch('/api/hmrc/final-declaration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxYear }),
      });
      const d = await r.json();
      if (d.error) setError(d.error);
      else setDeclared(true);
    } finally {
      setDeclaring(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-3xl">
        <div style={{ color: '#9A8F83', fontSize: '0.9rem' }}>Loading HMRC obligations…</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/dashboard/tax" className="text-sm mb-6 inline-block" style={{ color: '#9A8F83' }}>← Back</Link>

      <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
        Tax Filing {taxYear}
      </h1>
      <p style={{ color: '#9A8F83', marginBottom: '2.5rem' }}>Making Tax Digital — quarterly updates + final declaration.</p>

      {error && (
        <div className="p-4 rounded-xl mb-6 text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
          {error}
        </div>
      )}

      {/* Quarterly Updates */}
      <section className="mb-8">
        <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.2rem', fontWeight: 700, color: '#1C1208', marginBottom: '1rem' }}>
          Quarterly Updates
        </h2>

        {quarterlyObs.length === 0 ? (
          <p style={{ color: '#9A8F83', fontSize: '0.9rem' }}>No quarterly obligations found for this tax year.</p>
        ) : (
          <div className="space-y-3">
            {quarterlyObs.map((ob) => {
              const done = ob.status === 'Fulfilled';
              const overdue = !done && new Date(ob.dueDate) < new Date();
              return (
                <div key={ob.periodKey} className="flex items-center justify-between p-5 rounded-2xl"
                  style={{ backgroundColor: done ? '#F0EBE1' : '#FDFCF8', border: `1px solid ${done ? '#C4622D40' : '#DDD5C8'}`, borderLeft: `4px solid ${done ? '#C4622D' : overdue ? '#EF4444' : '#DDD5C8'}` }}>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#1C1208' }}>
                      {quarterLabel(ob.periodStartDate, ob.periodEndDate)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#9A8F83' }}>
                      Due {new Date(ob.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: done ? '#F5E4D8' : overdue ? '#FEE2E2' : '#F0F0EB', color: done ? '#C4622D' : overdue ? '#991B1B' : '#9A8F83' }}>
                      {done ? 'Submitted' : overdue ? 'Overdue' : 'Open'}
                    </span>
                    {!done && (
                      <Link href={`/dashboard/tax/quarter?start=${ob.periodStartDate}&end=${ob.periodEndDate}&key=${ob.periodKey}`}
                        className="text-xs font-medium px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: '#1C1208', color: '#FDFCF8', textDecoration: 'none' }}>
                        Submit →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Tax Estimate */}
      {allFulfilled && (
        <section className="mb-8 p-6 rounded-2xl" style={{ border: '1px solid #DDD5C8', backgroundColor: '#FDFCF8' }}>
          <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.2rem', fontWeight: 700, color: '#1C1208', marginBottom: '1rem' }}>
            Tax Estimate
          </h2>

          {calc.id ? (
            <div className="space-y-2 text-sm">
              {calc.incomeTax !== undefined && (
                <div className="flex justify-between" style={{ color: '#4A4035' }}>
                  <span>Income Tax</span>
                  <span className="font-semibold">£{calc.incomeTax.toFixed(2)}</span>
                </div>
              )}
              {calc.class4Nic !== undefined && (
                <div className="flex justify-between" style={{ color: '#4A4035' }}>
                  <span>Class 4 NIC (6%)</span>
                  <span className="font-semibold">£{calc.class4Nic.toFixed(2)}</span>
                </div>
              )}
              {calc.totalDue !== undefined && (
                <div className="flex justify-between pt-2 border-t" style={{ color: '#1C1208', borderColor: '#DDD5C8' }}>
                  <span className="font-bold">Total Due</span>
                  <span className="font-bold text-lg" style={{ color: '#C4622D' }}>£{calc.totalDue.toFixed(2)}</span>
                </div>
              )}
            </div>
          ) : (
            <button onClick={handleCalculate} disabled={calcLoading}
              className="text-sm font-medium px-5 py-2.5 rounded-full"
              style={{ backgroundColor: '#1C1208', color: '#FDFCF8', opacity: calcLoading ? 0.6 : 1, cursor: calcLoading ? 'wait' : 'pointer' }}>
              {calcLoading ? 'Calculating…' : 'Calculate My Tax'}
            </button>
          )}
        </section>
      )}

      {/* Final Declaration */}
      {allFulfilled && (
        <section className="p-6 rounded-2xl" style={{ border: '1px solid #C4622D40', backgroundColor: '#FFF9F5' }}>
          <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
            Final Declaration
          </h2>
          <p className="text-sm mb-4" style={{ color: '#9A8F83' }}>
            Confirm your full-year figures and submit your Self Assessment to HMRC.
            {finalObs && ` Due: ${new Date(finalObs.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`}
          </p>

          {declared ? (
            <div className="text-sm font-semibold" style={{ color: '#6B8E6E' }}>
              ✓ Final Declaration submitted successfully
            </div>
          ) : (
            <button onClick={handleFinalDeclaration} disabled={declaring || !calc.id}
              className="text-sm font-medium px-6 py-3 rounded-full"
              style={{ backgroundColor: '#C4622D', color: '#FDFCF8', opacity: (declaring || !calc.id) ? 0.5 : 1, cursor: (declaring || !calc.id) ? 'not-allowed' : 'pointer' }}>
              {declaring ? 'Submitting…' : 'Submit Final Declaration →'}
            </button>
          )}
          {!calc.id && (
            <p className="text-xs mt-2" style={{ color: '#9A8F83' }}>Calculate your tax estimate first.</p>
          )}
        </section>
      )}
    </div>
  );
}

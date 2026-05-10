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
  const [obligations,    setObligations]    = useState<Obligation[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [calc,           setCalc]           = useState<CalcState>({ id: null });
  const [calcLoading,    setCalcLoading]    = useState(false);
  const [declaring,      setDeclaring]      = useState(false);
  const [declared,       setDeclared]       = useState(false);
  const [adjSubmitted,   setAdjSubmitted]   = useState(false);

  const taxYear = currentTaxYear();

  useEffect(() => {
    // Check for adjustments=done in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('adjustments') === 'done') setAdjSubmitted(true);

    Promise.all([
      fetch('/api/hmrc/obligations').then(r => r.json()),
      fetch('/api/hmrc/adjustments').then(r => r.json()),
    ]).then(([obs, adj]) => {
      if (obs.error) setError(obs.error);
      else setObligations(obs.obligations ?? []);
      if (adj.submitted) setAdjSubmitted(true);
    }).catch(() => setError('Could not reach HMRC')).finally(() => setLoading(false));
  }, []);

  const quarterlyObs = obligations.filter(o => o.periodKey !== '#001');
  const finalObs     = obligations.find(o => o.periodKey === '#001');
  const allFulfilled = quarterlyObs.length > 0 && quarterlyObs.every(o => o.status === 'Fulfilled');

  // Payment deadline: 31 Jan of the year after the tax year ends
  const taxYearEnd    = parseInt(taxYear.slice(0, 4)) + 1;
  const payDeadline   = `31 January ${taxYearEnd + 1}`;
  const balancingDate = `31 July ${taxYearEnd + 1}`;

  async function handleCalculate() {
    setCalcLoading(true);
    setError('');
    try {
      const r = await fetch('/api/hmrc/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxYear }),
      });
      const d = await r.json();
      if (d.error) { setError(d.error); return; }

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
    return <div className="p-8"><p style={{ color: '#9A8F83', fontSize: '0.9rem' }}>Loading HMRC obligations…</p></div>;
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/dashboard/tax" className="text-sm mb-6 inline-block" style={{ color: '#9A8F83' }}>← Back</Link>

      <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
        Tax Filing {taxYear}
      </h1>
      <p style={{ color: '#9A8F83', marginBottom: '2.5rem' }}>Making Tax Digital — quarterly updates, adjustments, and final declaration.</p>

      {error && (
        <div className="p-4 rounded-xl mb-6 text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>{error}</div>
      )}

      {/* ── Step 1: Quarterly Updates ── */}
      <section className="mb-8">
        <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.2rem', fontWeight: 700, color: '#1C1208', marginBottom: '1rem' }}>
          Step 1 — Quarterly Updates
        </h2>
        {quarterlyObs.length === 0 ? (
          <p style={{ color: '#9A8F83', fontSize: '0.9rem' }}>No quarterly obligations found for this tax year.</p>
        ) : (
          <div className="space-y-3">
            {quarterlyObs.map(ob => {
              const done    = ob.status === 'Fulfilled';
              const overdue = !done && new Date(ob.dueDate) < new Date();
              return (
                <div key={ob.periodKey} className="flex items-center justify-between p-5 rounded-2xl"
                  style={{ backgroundColor: done ? '#F0EBE1' : '#FDFCF8', border: `1px solid ${done ? '#C4622D40' : '#DDD5C8'}`, borderLeft: `4px solid ${done ? '#C4622D' : overdue ? '#EF4444' : '#DDD5C8'}` }}>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#1C1208' }}>{quarterLabel(ob.periodStartDate, ob.periodEndDate)}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9A8F83' }}>Due {new Date(ob.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
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

      {/* ── Step 2: Annual Adjustments ── */}
      {allFulfilled && (
        <section className="mb-8 p-6 rounded-2xl" style={{ border: `1px solid ${adjSubmitted ? '#C4622D40' : '#DDD5C8'}`, backgroundColor: adjSubmitted ? '#F0EBE1' : '#FDFCF8', borderLeft: `4px solid ${adjSubmitted ? '#C4622D' : '#DDD5C8'}` }}>
          <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
            Step 2 — Annual Adjustments
          </h2>
          <p className="text-sm mb-4" style={{ color: '#9A8F83' }}>
            Declare other income (savings interest, dividends), claim reliefs (overlap, Gift Aid), and submit year-end business adjustments.
          </p>
          {adjSubmitted ? (
            <p className="text-sm font-semibold" style={{ color: '#C4622D' }}>✓ Adjustments submitted</p>
          ) : (
            <Link href="/dashboard/tax/adjustments"
              className="inline-block text-sm font-medium px-5 py-2.5 rounded-full"
              style={{ backgroundColor: '#1C1208', color: '#FDFCF8', textDecoration: 'none' }}>
              Review &amp; Submit Adjustments →
            </Link>
          )}
        </section>
      )}

      {/* ── Step 3: Tax Estimate ── */}
      {allFulfilled && adjSubmitted && (
        <section className="mb-8 p-6 rounded-2xl" style={{ border: `1px solid ${calc.id ? '#C4622D40' : '#DDD5C8'}`, backgroundColor: '#FDFCF8' }}>
          <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.2rem', fontWeight: 700, color: '#1C1208', marginBottom: '1rem' }}>
            Step 3 — Tax Estimate
          </h2>
          {calc.id ? (
            <div className="space-y-2 text-sm">
              {calc.incomeTax !== undefined && (
                <div className="flex justify-between" style={{ color: '#4A4035' }}>
                  <span>Income Tax</span><span className="font-semibold">£{calc.incomeTax.toFixed(2)}</span>
                </div>
              )}
              {calc.class4Nic !== undefined && (
                <div className="flex justify-between" style={{ color: '#4A4035' }}>
                  <span>Class 4 NIC</span><span className="font-semibold">£{calc.class4Nic.toFixed(2)}</span>
                </div>
              )}
              {calc.totalDue !== undefined && (
                <div className="flex justify-between pt-2 font-bold" style={{ color: '#1C1208', borderTop: '1px solid #DDD5C8' }}>
                  <span>Total Due</span>
                  <span style={{ color: '#C4622D', fontSize: '1.1rem' }}>£{calc.totalDue.toFixed(2)}</span>
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

      {/* ── Step 4: Final Declaration ── */}
      {allFulfilled && adjSubmitted && (
        <section className="mb-8 p-6 rounded-2xl" style={{ border: '1px solid #C4622D40', backgroundColor: '#FFF9F5' }}>
          <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
            Step 4 — Final Declaration
          </h2>
          <p className="text-sm mb-4" style={{ color: '#9A8F83' }}>
            Confirm all figures are complete and correct, then submit your Self Assessment to HMRC.
            {finalObs && ` Due: ${new Date(finalObs.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`}
          </p>
          {declared ? (
            <p className="text-sm font-semibold" style={{ color: '#6B8E6E' }}>✓ Final Declaration submitted successfully</p>
          ) : (
            <>
              <button onClick={handleFinalDeclaration} disabled={declaring || !calc.id}
                className="text-sm font-medium px-6 py-3 rounded-full"
                style={{ backgroundColor: '#C4622D', color: '#FDFCF8', opacity: (declaring || !calc.id) ? 0.5 : 1, cursor: (declaring || !calc.id) ? 'not-allowed' : 'pointer' }}>
                {declaring ? 'Submitting…' : 'Submit Final Declaration →'}
              </button>
              {!calc.id && <p className="text-xs mt-2" style={{ color: '#9A8F83' }}>Complete Step 3 first.</p>}
            </>
          )}
        </section>
      )}

      {/* ── Step 5: Payment ── */}
      {declared && (
        <section className="p-6 rounded-2xl" style={{ border: '1px solid #6B8E6E40', backgroundColor: '#F0F5F0' }}>
          <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
            Step 5 — Pay Your Tax
          </h2>
          <p className="text-sm mb-5" style={{ color: '#4A4035' }}>
            Your Self Assessment has been submitted. You now need to pay what you owe directly to HMRC.
          </p>

          <div className="space-y-3 text-sm mb-5">
            <div className="flex justify-between p-3 rounded-xl" style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' }}>
              <span style={{ color: '#4A4035' }}>Balancing payment deadline</span>
              <span className="font-bold" style={{ color: '#1C1208' }}>{payDeadline}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl" style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' }}>
              <span style={{ color: '#4A4035' }}>First payment on account</span>
              <span className="font-bold" style={{ color: '#1C1208' }}>{payDeadline}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl" style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' }}>
              <span style={{ color: '#4A4035' }}>Second payment on account</span>
              <span className="font-bold" style={{ color: '#1C1208' }}>{balancingDate}</span>
            </div>
          </div>

          {calc.totalDue !== undefined && (
            <div className="p-4 rounded-xl mb-5 text-sm" style={{ backgroundColor: '#FDFCF8', border: '1px solid #C4622D40' }}>
              <p style={{ color: '#9A8F83', marginBottom: '0.25rem' }}>Estimated total due</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#C4622D' }}>£{calc.totalDue.toFixed(2)}</p>
              <p className="text-xs mt-1" style={{ color: '#9A8F83' }}>Log in to your HMRC account to see the exact amount including any payments on account.</p>
            </div>
          )}

          <p className="text-sm font-medium mb-3" style={{ color: '#1C1208' }}>How to pay</p>
          <div className="space-y-2 text-sm mb-5">
            {[
              { method: 'Online banking', detail: 'Use sort code 08-32-10, account 12001039, reference is your 10-digit UTR + K' },
              { method: 'HMRC online', detail: 'Pay by debit card or approve a bank payment via your Government Gateway account' },
              { method: 'Direct Debit', detail: 'Set up a budget payment plan or one-off payment via HMRC online services' },
            ].map(item => (
              <div key={item.method} className="p-3 rounded-xl" style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' }}>
                <p className="font-medium" style={{ color: '#1C1208' }}>{item.method}</p>
                <p style={{ color: '#9A8F83', marginTop: '0.15rem' }}>{item.detail}</p>
              </div>
            ))}
          </div>

          <a
            href="https://www.gov.uk/pay-self-assessment-tax-bill"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm font-medium px-5 py-2.5 rounded-full"
            style={{ backgroundColor: '#6B8E6E', color: '#FDFCF8', textDecoration: 'none' }}
          >
            Pay via HMRC →
          </a>
        </section>
      )}
    </div>
  );
}

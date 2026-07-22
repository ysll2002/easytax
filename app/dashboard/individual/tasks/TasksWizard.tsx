'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, AlertCircle, ChevronRight, Calculator, FileCheck, CreditCard, SlidersHorizontal } from 'lucide-react';
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

function daysUntil(date: string) {
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  return diff;
}

export default function TasksWizard() {
  const [obligations,  setObligations]  = useState<Obligation[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [calc,         setCalc]         = useState<CalcState>({ id: null });
  const [calcLoading,  setCalcLoading]  = useState(false);
  const [adjSubmitted, setAdjSubmitted] = useState(false);

  const taxYear = currentTaxYear();
  const [startYear, endYear] = taxYear.split('-');

  useEffect(() => {
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
  const allFulfilled = quarterlyObs.length > 0 && quarterlyObs.every(o => o.status === 'Fulfilled');
  const submittedCount = quarterlyObs.filter(o => o.status === 'Fulfilled').length;

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

  // Overall step: 1=quarters, 2=adjustments, 3=calculate, 4=declare, 5=pay.
  // Step 4/5 are locked (EOY not supported), so currentStep caps at 4.
  const currentStep = calc.id ? 4 : adjSubmitted ? 3 : allFulfilled ? 2 : 1;

  const steps = [
    { n: 1, label: 'Quarterly updates' },
    { n: 2, label: 'Adjustments' },
    { n: 3, label: 'Tax estimate' },
    { n: 4, label: 'Declaration' },
    { n: 5, label: 'Payment' },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3" style={{ color: '#9A8F83' }}>
        <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        Loading HMRC obligations…
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <Link href="/dashboard/individual" className="text-sm mb-8 inline-flex items-center gap-1" style={{ color: '#9A8F83', textDecoration: 'none' }}>
        ← Back
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3" style={{ backgroundColor: '#F0EBE1', color: '#C4622D', border: '1px solid #C4622D30' }}>
          Making Tax Digital · {startYear}/{endYear.slice(-2)}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208' }}>
          Self Assessment {taxYear}
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#9A8F83' }}>
          {quarterlyObs.length > 0
            ? `${submittedCount} of ${quarterlyObs.length} quarterly updates submitted`
            : 'No obligations loaded yet'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-0 mb-10">
        {steps.map((s, i) => {
          const done    = s.n < currentStep;
          const active  = s.n === currentStep;
          return (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1" style={{ minWidth: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                  backgroundColor: done ? '#C4622D' : active ? '#1C1208' : '#E8E2DA',
                  color: done || active ? '#FDFCF8' : '#9A8F83',
                }}>
                  {done ? '✓' : s.n}
                </div>
                <span style={{ fontSize: '0.65rem', color: active ? '#1C1208' : '#9A8F83', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 2, backgroundColor: s.n < currentStep ? '#C4622D' : '#E8E2DA', margin: '0 4px', marginBottom: 16 }} />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl mb-6 text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Step 1: Quarterly Updates */}
      <Section icon={<Clock size={18} />} title="Step 1 — Quarterly Updates" done={allFulfilled} active={currentStep === 1}>
        {quarterlyObs.length === 0 ? (
          <p className="text-sm" style={{ color: '#9A8F83' }}>No quarterly obligations found. Make sure your HMRC connection is active.</p>
        ) : (
          <div className="space-y-2">
            {quarterlyObs.map((ob, i) => {
              const done    = ob.status === 'Fulfilled';
              const days    = daysUntil(ob.dueDate);
              const overdue = !done && days < 0;
              const urgent  = !done && days >= 0 && days <= 14;
              return (
                <div key={ob.periodKey} className="flex items-center justify-between p-4 rounded-xl"
                  style={{ backgroundColor: done ? '#F0EBE1' : '#FAFAF8', border: `1.5px solid ${done ? '#C4622D30' : overdue ? '#FCA5A5' : '#E8E2DA'}` }}>
                  <div className="flex items-center gap-3">
                    <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: done ? '#C4622D15' : '#F0EBE1', flexShrink: 0 }}>
                      {done
                        ? <CheckCircle2 size={16} color="#C4622D" />
                        : <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9A8F83' }}>Q{i + 1}</span>
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#1C1208' }}>{quarterLabel(ob.periodStartDate, ob.periodEndDate)}</p>
                      <p className="text-xs mt-0.5" style={{ color: overdue ? '#EF4444' : urgent ? '#C4622D' : '#9A8F83' }}>
                        {done ? `Submitted · Due ${new Date(ob.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` :
                         overdue ? `Overdue by ${Math.abs(days)} days` :
                         `Due ${new Date(ob.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${days} days left`}
                      </p>
                    </div>
                  </div>
                  {done ? (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#C4622D15', color: '#C4622D' }}>Submitted</span>
                  ) : (
                    <Link href={`/dashboard/individual/quarter?start=${ob.periodStartDate}&end=${ob.periodEndDate}&key=${ob.periodKey}`}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: overdue ? '#EF4444' : '#1C1208', color: '#FDFCF8', textDecoration: 'none' }}>
                      Submit <ChevronRight size={12} />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Step 2: Adjustments */}
      <Section icon={<SlidersHorizontal size={18} />} title="Step 2 — Annual Adjustments" done={adjSubmitted} active={currentStep === 2} locked={!allFulfilled}>
        <p className="text-sm mb-4" style={{ color: '#9A8F83' }}>
          Declare savings interest, dividends, charitable giving, and claim overlap relief or other end-of-year adjustments.
        </p>
        {adjSubmitted ? (
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#C4622D' }}>
            <CheckCircle2 size={16} /> Adjustments submitted
          </div>
        ) : (
          <Link href="/dashboard/individual/adjustments"
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full"
            style={{ backgroundColor: '#1C1208', color: '#FDFCF8', textDecoration: 'none' }}>
            Review & Submit <ChevronRight size={14} />
          </Link>
        )}
      </Section>

      {/* Step 3: Tax Estimate */}
      <Section icon={<Calculator size={18} />} title="Step 3 — Tax Estimate" done={!!calc.id} active={currentStep === 3} locked={!allFulfilled || !adjSubmitted}>
        {calc.id ? (
          <div className="space-y-2">
            {[
              { label: 'Income Tax', value: calc.incomeTax },
              { label: 'Class 4 NIC', value: calc.class4Nic },
            ].filter(r => r.value !== undefined).map(r => (
              <div key={r.label} className="flex justify-between text-sm" style={{ color: '#4A4035' }}>
                <span>{r.label}</span>
                <span className="font-semibold">£{r.value!.toFixed(2)}</span>
              </div>
            ))}
            {calc.totalDue !== undefined && (
              <div className="flex justify-between text-sm font-bold pt-2 mt-1" style={{ color: '#1C1208', borderTop: '1px solid #E8E2DA' }}>
                <span>Total Due</span>
                <span style={{ color: '#C4622D', fontSize: '1.1rem' }}>£{calc.totalDue.toFixed(2)}</span>
              </div>
            )}
            {/* HMRC MTD-ITSA production requirement (General #14a): in-year
                calculations must be shown with an accuracy disclaimer. Wording
                follows the example in the Software Approvals checklist. */}
            <p className="text-xs mt-3 leading-relaxed" style={{ color: '#9A8F83' }}>
              This calculation is only based on information HMRC has received about your income and expenses to {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}. This may change as further information is received about you during the tax year.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm mb-4" style={{ color: '#9A8F83' }}>Request a tax calculation from HMRC based on all your submitted data.</p>
            <button onClick={handleCalculate} disabled={calcLoading}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full"
              style={{ backgroundColor: '#1C1208', color: '#FDFCF8', opacity: calcLoading ? 0.6 : 1, cursor: calcLoading ? 'wait' : 'pointer', border: 'none' }}>
              {calcLoading
                ? <><div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> Calculating…</>
                : <>Calculate My Tax <ChevronRight size={14} /></>}
            </button>
          </>
        )}
      </Section>

      {/* Step 4: Final Declaration — NOT SUPPORTED (in-year only build).
          HMRC MTD-ITSA production requirement: because EasyTax does not yet
          support end-of-year functionality, this step is disabled and users
          are signposted to the gov.uk compatible-software directory. */}
      <Section icon={<FileCheck size={18} />} title="Step 4 — Final Declaration" done={false} active={false} locked>
        <div className="p-4 rounded-xl" style={{ backgroundColor: '#FFF9F5', border: '1px solid #C4622D30' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: '#1C1208' }}>
            End-of-year submission not supported in EasyTax
          </p>
          <p className="text-sm mb-3" style={{ color: '#4A4035', lineHeight: 1.5 }}>
            EasyTax currently supports in-year quarterly updates only. The Final Declaration
            (crystallisation) step at the end of the tax year is <strong>not</strong> available in
            this software. To complete your Final Declaration you will need to use additional
            HMRC-compatible software.
          </p>
          <a href="https://www.gov.uk/guidance/find-software-thats-compatible-with-making-tax-digital-for-income-tax"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ backgroundColor: '#1C1208', color: '#FDFCF8', textDecoration: 'none' }}>
            Find compatible software on gov.uk <ChevronRight size={12} />
          </a>
        </div>
      </Section>

      {/* Step 5: Payment — locked because Final Declaration isn't supported yet. */}
      <Section icon={<CreditCard size={18} />} title="Step 5 — Pay Your Tax" done={false} active={false} locked>
        <p className="text-sm" style={{ color: '#9A8F83' }}>
          Payment deadlines and totals will appear here once end-of-year functionality is available.
          In the meantime, pay any Self Assessment tax you owe directly at{' '}
          <a href="https://www.gov.uk/pay-self-assessment-tax-bill" target="_blank" rel="noopener noreferrer"
            style={{ color: '#C4622D', textDecoration: 'underline' }}>
            gov.uk — Pay your Self Assessment tax bill
          </a>.
        </p>
      </Section>
    </div>
  );
}

function Section({ icon, title, children, done, active, locked }: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  done: boolean;
  active: boolean;
  locked?: boolean;
}) {
  const borderColor = done ? '#C4622D' : active ? '#1C1208' : '#E8E2DA';
  return (
    <div className="mb-4 rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${borderColor}`, opacity: locked ? 0.45 : 1 }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ backgroundColor: done ? '#F5EDDC' : active ? '#F8F7F5' : '#FAFAF8', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ color: done ? '#C4622D' : active ? '#1C1208' : '#9A8F83' }}>{icon}</div>
        <h2 style={{ fontWeight: 700, fontSize: '0.95rem', color: done ? '#C4622D' : '#1C1208' }}>{title}</h2>
        {done && <CheckCircle2 size={16} color="#C4622D" style={{ marginLeft: 'auto' }} />}
        {locked && <span className="text-xs ml-auto px-2 py-0.5 rounded-full" style={{ backgroundColor: '#E8E2DA', color: '#9A8F83' }}>Locked</span>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

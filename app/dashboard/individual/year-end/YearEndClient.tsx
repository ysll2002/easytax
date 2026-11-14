'use client';
import { useState } from 'react';
import Link from 'next/link';
import { hmrcFetch } from '@/lib/hmrc-client';

// Year-end final declaration for MTD Income Tax (sandbox only — see page.tsx).
//
// The steps follow HMRC's end-of-year journey:
//   1. See what HMRC holds: final declaration obligation, business totals
//      (BISS), losses brought forward and loss claims.
//   2. Optional accounting adjustments to the business figures (BSAS).
//   3. Annual allowances and other income (the existing adjustments page).
//   4. The final calculation (intent-to-finalise), shown in full with HMRC's
//      errors, warnings and information messages.
//   5. The declaration, then Submit Final Declaration against that calculation.

/** The last tax year that has ended. Final declarations can only be made after 5 April. */
function lastEndedTaxYear(now = new Date()) {
  const y = now.getFullYear();
  const afterYearEnd = now.getMonth() > 3 || (now.getMonth() === 3 && now.getDate() >= 6);
  const start = afterYearEnd ? y - 1 : y - 2;
  return `${start}-${String(start + 1).slice(2)}`;
}

// Gov-Test-Scenario values from HMRC's API documentation, for exercising error
// handling in the sandbox. The server drops the header in production.
const SCENARIOS = [
  '', 'NO_INCOME_SUBMISSIONS_EXIST', 'FINAL_DECLARATION_RECEIVED', 'INCOME_SOURCES_CHANGED',
  'RECENT_SUBMISSIONS_EXIST', 'RESIDENCY_CHANGED', 'CALCULATION_IN_PROGRESS', 'TAX_YEAR_NOT_ENDED',
  'BUSINESS_VALIDATION_FAILURE', 'SUBMISSION_FAILED', 'NOT_FOUND',
];

// Wording of the declaration an individual makes when submitting their own
// final declaration, as given in HMRC's MTD Income Tax end-to-end service guide.
const DECLARATION =
  'I declare that the information and self-assessment I have filed are (taken together) correct and complete to the best of my knowledge. ' +
  'I understand that I may have to pay financial penalties and face prosecution if I give false information.';

type Json = Record<string, unknown>;
type Settled<T> = { data?: T; error?: string };
type Overview = {
  businessId:           string;
  obligations:          Settled<{ periodStartDate: string; periodEndDate: string; dueDate: string; status: string; receivedDate?: string }[]>;
  biss:                 Settled<Json>;
  broughtForwardLosses: Settled<{ lossId: string; typeOfLoss: string; lossAmount: number }[]>;
  lossClaims:           Settled<{ claimId: string; typeOfLoss: string; typeOfClaim: string }[]>;
};
type Message = { id: string; text: string };

/** Read a number at a dotted path out of an HMRC response. */
function num(obj: unknown, path: string): number | undefined {
  let cur: unknown = obj;
  for (const key of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Json)[key];
  }
  return typeof cur === 'number' ? cur : undefined;
}

const gbp = (n: number | undefined) =>
  n === undefined ? '—' : n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });

const ADJUSTABLE_FIELDS: { group: 'income' | 'expenses'; key: string; label: string }[] = [
  { group: 'income',   key: 'turnover',             label: 'Turnover' },
  { group: 'income',   key: 'other',                label: 'Other business income' },
  { group: 'expenses', key: 'costOfGoods',          label: 'Cost of goods' },
  { group: 'expenses', key: 'wagesAndStaffCosts',   label: 'Wages and staff costs' },
  { group: 'expenses', key: 'carVanTravelExpenses', label: 'Car, van and travel' },
  { group: 'expenses', key: 'premisesRunningCosts', label: 'Premises running costs' },
  { group: 'expenses', key: 'adminCosts',           label: 'Phone, stationery and office costs' },
  { group: 'expenses', key: 'advertisingCosts',     label: 'Advertising' },
  { group: 'expenses', key: 'professionalFees',     label: 'Accountancy and professional fees' },
  { group: 'expenses', key: 'otherExpenses',        label: 'Other expenses' },
];

export default function YearEndClient() {
  const [taxYear,  setTaxYear]  = useState(lastEndedTaxYear());
  const [scenario, setScenario] = useState('');
  const [busy,     setBusy]     = useState<string | null>(null);

  const [overview,    setOverview]    = useState<Overview | null>(null);
  const [overviewErr, setOverviewErr] = useState('');

  const [bsasId,      setBsasId]      = useState('');
  const [bsas,        setBsas]        = useState<Json | null>(null);
  const [bsasErr,     setBsasErr]     = useState('');
  const [adjust,      setAdjust]      = useState<Record<string, string>>({});
  const [adjustDone,  setAdjustDone]  = useState('');

  const [calcId,      setCalcId]      = useState('');
  const [calc,        setCalc]        = useState<Json | null>(null);
  const [calcErr,     setCalcErr]     = useState('');

  const [agreed,      setAgreed]      = useState(false);
  const [declareErr,  setDeclareErr]  = useState('');
  const [declared,    setDeclared]    = useState<{ submittedAt: string; calculationId: string } | null>(null);

  async function call(action: string, extra: Json = {}): Promise<Json> {
    const r = await hmrcFetch('/api/hmrc/year-end', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action, taxYear, scenario: scenario || undefined, ...extra }),
    });
    const d = await r.json().catch(() => ({ error: `Unexpected response (${r.status})` }));
    if (!r.ok || d.error) throw new Error(d.message ?? d.error ?? `Request failed (${r.status})`);
    return d;
  }

  /** HMRC computes summaries and calculations asynchronously; retrieve answers 404 until they are ready. */
  async function poll(action: string, calculationId: string): Promise<Json> {
    let lastError = '';
    for (let i = 0; i < 8; i++) {
      await new Promise(res => setTimeout(res, i === 0 ? 3000 : 2000));
      try {
        return await call(action, { calculationId });
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (!lastError.includes('HMRC 404')) throw err;
      }
    }
    throw new Error(`HMRC is still working on this. Try again in a minute. (${lastError})`);
  }

  function resetFrom(step: 'year' | 'bsas' | 'calc') {
    if (step === 'year') { setOverview(null); setOverviewErr(''); setBsasId(''); setBsas(null); setBsasErr(''); setAdjust({}); setAdjustDone(''); }
    if (step === 'year' || step === 'bsas' || step === 'calc') { setCalcId(''); setCalc(null); setCalcErr(''); setAgreed(false); setDeclareErr(''); setDeclared(null); }
  }

  async function loadOverview() {
    setBusy('overview'); setOverviewErr('');
    try { setOverview(await call('overview') as unknown as Overview); }
    catch (err) { setOverviewErr(err instanceof Error ? err.message : String(err)); }
    finally { setBusy(null); }
  }

  async function loadBsas() {
    setBusy('bsas'); setBsasErr(''); setBsas(null); setAdjustDone(''); resetFrom('bsas');
    try {
      const { calculationId } = await call('bsas-trigger') as { calculationId: string };
      setBsasId(calculationId);
      setBsas(await poll('bsas-get', calculationId));
    } catch (err) { setBsasErr(err instanceof Error ? err.message : String(err)); }
    finally { setBusy(null); }
  }

  async function submitAdjustments(zero: boolean) {
    setBusy('adjust'); setBsasErr('');
    try {
      let adjustments: Json;
      if (zero) {
        adjustments = { zeroAdjustments: true };
      } else {
        const income: Record<string, number> = {};
        const expenses: Record<string, number> = {};
        for (const f of ADJUSTABLE_FIELDS) {
          const raw = adjust[f.key]?.trim();
          if (!raw) continue;
          const value = Number(raw);
          if (!Number.isFinite(value)) throw new Error(`${f.label}: enter a number, for example -150 or 200.`);
          if (value !== 0) (f.group === 'income' ? income : expenses)[f.key] = Math.round(value * 100) / 100;
        }
        if (!Object.keys(income).length && !Object.keys(expenses).length) {
          throw new Error('Enter at least one adjustment, or choose "No adjustments needed".');
        }
        adjustments = {
          ...(Object.keys(income).length ? { income } : {}),
          ...(Object.keys(expenses).length ? { expenses } : {}),
        };
      }
      await call('bsas-adjust', { calculationId: bsasId, adjustments });
      setAdjustDone(zero ? 'Recorded with HMRC: no adjustments needed.' : 'Adjustments sent to HMRC.');
      resetFrom('calc');
      // Re-read so the adjusted figures are what the customer sees.
      setBsas(await poll('bsas-get', bsasId));
    } catch (err) { setBsasErr(err instanceof Error ? err.message : String(err)); }
    finally { setBusy(null); }
  }

  async function runCalculation() {
    setBusy('calc'); setCalcErr(''); resetFrom('calc');
    try {
      const { calculationId } = await call('calc-trigger') as { calculationId: string };
      setCalcId(calculationId);
      setCalc(await poll('calc-get', calculationId));
    } catch (err) { setCalcErr(err instanceof Error ? err.message : String(err)); }
    finally { setBusy(null); }
  }

  async function declare() {
    setBusy('declare'); setDeclareErr('');
    try {
      const d = await call('declare', { calculationId: calcId, confirmed: true }) as { submittedAt: string; calculationId: string };
      setDeclared(d);
    } catch (err) { setDeclareErr(err instanceof Error ? err.message : String(err)); }
    finally { setBusy(null); }
  }

  const messages = (calc?.messages ?? {}) as { errors?: Message[]; warnings?: Message[]; info?: Message[] };
  const calcErrors = messages.errors ?? [];
  const canDeclare = !!calc && calcErrors.length === 0 && (calc.metadata as Json | undefined)?.intentToSubmitFinalDeclaration === true;
  const bsasSummary = (bsas?.adjustedSummaryCalculation ?? bsas?.adjustableSummaryCalculation) as Json | undefined;
  const bsasAdjusted = !!bsas?.adjustedSummaryCalculation;

  return (
    <div className="p-4 sm:p-8 max-w-2xl" id="year-end">
      <Link href="/dashboard/individual" className="text-sm mb-6 inline-block" style={{ color: '#6B6256' }}>
        ← Back to Self Assessment
      </Link>

      <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
        Year-end final declaration
      </h1>
      <p className="text-sm mb-4" style={{ color: '#4A4035', lineHeight: 1.6 }}>
        Finish your tax year with HMRC: check your figures, make any final adjustments, review HMRC&apos;s calculation and submit your final declaration.
      </p>
      <p className="text-sm mb-6 p-3 rounded-xl" style={{ backgroundColor: '#FEF3C7', color: '#713F12', border: '1px solid #E5CFA8' }}>
        <strong>HMRC sandbox only.</strong> This uses HMRC&apos;s test service, so nothing here is a real tax return. EasyTax is not yet approved for end-of-year submission.
      </p>

      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="ye-tax-year" className="block text-sm font-medium mb-1" style={{ color: '#4A4035' }}>Tax year</label>
            <input id="ye-tax-year" type="text" inputMode="numeric" value={taxYear} aria-describedby="ye-tax-year-hint"
              onChange={e => { setTaxYear(e.target.value.trim()); resetFrom('year'); }}
              style={{ border: '1px solid #8A7F72', backgroundColor: '#FFFFFF', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', width: '7rem' }} />
            <p id="ye-tax-year-hint" className="text-xs mt-1" style={{ color: '#6B6256' }}>For example 2025-26</p>
          </div>
          <div>
            <label htmlFor="ye-scenario" className="block text-sm font-medium mb-1" style={{ color: '#4A4035' }}>Sandbox test scenario</label>
            <select id="ye-scenario" value={scenario} onChange={e => setScenario(e.target.value)}
              style={{ border: '1px solid #8A7F72', backgroundColor: '#FFFFFF', padding: '0.4rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
              {SCENARIOS.map(s => <option key={s} value={s}>{s || 'Default (success)'}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* 1 — What HMRC holds */}
      <Card>
        <StepHeading n={1} title="Check what HMRC holds for the year" />
        <Button onClick={loadOverview} busy={busy === 'overview'} disabled={!!busy}>Load from HMRC</Button>
        <ErrorBox text={overviewErr} />
        {overview && (
          <div className="mt-5 space-y-5">
            <Part title="Final declaration due" error={overview.obligations.error}>
              {overview.obligations.data?.length
                ? overview.obligations.data.map(o => (
                    <Row key={o.periodStartDate} label={`${o.periodStartDate} to ${o.periodEndDate}`}
                      value={o.status === 'fulfilled' ? `Submitted ${o.receivedDate ?? ''}` : `Due ${o.dueDate}`} />
                  ))
                : <Note>No final declaration obligation found for {taxYear}.</Note>}
            </Part>
            <Part title="Your business for the year" error={overview.biss.error}>
              {overview.biss.data && (
                <>
                  <Row label="Income" value={gbp(num(overview.biss.data, 'total.income'))} />
                  <Row label="Expenses" value={gbp(num(overview.biss.data, 'total.expenses'))} />
                  <Row label="Net profit" value={gbp(num(overview.biss.data, 'profit.net'))} />
                  <Row label="Net loss" value={gbp(num(overview.biss.data, 'loss.net'))} />
                  <Row label="Taxable profit" value={gbp(num(overview.biss.data, 'profit.taxable'))} strong />
                </>
              )}
            </Part>
            <Part title="Losses brought forward" error={overview.broughtForwardLosses.error}>
              {overview.broughtForwardLosses.data?.length
                ? overview.broughtForwardLosses.data.map(l => <Row key={l.lossId} label={l.typeOfLoss} value={gbp(l.lossAmount)} />)
                : <Note>None recorded.</Note>}
            </Part>
            <Part title="Loss claims" error={overview.lossClaims.error}>
              {overview.lossClaims.data?.length
                ? overview.lossClaims.data.map(c => <Row key={c.claimId} label={c.typeOfLoss} value={c.typeOfClaim.replace(/-/g, ' ')} />)
                : <Note>None recorded.</Note>}
            </Part>
          </div>
        )}
      </Card>

      {/* 2 — Accounting adjustments */}
      <Card>
        <StepHeading n={2} title="Make accounting adjustments (if you need to)" />
        <p className="text-sm mb-4" style={{ color: '#4A4035', lineHeight: 1.6 }}>
          HMRC adds up your four quarterly updates. If anything needs correcting for the whole year — a missed invoice, an expense in the wrong category — adjust it here. You can only adjust a summary once.
        </p>
        <Button onClick={loadBsas} busy={busy === 'bsas'} disabled={!!busy}>Get my business summary</Button>
        <ErrorBox text={bsasErr} />
        {bsasSummary && (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B6256' }}>
              {bsasAdjusted ? 'After your adjustments' : 'HMRC’s summary'}
            </p>
            <Row label="Total income" value={gbp(num(bsasSummary, 'totalIncome'))} />
            <Row label="Total expenses" value={gbp(num(bsasSummary, 'totalExpenses'))} />
            <Row label="Net profit" value={gbp(num(bsasSummary, 'netProfit'))} />
            <Row label="Net loss" value={gbp(num(bsasSummary, 'netLoss'))} />
            <Row label="Taxable profit" value={gbp(num(bsasSummary, 'taxableProfit'))} strong />

            {adjustDone
              ? <p role="status" className="text-sm mt-4 p-3 rounded-xl" style={{ backgroundColor: '#E7F0E8', color: '#2F4A31' }}>{adjustDone}</p>
              : !bsasAdjusted && (
                <fieldset className="mt-5">
                  <legend className="text-sm font-semibold mb-1" style={{ color: '#1C1208' }}>Adjustments</legend>
                  <p id="ye-adjust-hint" className="text-xs mb-3" style={{ color: '#6B6256' }}>
                    Enter the change, not the new total: 200 adds £200, -150 takes £150 off. Leave a box empty for no change.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {ADJUSTABLE_FIELDS.map(f => (
                      <div key={f.key}>
                        <label htmlFor={`ye-adj-${f.key}`} className="block text-xs mb-1" style={{ color: '#4A4035' }}>{f.label}</label>
                        <input id={`ye-adj-${f.key}`} type="text" inputMode="decimal" aria-describedby="ye-adjust-hint"
                          value={adjust[f.key] ?? ''} onChange={e => setAdjust(a => ({ ...a, [f.key]: e.target.value }))}
                          style={{ border: '1px solid #8A7F72', backgroundColor: '#FFFFFF', padding: '0.4rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.875rem', width: '100%' }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <Button onClick={() => submitAdjustments(false)} busy={busy === 'adjust'} disabled={!!busy}>Send adjustments to HMRC</Button>
                    <Button onClick={() => submitAdjustments(true)} disabled={!!busy} secondary>No adjustments needed</Button>
                  </div>
                </fieldset>
              )}
          </div>
        )}
      </Card>

      {/* 3 — Allowances and other income */}
      <Card>
        <StepHeading n={3} title="Add allowances and other income" />
        <p className="text-sm mb-3" style={{ color: '#4A4035', lineHeight: 1.6 }}>
          Capital allowances, private use, savings interest, dividends and Gift Aid are entered on the annual adjustments page. Do this before the final calculation.
        </p>
        <Link href="/dashboard/individual/adjustments" className="text-sm font-semibold" style={{ color: '#A04E1C', textDecoration: 'underline' }}>
          Go to annual adjustments
        </Link>
        <p className="text-xs mt-3" style={{ color: '#6B6256', lineHeight: 1.55 }}>
          EasyTax does not yet cover employment, pensions, property, foreign income or capital gains. If you have any of these, use{' '}
          <a href="https://www.gov.uk/guidance/find-software-thats-compatible-with-making-tax-digital-for-income-tax"
            target="_blank" rel="noopener noreferrer" style={{ color: '#A04E1C', textDecoration: 'underline' }}>other compatible software</a>{' '}
          for your final declaration.
        </p>
      </Card>

      {/* 4 — Final calculation */}
      <Card>
        <StepHeading n={4} title="Get your final tax calculation" />
        <Button onClick={runCalculation} busy={busy === 'calc'} disabled={!!busy}>Calculate my tax for {taxYear}</Button>
        <ErrorBox text={calcErr} />
        {calc && (
          <div className="mt-5">
            <Row label="Total income" value={gbp(num(calc, 'calculation.taxCalculation.incomeTax.totalIncomeReceivedFromAllSources'))} />
            <Row label="Allowances and deductions" value={gbp(num(calc, 'calculation.taxCalculation.incomeTax.totalAllowancesAndDeductions'))} />
            <Row label="Taxable income" value={gbp(num(calc, 'calculation.taxCalculation.incomeTax.totalTaxableIncome'))} />
            <Row label="Income Tax" value={gbp(num(calc, 'calculation.taxCalculation.incomeTax.totalIncomeTaxDue'))} />
            <Row label="Class 2 National Insurance" value={gbp(num(calc, 'calculation.taxCalculation.nics.class2Nics.amount'))} />
            <Row label="Class 4 National Insurance" value={gbp(num(calc, 'calculation.taxCalculation.nics.class4Nics.totalAmount'))} />
            <Row label="Total Income Tax and National Insurance due" value={gbp(num(calc, 'calculation.taxCalculation.totalIncomeTaxAndNicsDue'))} strong />

            <MessageList title="Errors — you must fix these before you can declare" items={calcErrors} tone="error" />
            <MessageList title="Warnings — check these" items={messages.warnings ?? []} tone="warning" />
            <MessageList title="Information from HMRC" items={messages.info ?? []} tone="info" />
          </div>
        )}
      </Card>

      {/* 5 — Declaration */}
      <Card>
        <StepHeading n={5} title="Make your final declaration" />
        {declared ? (
          <div role="status" className="p-4 rounded-xl text-sm" style={{ backgroundColor: '#E7F0E8', color: '#2F4A31', lineHeight: 1.6 }}>
            <p className="font-semibold mb-1">Final declaration submitted to the HMRC sandbox.</p>
            <p>Submitted {new Date(declared.submittedAt).toLocaleString('en-GB')}. Calculation ID {declared.calculationId}.</p>
          </div>
        ) : !calc ? (
          <Note>Run the final calculation first. You can only declare against a calculation you have reviewed.</Note>
        ) : !canDeclare ? (
          <Note>You cannot declare yet: HMRC reported errors on this calculation, or it is not a final calculation. Fix the errors and calculate again.</Note>
        ) : (
          <>
            <div className="flex gap-3 items-start p-4 rounded-xl mb-4" style={{ backgroundColor: '#F7F2E8', border: '1px solid #DDD5C8' }}>
              <input id="ye-declare" type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                style={{ width: '1.25rem', height: '1.25rem', marginTop: '0.15rem', flexShrink: 0 }} />
              <label htmlFor="ye-declare" className="text-sm" style={{ color: '#1C1208', lineHeight: 1.6 }}>{DECLARATION}</label>
            </div>
            <Button onClick={declare} busy={busy === 'declare'} disabled={!!busy || !agreed}>Submit final declaration to HMRC</Button>
          </>
        )}
        <ErrorBox text={declareErr} />
      </Card>
    </div>
  );
}

// ─── Small presentational pieces ─────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return <section className="p-5 sm:p-6 rounded-2xl mb-5" style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' }}>{children}</section>;
}

function StepHeading({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="flex items-center gap-3 mb-3" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1C1208' }}>
      <span aria-hidden="true" className="inline-flex items-center justify-center rounded-full text-xs"
        style={{ width: '1.6rem', height: '1.6rem', backgroundColor: '#1C1208', color: '#FDFCF8', flexShrink: 0 }}>{n}</span>
      <span><span className="sr-only">Step {n}: </span>{title}</span>
    </h2>
  );
}

function Button({ children, onClick, busy, disabled, secondary }: {
  children: React.ReactNode; onClick: () => void; busy?: boolean; disabled?: boolean; secondary?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-busy={busy || undefined}
      className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full"
      style={{
        backgroundColor: secondary ? 'transparent' : '#1C1208',
        color: secondary ? '#1C1208' : '#FDFCF8',
        border: secondary ? '1px solid #1C1208' : 'none',
        opacity: disabled && !busy ? 0.55 : 1,
        cursor: busy ? 'wait' : disabled ? 'not-allowed' : 'pointer',
      }}>
      {busy && <span aria-hidden="true" className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />}
      {busy ? 'Working…' : children}
    </button>
  );
}

function ErrorBox({ text }: { text: string }) {
  if (!text) return null;
  return <div role="alert" className="mt-4 p-3 rounded-xl text-sm" style={{ backgroundColor: '#FEE2E2', color: '#7F1D1D', wordBreak: 'break-word' }}>{text}</div>;
}

function Part({ title, error, children }: { title: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B6256' }}>{title}</h3>
      {error ? <p className="text-sm" style={{ color: '#B3261E', wordBreak: 'break-word' }}>Could not load: {error}</p> : children}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 text-sm py-1.5" style={{ color: '#1C1208', borderBottom: '1px solid #F0EBE1', fontWeight: strong ? 700 : 400 }}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-sm" style={{ color: '#4A4035', lineHeight: 1.6 }}>{children}</p>;
}

function MessageList({ title, items, tone }: { title: string; items: Message[]; tone: 'error' | 'warning' | 'info' }) {
  if (!items.length) return null;
  const colours = {
    error:   { bg: '#FEE2E2', fg: '#7F1D1D' },
    warning: { bg: '#FEF3C7', fg: '#713F12' },
    info:    { bg: '#EEF2F7', fg: '#1E3A5F' },
  }[tone];
  return (
    <div className="mt-4 p-3 rounded-xl text-sm" role={tone === 'error' ? 'alert' : undefined} style={{ backgroundColor: colours.bg, color: colours.fg }}>
      <p className="font-semibold mb-1">{title}</p>
      <ul className="list-disc pl-5 space-y-1">
        {items.map(m => <li key={m.id}>{m.text} <span className="text-xs">({m.id})</span></li>)}
      </ul>
    </div>
  );
}

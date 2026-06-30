'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function currentTaxYear() {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${String(year + 1).slice(2)}`;
}

const inputStyle = {
  width: '100%', padding: '0.6rem 0.875rem', borderRadius: '0.75rem',
  border: '1px solid #DDD5C8', backgroundColor: '#FDFCF8',
  fontSize: '0.9rem', color: '#1C1208', outline: 'none',
};

const amountInput = {
  ...inputStyle, width: '10rem', paddingLeft: '1.75rem',
};

function AmountField({ label, hint, value, onChange }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: '#1C1208' }}>{label}</p>
        {hint && <p className="text-xs mt-0.5" style={{ color: '#9A8F83' }}>{hint}</p>}
      </div>
      <div className="relative flex-shrink-0">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#9A8F83' }}>£</span>
        <input
          type="number" min="0" step="0.01"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="0.00"
          style={amountStyle}
        />
      </div>
    </div>
  );
}

const amountStyle = { ...inputStyle, width: '10rem', paddingLeft: '1.75rem' };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="p-6 rounded-2xl mb-4" style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' }}>
      <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontWeight: 700, color: '#1C1208', marginBottom: '1.25rem' }}>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function AdjustmentsPage() {
  const router    = useRouter();
  const taxYear   = currentTaxYear();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  // Business adjustments
  const [overlapRelief,   setOverlapRelief]   = useState('');
  const [acctAdjustment, setAcctAdjustment]   = useState('');
  const [balancingCharge, setBalancingCharge] = useState('');
  const [goodsOwnUse,     setGoodsOwnUse]     = useState('');

  // Other income
  const [savingsInterest,  setSavingsInterest]  = useState('');
  const [foreignCountry,   setForeignCountry]   = useState('');
  const [foreignAmount,    setForeignAmount]    = useState('');
  const [foreignTax,       setForeignTax]       = useState('');
  const [stockDividend,    setStockDividend]    = useState('');

  // Allowances & reliefs
  const [giftAid,          setGiftAid]         = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      taxYear,
      businessAdjustments: {
        overlapReliefUsed:    parseFloat(overlapRelief   || '0') || undefined,
        accountingAdjustment: parseFloat(acctAdjustment  || '0') || undefined,
        balancingCharge:      parseFloat(balancingCharge || '0') || undefined,
        goodsAndServicesOwnUse: parseFloat(goodsOwnUse  || '0') || undefined,
      },
      savingsAccounts: savingsInterest ? [{ accountName: 'Savings', grossInterest: parseFloat(savingsInterest) }] : [],
      dividends: (() => {
        const fAmt   = parseFloat(foreignAmount || '0') || 0;
        const fTax   = parseFloat(foreignTax    || '0') || 0;
        const stock  = parseFloat(stockDividend || '0') || 0;
        const out: {
          foreignDividend?: { countryCode: string; amountBeforeTax: number; taxTakenOff?: number; foreignTaxCreditRelief?: boolean; taxableAmount: number }[];
          stockDividend?: { customerReference: string; grossAmount: number };
        } = {};
        if (fAmt > 0 && foreignCountry.trim()) {
          out.foreignDividend = [{
            countryCode:            foreignCountry.trim().toUpperCase(),
            amountBeforeTax:        fAmt,
            taxTakenOff:            fTax > 0 ? fTax : undefined,
            foreignTaxCreditRelief: fTax > 0 ? true : undefined,
            taxableAmount:          fAmt,
          }];
        }
        if (stock > 0) {
          out.stockDividend = { customerReference: `EasyTax-${taxYear}`, grossAmount: stock };
        }
        return out;
      })(),
      giftAid: { totalAmount: parseFloat(giftAid || '0') || undefined },
    };

    try {
      const res = await fetch('/api/hmrc/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (d.error) { setError(d.error); return; }
      router.push('/dashboard/individual/tasks?adjustments=done');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <Link href="/dashboard/individual/tasks" className="text-sm mb-6 inline-block" style={{ color: '#9A8F83' }}>← Back</Link>

      <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
        Annual Adjustments
      </h1>
      <p className="text-sm mb-6" style={{ color: '#9A8F83' }}>
        Tax year {taxYear} — add any year-end adjustments, other income, and reliefs before your final declaration.
        Leave fields blank if they don&apos;t apply.
      </p>

      {error && (
        <div className="p-4 rounded-xl mb-5 text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <Section title="Business Adjustments">
          <AmountField
            label="Overlap relief used"
            hint="Relief carried forward from before MTD — enter the amount you're using this year."
            value={overlapRelief} onChange={setOverlapRelief}
          />
          <AmountField
            label="Accounting adjustment"
            hint="Adjustment for change in accounting basis (e.g. cash to accruals)."
            value={acctAdjustment} onChange={setAcctAdjustment}
          />
          <AmountField
            label="Balancing charge"
            hint="If you sold business assets and received more than their tax value."
            value={balancingCharge} onChange={setBalancingCharge}
          />
          <AmountField
            label="Goods/services for own use"
            hint="Value of business goods you've used personally."
            value={goodsOwnUse} onChange={setGoodsOwnUse}
          />
        </Section>

        <Section title="Other Income">
          <AmountField
            label="UK savings interest"
            hint="Total gross interest from bank/building society accounts before tax."
            value={savingsInterest} onChange={setSavingsInterest}
          />
          <div className="rounded-xl p-4" style={{ backgroundColor: '#F5F0E6', border: '1px solid #E5DDD0' }}>
            <p className="text-sm font-medium mb-1" style={{ color: '#1C1208' }}>Foreign dividends</p>
            <p className="text-xs mb-3" style={{ color: '#9A8F83' }}>
              Dividends from foreign shares or ETFs. UK dividends are reported automatically by HMRC and don&apos;t need to be added here.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text" maxLength={3}
                value={foreignCountry}
                onChange={e => setForeignCountry(e.target.value)}
                placeholder="Country (USA, FRA…)"
                style={inputStyle}
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#9A8F83' }}>£</span>
                <input
                  type="number" min="0" step="0.01"
                  value={foreignAmount}
                  onChange={e => setForeignAmount(e.target.value)}
                  placeholder="Gross"
                  style={{ ...inputStyle, paddingLeft: '1.75rem' }}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#9A8F83' }}>£</span>
                <input
                  type="number" min="0" step="0.01"
                  value={foreignTax}
                  onChange={e => setForeignTax(e.target.value)}
                  placeholder="Foreign tax"
                  style={{ ...inputStyle, paddingLeft: '1.75rem' }}
                />
              </div>
            </div>
          </div>
          <AmountField
            label="Stock dividends"
            hint="UK company gave you shares instead of a cash dividend (gross value)."
            value={stockDividend} onChange={setStockDividend}
          />
        </Section>

        <Section title="Reliefs & Allowances">
          <AmountField
            label="Gift Aid donations"
            hint="Total Gift Aid donations made during the tax year."
            value={giftAid} onChange={setGiftAid}
          />
          <div className="pt-2 text-sm" style={{ color: '#9A8F83', borderTop: '1px solid #DDD5C8' }}>
            <p className="font-medium mb-1" style={{ color: '#4A4035' }}>Personal Allowance</p>
            The standard Personal Allowance (£12,570) is applied automatically by HMRC — no action needed.
          </div>
        </Section>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl font-medium text-sm"
          style={{ backgroundColor: '#C4622D', color: '#FDFCF8', opacity: submitting ? 0.6 : 1, cursor: submitting ? 'wait' : 'pointer' }}
        >
          {submitting ? 'Submitting to HMRC…' : 'Submit Adjustments →'}
        </button>

        <p className="text-xs text-center mt-3" style={{ color: '#9A8F83' }}>
          You can skip this step if you have no adjustments or additional income to declare.{' '}
          <Link href="/dashboard/individual/tasks?adjustments=done" style={{ color: '#C4622D' }}>Skip →</Link>
        </p>
      </form>
    </div>
  );
}

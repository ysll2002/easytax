'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { type VatObligation } from '@/lib/hmrc';

type VatBoxes = {
  vatDueSales: number;
  vatDueAcquisitions: number;
  vatReclaimedCurrPeriod: number;
  totalValueSalesExVAT: number;
  totalValuePurchasesExVAT: number;
  totalValueGoodsSuppliedExVAT: number;
  totalAcquisitionsExVAT: number;
};

const EMPTY: VatBoxes = {
  vatDueSales: 0, vatDueAcquisitions: 0, vatReclaimedCurrPeriod: 0,
  totalValueSalesExVAT: 0, totalValuePurchasesExVAT: 0,
  totalValueGoodsSuppliedExVAT: 0, totalAcquisitionsExVAT: 0,
};

export default function VatPage() {
  const [obligations, setObligations] = useState<VatObligation[]>([]);
  const [selected, setSelected] = useState<VatObligation | null>(null);
  const [boxes, setBoxes] = useState<VatBoxes>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/hmrc/vat/obligations')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        const open = (d.obligations as VatObligation[]).filter(o => o.status === 'O');
        setObligations(d.obligations);
        if (open.length > 0) setSelected(open[0]);
      })
      .catch(() => setError('Failed to load VAT obligations'))
      .finally(() => setLoading(false));
  }, []);

  const totalVatDue = +(boxes.vatDueSales + boxes.vatDueAcquisitions).toFixed(2);
  const netVatDue   = +Math.max(0, totalVatDue - boxes.vatReclaimedCurrPeriod).toFixed(2);

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/hmrc/vat/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodKey:                    selected.periodKey,
          vatDueSales:                  boxes.vatDueSales,
          vatDueAcquisitions:           boxes.vatDueAcquisitions,
          totalVatDue,
          vatReclaimedCurrPeriod:       boxes.vatReclaimedCurrPeriod,
          netVatDue,
          totalValueSalesExVAT:         Math.round(boxes.totalValueSalesExVAT),
          totalValuePurchasesExVAT:     Math.round(boxes.totalValuePurchasesExVAT),
          totalValueGoodsSuppliedExVAT: Math.round(boxes.totalValueGoodsSuppliedExVAT),
          totalAcquisitionsExVAT:       Math.round(boxes.totalAcquisitionsExVAT),
          finalised: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Submission failed');
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key: keyof VatBoxes, label: string, desc: string) => (
    <div key={key} className="flex justify-between items-start py-3" style={{ borderBottom: '1px solid #DDD5C8' }}>
      <div className="pr-4">
        <p className="text-sm font-semibold" style={{ color: '#1C1208' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: '#9A8F83' }}>{desc}</p>
      </div>
      <input
        type="number" min="0" step="0.01"
        value={boxes[key]}
        onChange={e => setBoxes(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
        style={{
          width: '120px', padding: '0.4rem 0.75rem', borderRadius: '0.5rem',
          border: '1.5px solid #DDD5C8', backgroundColor: '#FDFCF8',
          color: '#1C1208', fontSize: '0.875rem', textAlign: 'right', outline: 'none',
        }}
      />
    </div>
  );

  if (submitted) return (
    <div className="p-4 sm:p-8 max-w-lg flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-6" style={{ backgroundColor: '#E2EDE2' }}>✓</div>
      <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
        VAT Return Submitted
      </h1>
      <p style={{ color: '#9A8F83', marginBottom: '2rem' }}>
        Your return for period {selected?.start} – {selected?.end} has been sent to HMRC via MTD.
      </p>
      <Link href="/dashboard/tax" className="px-6 py-2.5 rounded-full text-sm font-medium" style={{ backgroundColor: '#1C1208', color: '#FDFCF8', textDecoration: 'none' }}>
        Back to Tax Filing
      </Link>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <Link href="/dashboard/tax" className="text-sm mb-6 inline-block" style={{ color: '#9A8F83' }}>← Back</Link>
      <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
        VAT Return
      </h1>
      <p style={{ color: '#9A8F83', marginBottom: '2rem', fontSize: '0.9rem' }}>Making Tax Digital — VAT</p>

      {loading && <p style={{ color: '#9A8F83' }}>Loading obligations…</p>}
      {error && <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: '#F5E4D8', color: '#C4622D', fontSize: '0.9rem' }}>{error}</div>}

      {!loading && !error && (
        <>
          {/* Obligation selector */}
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9A8F83' }}>Select Period</p>
            <div className="space-y-2">
              {obligations.map(o => (
                <button
                  key={o.periodKey}
                  onClick={() => { setSelected(o); setBoxes(EMPTY); setSubmitted(false); }}
                  className="w-full text-left p-4 rounded-xl flex justify-between items-center"
                  style={{
                    backgroundColor: selected?.periodKey === o.periodKey ? '#F0EBE1' : '#FDFCF8',
                    border: `1.5px solid ${selected?.periodKey === o.periodKey ? '#C4622D40' : '#DDD5C8'}`,
                    borderLeft: `4px solid ${o.status === 'F' ? '#6B8E6E' : '#C4622D'}`,
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#1C1208' }}>{o.start} – {o.end}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9A8F83' }}>Due {o.due}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{
                    backgroundColor: o.status === 'F' ? '#E2EDE2' : '#F5E4D8',
                    color: o.status === 'F' ? '#6B8E6E' : '#C4622D',
                  }}>
                    {o.status === 'F' ? 'Filed' : 'Open'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {selected && selected.status === 'O' && (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #DDD5C8' }}>
              <div className="px-6 py-4" style={{ backgroundColor: '#F0EBE1', borderBottom: '1px solid #DDD5C8' }}>
                <p className="font-semibold text-sm" style={{ color: '#1C1208' }}>9-Box VAT Return — {selected.start} to {selected.end}</p>
              </div>
              <div className="px-6 py-2">
                {field('vatDueSales',                  'Box 1', 'VAT due on sales and other outputs')}
                {field('vatDueAcquisitions',            'Box 2', 'VAT due on acquisitions from EU member states')}
                <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid #DDD5C8' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#1C1208' }}>Box 3</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9A8F83' }}>Total VAT due (Box 1 + Box 2)</p>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#1C1208' }}>£{totalVatDue.toFixed(2)}</p>
                </div>
                {field('vatReclaimedCurrPeriod',        'Box 4', 'VAT reclaimed on purchases and other inputs')}
                <div className="flex justify-between items-center py-4" style={{ backgroundColor: '#1C1208', margin: '0 -1.5rem', padding: '1rem 1.5rem' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#FDFCF8' }}>Box 5 — Net VAT to pay</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9A8F83' }}>Box 3 minus Box 4</p>
                  </div>
                  <p className="font-semibold" style={{ color: '#FDFCF8' }}>£{netVatDue.toFixed(2)}</p>
                </div>
                {field('totalValueSalesExVAT',          'Box 6', 'Total value of sales and outputs (ex VAT)')}
                {field('totalValuePurchasesExVAT',      'Box 7', 'Total value of purchases and inputs (ex VAT)')}
                {field('totalValueGoodsSuppliedExVAT',  'Box 8', 'Total value of supplies to EU member states (ex VAT)')}
                {field('totalAcquisitionsExVAT',        'Box 9', 'Total value of acquisitions from EU member states (ex VAT)')}
              </div>
              <div className="px-6 py-5" style={{ backgroundColor: '#F0EBE1', borderTop: '1px solid #DDD5C8' }}>
                <p className="text-xs mb-4" style={{ color: '#9A8F83', lineHeight: 1.6 }}>
                  By submitting this return you are making a legal declaration that the information is true and complete. A false declaration can result in prosecution.
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: '#C4622D', color: '#FDFCF8', opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? 'Submitting to HMRC…' : '🇬🇧 Submit VAT Return to HMRC'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

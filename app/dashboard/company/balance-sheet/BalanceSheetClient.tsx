'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type ReportData = {
  pl: { totalIncome: number; totalExpenses: number; netProfit: number; corpTaxEstimate: number };
  balance: { bankBalance: number | null };
};

function fmt(n: number) {
  return `£${Math.abs(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Row({ label, value, bold, indent, color, top }: { label: string; value?: string; bold?: boolean; indent?: boolean; color?: string; top?: boolean }) {
  return (
    <div
      className={`flex justify-between py-2.5 ${indent ? 'pl-6' : ''}`}
      style={{ borderTop: top ? '2px solid #DDD5C8' : undefined, borderBottom: '1px solid #F0EBE1' }}
    >
      <span style={{ fontSize: '0.875rem', fontWeight: bold ? 700 : 400, color: color ?? '#1C1208' }}>{label}</span>
      {value !== undefined && (
        <span style={{ fontSize: '0.875rem', fontWeight: bold ? 700 : 600, color: color ?? '#1C1208', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      )}
    </div>
  );
}

function SectionHeader({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <div className="px-6 py-3" style={{ backgroundColor: bg, borderBottom: '1px solid #DDD5C8' }}>
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
    </div>
  );
}

export default function BalanceSheetClient() {
  const [data, setData] = useState<ReportData | null>(null);
  const [shareCapital, setShareCapital] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Use YTD figures for balance sheet
    const from = (() => {
      const now = new Date();
      const year = now.getMonth() >= 3 && now.getDate() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
      return new Date(year, 3, 6).toISOString();
    })();
    fetch(`/api/company/report?from=${encodeURIComponent(from)}&to=${encodeURIComponent(new Date().toISOString())}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <Link href="/dashboard/company" className="text-sm mb-4 inline-block" style={{ color: '#9A8F83', textDecoration: 'none' }}>← Company Tax</Link>
      <div style={{ textAlign: 'center', padding: '4rem', color: '#9A8F83' }}>Building Balance Sheet…</div>
    </div>
  );

  if (error === 'no_bank' || error === 'token_expired') return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <Link href="/dashboard/company" className="text-sm mb-4 inline-block" style={{ color: '#9A8F83', textDecoration: 'none' }}>← Company Tax</Link>
      <div className="p-6 rounded-2xl mt-6" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
        <p className="font-semibold mb-2" style={{ color: '#1C1208' }}>Bank account required</p>
        <p className="text-sm mb-4" style={{ color: '#9A8F83' }}>Connect your business bank account to generate a Balance Sheet.</p>
        <Link href="/dashboard/individual/banking" className="inline-block px-5 py-2.5 rounded-full text-sm font-medium" style={{ backgroundColor: '#C4622D', color: '#FDFCF8', textDecoration: 'none' }}>Connect Bank →</Link>
      </div>
    </div>
  );

  const pl = data!.pl;
  const bankBalance = data!.balance.bankBalance ?? 0;
  const retainedEarnings = pl.netProfit - pl.corpTaxEstimate;
  const vatLiability = 0;              // future: from HMRC VAT API
  const accountsReceivable = 0;       // future: from invoicing
  const accountsPayable = 0;          // future: from bills

  // Assets
  const currentAssets = bankBalance + accountsReceivable;
  const totalAssets = currentAssets;

  // Liabilities
  const corpTaxLiability = pl.corpTaxEstimate;
  const totalLiabilities = corpTaxLiability + vatLiability + accountsPayable;

  // Equity
  const totalEquity = shareCapital + retainedEarnings;

  // Check: Assets should = Liabilities + Equity
  const balanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <Link href="/dashboard/company" className="text-sm mb-4 inline-block" style={{ color: '#9A8F83', textDecoration: 'none' }}>← Company Tax</Link>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
            Balance Sheet
          </h1>
          <p style={{ color: '#9A8F83', fontSize: '0.85rem' }}>As at {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        {/* Share capital input */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium" style={{ color: '#9A8F83', whiteSpace: 'nowrap' }}>Share Capital</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#9A8F83' }}>£</span>
            <input
              type="number"
              min={0}
              value={shareCapital}
              onChange={e => setShareCapital(parseFloat(e.target.value) || 0)}
              style={{ width: '90px', paddingLeft: '1.5rem', paddingRight: '0.5rem', paddingTop: '0.4rem', paddingBottom: '0.4rem', borderRadius: '0.5rem', border: '1.5px solid #DDD5C8', backgroundColor: '#FDFCF8', fontSize: '0.875rem', color: '#1C1208', outline: 'none' }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #DDD5C8' }}>

        {/* ASSETS */}
        <SectionHeader label="Assets" color="#6B8E6E" bg="#E2EDE2" />
        <div className="px-6" style={{ backgroundColor: '#FFFFFF' }}>
          <Row label="Current Assets" bold />
          <Row label="Bank Account" value={fmt(bankBalance)} indent color="#6B8E6E" />
          <Row label="Accounts Receivable" value={fmt(accountsReceivable)} indent />
          <Row label="Total Current Assets" value={fmt(currentAssets)} bold top />
          <Row label="Total Assets" value={fmt(totalAssets)} bold color="#6B8E6E" />
        </div>

        {/* LIABILITIES */}
        <SectionHeader label="Liabilities" color="#C4622D" bg="#F5E4D8" />
        <div className="px-6" style={{ backgroundColor: '#FFFFFF' }}>
          <Row label="Current Liabilities" bold />
          <Row label="Accounts Payable" value={fmt(accountsPayable)} indent />
          <Row label="VAT Liability" value={fmt(vatLiability)} indent />
          <Row label="Corporation Tax" value={fmt(corpTaxLiability)} indent color="#C4622D" />
          <Row label="Total Liabilities" value={fmt(totalLiabilities)} bold color="#C4622D" top />
        </div>

        {/* EQUITY */}
        <SectionHeader label="Equity" color="#7C3AED" bg="#F5F0FF" />
        <div className="px-6" style={{ backgroundColor: '#FFFFFF' }}>
          <Row label="Share Capital" value={fmt(shareCapital)} indent />
          <Row label={`Retained Earnings (Net Profit ${fmt(pl.netProfit)} − Corp Tax ${fmt(pl.corpTaxEstimate)})`} value={fmt(retainedEarnings)} indent color={retainedEarnings >= 0 ? '#1C1208' : '#C4622D'} />
          <Row label="Total Equity" value={fmt(totalEquity)} bold color="#7C3AED" top />
        </div>

        {/* Balancing check */}
        <div className="px-6 py-4 flex justify-between items-center" style={{ backgroundColor: balanced ? '#1C1208' : '#C4622D' }}>
          <div>
            <p className="text-sm font-bold" style={{ color: '#FDFCF8' }}>Liabilities + Equity</p>
            {!balanced && <p className="text-xs mt-0.5" style={{ color: '#FDFCF8', opacity: 0.7 }}>Sheet does not balance — check your figures</p>}
          </div>
          <span className="font-bold text-lg" style={{ color: '#FDFCF8', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalLiabilities + totalEquity)}</span>
        </div>
      </div>

      <p className="text-xs mt-4 text-center" style={{ color: '#BDB5AA' }}>
        Bank balance from Open Banking · Corp Tax estimated at 25% · For management use only
      </p>
    </div>
  );
}

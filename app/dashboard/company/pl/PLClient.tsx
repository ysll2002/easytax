'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

type ExpenseLine = { account: string; amount: number; count: number };
type PLData = {
  period: { from: string; to: string };
  pl: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    corpTaxEstimate: number;
    incomeLines: { description: string; amount: number }[];
    expenseLines: ExpenseLine[];
  };
};

const PERIODS = [
  { label: 'This Tax Year',    value: 'tax_year' },
  { label: 'Last 3 Months',   value: '3m' },
  { label: 'Last 6 Months',   value: '6m' },
  { label: 'Last 12 Months',  value: '12m' },
];

function taxYearStart(): string {
  const now = new Date();
  const year = now.getMonth() >= 3 && now.getDate() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(year, 3, 6).toISOString();
}

function periodDates(period: string): { from: string; to: string } {
  const to = new Date().toISOString();
  if (period === 'tax_year') return { from: taxYearStart(), to };
  const months = period === '3m' ? 3 : period === '6m' ? 6 : 12;
  const from = new Date();
  from.setMonth(from.getMonth() - months);
  return { from: from.toISOString(), to };
}

function fmt(n: number) {
  return `£${Math.abs(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PLClient() {
  const [period, setPeriod] = useState('tax_year');
  const [data, setData] = useState<PLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showIncome, setShowIncome] = useState(false);

  const load = useCallback((p: string) => {
    setLoading(true);
    setError('');
    const { from, to } = periodDates(p);
    fetch(`/api/company/report?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(period); }, [period, load]);

  const pl = data?.pl;

  const Row = ({ label, value, bold, color, indent }: { label: string; value: string; bold?: boolean; color?: string; indent?: boolean }) => (
    <div className={`flex justify-between py-2.5 ${indent ? 'pl-4' : ''}`} style={{ borderBottom: '1px solid #F0EBE1' }}>
      <span style={{ fontSize: '0.875rem', fontWeight: bold ? 700 : 400, color: color ?? '#1C1208' }}>{label}</span>
      <span style={{ fontSize: '0.875rem', fontWeight: bold ? 700 : 600, color: color ?? '#1C1208', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <Link href="/dashboard/company" className="text-sm mb-4 inline-block" style={{ color: '#9A8F83', textDecoration: 'none' }}>← Company Tax</Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
            Profit & Loss
          </h1>
          {data && (
            <p style={{ color: '#9A8F83', fontSize: '0.85rem' }}>
              {new Date(data.period.from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} – {new Date(data.period.to).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
        <div className="flex gap-1 flex-wrap" style={{ backgroundColor: '#F0EBE1', borderRadius: '2rem', padding: '0.25rem' }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '0.35rem 0.875rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 500,
                border: 'none', cursor: 'pointer',
                backgroundColor: period === p.value ? '#1C1208' : 'transparent',
                color: period === p.value ? '#FDFCF8' : '#9A8F83',
                whiteSpace: 'nowrap',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9A8F83' }}>Computing P&amp;L…</div>
      ) : error === 'no_bank' || error === 'token_expired' ? (
        <div className="p-6 rounded-2xl" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
          <p className="font-semibold mb-2" style={{ color: '#1C1208' }}>Bank account required</p>
          <p className="text-sm mb-4" style={{ color: '#9A8F83' }}>Connect your business bank account to generate a P&amp;L from real transaction data.</p>
          <Link href="/dashboard/individual/banking" className="inline-block px-5 py-2.5 rounded-full text-sm font-medium" style={{ backgroundColor: '#C4622D', color: '#FDFCF8', textDecoration: 'none' }}>Connect Bank →</Link>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl" style={{ backgroundColor: '#F5E4D8', color: '#C4622D', fontSize: '0.875rem' }}>{error}</div>
      ) : pl ? (
        <div>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: 'Revenue',        value: fmt(pl.totalIncome),   color: '#6B8E6E' },
              { label: 'Expenses',       value: fmt(pl.totalExpenses), color: '#C4622D' },
              { label: pl.netProfit >= 0 ? 'Net Profit' : 'Net Loss', value: fmt(pl.netProfit), color: pl.netProfit >= 0 ? '#1C1208' : '#C4622D' },
            ].map(c => (
              <div key={c.label} className="p-4 rounded-2xl" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
                <p style={{ fontSize: '0.7rem', color: '#9A8F83', marginBottom: '0.4rem' }}>{c.label}</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* P&L statement */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #DDD5C8' }}>
            {/* Revenue */}
            <div className="px-6 py-3" style={{ backgroundColor: '#F0EBE1', borderBottom: '1px solid #DDD5C8' }}>
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowIncome(v => !v)}>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6B8E6E' }}>Revenue</span>
                <span className="text-xs" style={{ color: '#9A8F83' }}>{showIncome ? '▲ hide lines' : '▼ show lines'}</span>
              </div>
            </div>
            <div className="px-6" style={{ backgroundColor: '#FFFFFF' }}>
              {showIncome && pl.incomeLines.slice(0, 20).map((line, i) => (
                <Row key={i} label={line.description} value={fmt(line.amount)} indent color="#6B8E6E" />
              ))}
              {showIncome && pl.incomeLines.length > 20 && (
                <div className="py-2 text-xs" style={{ color: '#9A8F83' }}>+ {pl.incomeLines.length - 20} more transactions</div>
              )}
              <Row label="Total Revenue" value={fmt(pl.totalIncome)} bold color="#6B8E6E" />
            </div>

            {/* Expenses */}
            <div className="px-6 py-3" style={{ backgroundColor: '#F0EBE1', borderBottom: '1px solid #DDD5C8', borderTop: '1px solid #DDD5C8' }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#C4622D' }}>Operating Expenses</span>
            </div>
            <div className="px-6" style={{ backgroundColor: '#FFFFFF' }}>
              {pl.expenseLines.map((line, i) => (
                <Row key={i} label={line.account} value={fmt(line.amount)} indent />
              ))}
              <Row label="Total Expenses" value={fmt(pl.totalExpenses)} bold color="#C4622D" />
            </div>

            {/* Net Profit */}
            <div className="px-6 py-4 flex justify-between items-center" style={{ backgroundColor: '#1C1208' }}>
              <span className="font-bold text-sm" style={{ color: '#FDFCF8' }}>{pl.netProfit >= 0 ? 'Net Profit' : 'Net Loss'}</span>
              <span className="font-bold text-lg" style={{ color: pl.netProfit >= 0 ? '#6B8E6E' : '#C4622D', fontVariantNumeric: 'tabular-nums' }}>{fmt(pl.netProfit)}</span>
            </div>

            {/* Corp tax estimate */}
            {pl.netProfit > 0 && (
              <div className="px-6 py-3 flex justify-between items-center" style={{ backgroundColor: '#F0EBE1', borderTop: '1px solid #DDD5C8' }}>
                <div>
                  <span className="text-sm font-semibold" style={{ color: '#1C1208' }}>Corporation Tax estimate (25%)</span>
                  <p className="text-xs mt-0.5" style={{ color: '#9A8F83' }}>Indicative only — consult your accountant</p>
                </div>
                <span className="font-semibold text-sm" style={{ color: '#C4622D', fontVariantNumeric: 'tabular-nums' }}>{fmt(pl.corpTaxEstimate)}</span>
              </div>
            )}
          </div>

          <p className="text-xs mt-4 text-center" style={{ color: '#BDB5AA' }}>
            Based on bank transactions · Expenses auto-categorised by description · For management use only
          </p>
        </div>
      ) : null}
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, CheckCircle2, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

type Filing = {
  id: string;
  tax_year: string;
  filing_type: 'quarterly' | 'final_declaration' | 'adjustment';
  period_start: string | null;
  period_end: string | null;
  turnover: number | null;
  total_expenses: number | null;
  net_profit: number | null;
  expenses_detail: Record<string, number> | null;
  submitted_at: string;
};

const EXPENSE_LABELS: Record<string, string> = {
  costOfGoods:          'Cost of goods / materials',
  staffCosts:           'Staff costs',
  travelCosts:          'Travel & subsistence',
  premisesRunningCosts: 'Premises & running costs',
  adminCosts:           'Admin & office costs',
  advertisingCosts:     'Advertising & marketing',
  professionalFees:     'Professional fees',
  otherExpenses:        'Other allowable expenses',
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function groupByTaxYear(filings: Filing[]) {
  const groups: Record<string, Filing[]> = {};
  for (const f of filings) {
    if (!groups[f.tax_year]) groups[f.tax_year] = [];
    groups[f.tax_year].push(f);
  }
  return groups;
}

function FilingCard({ filing }: { filing: Filing }) {
  const [expanded, setExpanded] = useState(false);
  const isQuarterly = filing.filing_type === 'quarterly';
  const isFinal     = filing.filing_type === 'final_declaration';

  const typeLabel = isQuarterly ? 'Quarterly Update' : isFinal ? 'Final Declaration' : 'Adjustment';
  const typeColor = isQuarterly ? '#C4622D' : isFinal ? '#6B8E6E' : '#7C3AED';
  const typeBg    = isQuarterly ? '#F5EDDC' : isFinal ? '#E8F5E8' : '#F5F0FF';

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #E8E2DA' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
        style={{ backgroundColor: '#FAFAF8', border: 'none', cursor: 'pointer' }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: typeBg, flexShrink: 0 }}>
          <FileText size={18} color={typeColor} strokeWidth={1.8} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: typeBg, color: typeColor }}>
              {typeLabel}
            </span>
            <span className="text-xs" style={{ color: '#9A8F83' }}>
              {filing.tax_year}
            </span>
          </div>
          <p className="text-sm font-semibold" style={{ color: '#1C1208' }}>
            {isQuarterly && filing.period_start && filing.period_end
              ? `${fmtDate(filing.period_start)} – ${fmtDate(filing.period_end)}`
              : isFinal
              ? `Final Self Assessment · ${filing.tax_year}`
              : `Adjustment · ${filing.tax_year}`}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#9A8F83' }}>
            Submitted {fmtDateTime(filing.submitted_at)}
          </p>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {isQuarterly && filing.net_profit !== null && (
            <div className="text-right">
              <p className="text-xs" style={{ color: '#9A8F83' }}>Net profit</p>
              <p className="text-sm font-bold" style={{ color: filing.net_profit >= 0 ? '#6B8E6E' : '#EF4444' }}>
                £{filing.net_profit.toFixed(2)}
              </p>
            </div>
          )}
          {isFinal && (
            <div className="flex items-center gap-1" style={{ color: '#6B8E6E' }}>
              <CheckCircle2 size={16} />
              <span className="text-xs font-semibold">Filed</span>
            </div>
          )}
          {expanded ? <ChevronUp size={16} color="#9A8F83" /> : <ChevronDown size={16} color="#9A8F83" />}
        </div>
      </button>

      {expanded && isQuarterly && (
        <div style={{ borderTop: '1px solid #E8E2DA', backgroundColor: '#FFFFFF' }}>
          <div className="grid grid-cols-3 gap-0" style={{ borderBottom: '1px solid #F3F4F6' }}>
            {[
              { label: 'Turnover', value: filing.turnover, icon: <TrendingUp size={14} color="#6B8E6E" />, color: '#6B8E6E' },
              { label: 'Total expenses', value: filing.total_expenses, icon: <TrendingDown size={14} color="#C4622D" />, color: '#C4622D' },
              { label: 'Net profit', value: filing.net_profit, icon: null, color: (filing.net_profit ?? 0) >= 0 ? '#6B8E6E' : '#EF4444' },
            ].map(r => (
              <div key={r.label} className="px-5 py-4" style={{ borderRight: '1px solid #F3F4F6' }}>
                <div className="flex items-center gap-1 mb-1">
                  {r.icon}
                  <span className="text-xs" style={{ color: '#9A8F83' }}>{r.label}</span>
                </div>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: r.color }}>
                  £{(r.value ?? 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {filing.expenses_detail && Object.values(filing.expenses_detail).some(v => v > 0) && (
            <div className="px-5 py-4">
              <p className="text-xs font-semibold mb-3" style={{ color: '#1C1208' }}>Expense breakdown</p>
              <div className="space-y-2">
                {Object.entries(filing.expenses_detail)
                  .filter(([, v]) => v > 0)
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center text-sm">
                      <span style={{ color: '#4A4035' }}>{EXPENSE_LABELS[key] ?? key}</span>
                      <span className="font-semibold" style={{ color: '#1C1208' }}>£{value.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {expanded && isFinal && (
        <div className="px-5 py-5" style={{ borderTop: '1px solid #E8E2DA', backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-2 p-4 rounded-xl" style={{ backgroundColor: '#E8F5E8', border: '1px solid #6B8E6E30' }}>
            <CheckCircle2 size={20} color="#6B8E6E" />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#1C1208' }}>Final Declaration submitted</p>
              <p className="text-xs mt-0.5" style={{ color: '#9A8F83' }}>
                Your Self Assessment for {filing.tax_year} was submitted to HMRC on {fmtDateTime(filing.submitted_at)}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [filings, setFilings]   = useState<Filing[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState('');

  useEffect(() => {
    fetch('/api/hmrc/history')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setFilings(d.filings ?? []);
      })
      .catch(() => setError('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  const grouped = groupByTaxYear(filings);
  const taxYears = Object.keys(grouped).sort().reverse();

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <Link href="/dashboard/individual" className="text-sm mb-8 inline-block" style={{ color: '#9A8F83', textDecoration: 'none' }}>
        ← Back
      </Link>

      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
          Filing History
        </h1>
        <p style={{ color: '#9A8F83', fontSize: '0.9rem' }}>All your Self Assessment submissions to HMRC.</p>
      </div>

      {loading && (
        <div className="flex items-center gap-3" style={{ color: '#9A8F83' }}>
          <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          Loading history…
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>{error}</div>
      )}

      {!loading && !error && filings.length === 0 && (
        <div className="flex flex-col items-center py-16" style={{ color: '#9A8F83' }}>
          <FileText size={40} strokeWidth={1.2} style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <p className="font-medium" style={{ color: '#4A4035' }}>No submissions yet</p>
          <p className="text-sm mt-1">Your quarterly updates and final declarations will appear here.</p>
          <Link href="/dashboard/individual/tasks"
            className="mt-6 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{ backgroundColor: '#1C1208', color: '#FDFCF8', textDecoration: 'none' }}>
            Start Filing →
          </Link>
        </div>
      )}

      {!loading && taxYears.map(year => (
        <div key={year} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={15} color="#9A8F83" />
            <span className="text-sm font-bold" style={{ color: '#1C1208' }}>Tax Year {year}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0EBE1', color: '#9A8F83' }}>
              {grouped[year].length} submission{grouped[year].length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-3">
            {grouped[year].map(f => <FilingCard key={f.id} filing={f} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

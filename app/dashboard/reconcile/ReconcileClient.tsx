'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ReconcileChat from '@/components/ReconcileChat';
import type { ReconcileAction } from '@/app/api/ai/reconcile/route';

type Category = 'unreviewed' | 'business_income' | 'business_expense' | 'personal';

type Tx = {
  transaction_id: string;
  timestamp: string;
  description: string;
  amount: number;
  currency: string;
  category: Category;
};

const CATEGORIES: { value: Category; label: string; color: string; bg: string }[] = [
  { value: 'unreviewed',       label: 'Unreviewed',        color: '#9A8F83', bg: '#F0EBE1' },
  { value: 'business_income',  label: 'Business Income',   color: '#6B8E6E', bg: '#E2EDE2' },
  { value: 'business_expense', label: 'Business Expense',  color: '#C9963D', bg: '#F5EDDC' },
  { value: 'personal',         label: 'Personal',          color: '#9A8F83', bg: '#F0EBE1' },
];

type Filter = 'all' | Category;

const MAX_UNDO = 20;

export default function ReconcileClient({ accountName, accountId }: {
  accountName: string;
  accountId: string;
}) {
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [history, setHistory] = useState<Tx[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [chatOpen, setChatOpen] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/transactions')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setTransactions((data.transactions ?? []).map((tx: Omit<Tx, 'category'>) => ({
          ...tx,
          category: 'unreviewed' as Category,
        })));
      })
      .catch(() => setError('Failed to load transactions'))
      .finally(() => setLoading(false));
  }, [accountId]);

  const snapshot = (current: Tx[]) => {
    setHistory(h => [...h.slice(-MAX_UNDO + 1), current]);
  };

  const setCategory = (id: string, cat: Category) => {
    snapshot(transactions);
    setTransactions(prev => prev.map(tx => tx.transaction_id === id ? { ...tx, category: cat } : tx));
  };

  const applyActions = (actions: ReconcileAction[]) => {
    snapshot(transactions);
    setTransactions(prev => {
      let next = [...prev];
      for (const action of actions) {
        const idSet = new Set(action.ids);
        next = next.map(tx => idSet.has(tx.transaction_id) ? { ...tx, category: action.category } : tx);
      }
      return next;
    });
  };

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setTransactions(prev);
  };

  const filtered = transactions.filter(tx => {
    if (filter !== 'all' && tx.category !== filter) return false;
    if (search && !tx.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    unreviewed:       transactions.filter(t => t.category === 'unreviewed').length,
    business_income:  transactions.filter(t => t.category === 'business_income').length,
    business_expense: transactions.filter(t => t.category === 'business_expense').length,
    personal:         transactions.filter(t => t.category === 'personal').length,
  };

  const totals = {
    business_income:  transactions.filter(t => t.category === 'business_income').reduce((s, t) => s + t.amount, 0),
    business_expense: transactions.filter(t => t.category === 'business_expense').reduce((s, t) => s + Math.abs(t.amount), 0),
  };

  const tabStyle = (active: boolean) => ({
    padding: '0.4rem 1rem',
    borderRadius: '2rem',
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    backgroundColor: active ? '#1C1208' : 'transparent',
    color: active ? '#FDFCF8' : '#9A8F83',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
  });

  const transactionList = (
    <>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Business Income',   value: totals.business_income,  color: '#6B8E6E' },
          { label: 'Business Expenses', value: totals.business_expense, color: '#C9963D' },
          { label: 'Unreviewed',        value: counts.unreviewed,       color: '#9A8F83', isCount: true },
        ].map(item => (
          <div key={item.label} style={{ padding: '1rem', borderRadius: '1rem', backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
            <p style={{ fontSize: '0.7rem', color: '#9A8F83', marginBottom: '0.4rem' }}>{item.label}</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: item.color }}>
              {item.isCount ? item.value : `£${item.value.toFixed(2)}`}
            </p>
          </div>
        ))}
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="flex gap-1 overflow-x-auto" style={{ backgroundColor: '#F0EBE1', borderRadius: '2rem', padding: '0.25rem', flexShrink: 0 }}>
          {(['all', ...CATEGORIES.map(c => c.value)] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={tabStyle(filter === f)}>
              {f === 'all' ? 'All' : CATEGORIES.find(c => c.value === f)?.label}
              {f !== 'all' && <span style={{ marginLeft: '0.35rem', opacity: 0.7 }}>{counts[f as Category]}</span>}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search transactions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:flex-1"
          style={{ minWidth: 0, padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid #DDD5C8', backgroundColor: '#FDFCF8', fontSize: '0.875rem', color: '#1C1208', outline: 'none' }}
        />
      </div>

      {/* List */}
      <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {filtered.map(tx => (
          <div key={tx.transaction_id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3" style={{ padding: '0.875rem 1rem', borderRadius: '0.875rem', backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 500, color: '#1C1208', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.description}</p>
              <p style={{ fontSize: '0.75rem', color: '#9A8F83', marginTop: '0.1rem' }}>{new Date(tx.timestamp).toLocaleDateString('en-GB')}</p>
            </div>
            <p style={{ fontWeight: 700, color: tx.amount >= 0 ? '#6B8E6E' : '#C4622D', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {tx.amount >= 0 ? '+' : '-'}£{Math.abs(tx.amount).toFixed(2)}
            </p>
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(tx.transaction_id, c.value)}
                  style={{
                    padding: '0.2rem 0.55rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 500,
                    border: 'none', cursor: 'pointer',
                    backgroundColor: tx.category === c.value ? c.bg : 'transparent',
                    color: tx.category === c.value ? c.color : '#9A8F83',
                    outline: tx.category === c.value ? `1.5px solid ${c.color}` : 'none',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ color: '#9A8F83', textAlign: 'center', padding: '2rem' }}>No transactions match your filter.</p>
        )}
      </div>
    </>
  );

  return (
    <div className="flex flex-col lg:flex-row h-full" style={{ minHeight: 0 }}>
      {/* Main panel */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8" style={{ minWidth: 0 }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
              Reconcile Transactions
            </h1>
            <p style={{ color: '#9A8F83', fontSize: '0.9rem' }}>{accountName}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {history.length > 0 && (
              <button
                onClick={undo}
                className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium"
                style={{ backgroundColor: '#F0EBE1', color: '#9A8F83', border: '1px solid #DDD5C8' }}
              >
                ↩ Undo
              </button>
            )}
            <button
              onClick={() => setChatOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{ backgroundColor: chatOpen ? '#1C1208' : '#F0EBE1', color: chatOpen ? '#FDFCF8' : '#1C1208', border: '1px solid #DDD5C8' }}
            >
              <span>✦</span>
              <span className="hidden sm:inline">AI Assistant</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9A8F83' }}>Loading transactions…</div>
        ) : error === 'token_expired' || error === 'token_refresh_failed' ? (
          <div className="p-6 rounded-2xl" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: '#F5EDDC' }}>🔄</div>
              <div>
                <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>Bank connection expired</p>
                <p className="text-sm mb-4" style={{ color: '#9A8F83', lineHeight: 1.6 }}>Your bank connection has expired. Reconnect to continue importing transactions.</p>
                <Link href="/dashboard/tax/banking" className="inline-block px-5 py-2.5 rounded-full text-sm font-medium" style={{ backgroundColor: '#C4622D', color: '#FDFCF8', textDecoration: 'none' }}>
                  Reconnect Bank →
                </Link>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: '#F5EDDC' }}>🏦</div>
              <div>
                <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>Could not load transactions</p>
                <p className="text-sm mb-4" style={{ color: '#9A8F83', lineHeight: 1.6 }}>There was a problem fetching your bank data. Try reconnecting your account.</p>
                <Link href="/dashboard/tax/banking" className="inline-block px-5 py-2.5 rounded-full text-sm font-medium" style={{ backgroundColor: '#C4622D', color: '#FDFCF8', textDecoration: 'none' }}>
                  Reconnect Bank →
                </Link>
              </div>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-6 rounded-2xl" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: '#F5EDDC' }}>📭</div>
              <div>
                <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>No transactions found</p>
                <p className="text-sm" style={{ color: '#9A8F83', lineHeight: 1.6 }}>No transactions in the last 90 days for this account. If you think this is wrong, try reconnecting your bank.</p>
              </div>
            </div>
          </div>
        ) : transactionList}
      </div>

      {/* Chat panel — sidebar on desktop, slide-up on mobile */}
      {chatOpen && (
        <>
          {/* Mobile overlay */}
          <div
            className="fixed inset-0 z-30 lg:hidden"
            style={{ backgroundColor: 'rgba(28,18,8,0.4)' }}
            onClick={() => setChatOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-40 lg:static lg:z-auto lg:flex-shrink-0 flex flex-col"
            style={{
              height: '60vh',
              borderTop: '1px solid #DDD5C8',
              width: undefined,
            }}
          >
            <div className="hidden lg:block" style={{ width: '360px' }} />
            <div
              className="flex flex-col h-full lg:w-[360px] lg:border-l lg:border-t-0"
              style={{ borderColor: '#DDD5C8', backgroundColor: '#FDFCF8' }}
            >
              {/* Close button on mobile */}
              <div className="flex justify-end px-3 pt-2 lg:hidden">
                <button onClick={() => setChatOpen(false)} style={{ color: '#9A8F83', fontSize: '1.25rem' }}>✕</button>
              </div>
              <div className="flex-1 min-h-0">
                <ReconcileChat
                  transactions={transactions}
                  onActions={applyActions}
                  onUndo={undo}
                  canUndo={history.length > 0}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

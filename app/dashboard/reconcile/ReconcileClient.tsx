'use client';
import { useEffect, useState } from 'react';

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

const catMap = Object.fromEntries(CATEGORIES.map(c => [c.value, c]));

type Filter = 'all' | Category;

export default function ReconcileClient({ accountName, accountId, accessToken }: {
  accountName: string;
  accountId: string;
  accessToken: string;
}) {
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/transactions')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setTransactions((data.transactions ?? []).map((tx: Omit<Tx, 'category'>) => ({
          ...tx,
          category: (tx.amount > 0 ? 'unreviewed' : 'unreviewed') as Category,
        })));
      })
      .catch(() => setError('Failed to load transactions'))
      .finally(() => setLoading(false));
  }, [accountId, accessToken]);

  const setCategory = (id: string, cat: Category) => {
    setTransactions(prev => prev.map(tx => tx.transaction_id === id ? { ...tx, category: cat } : tx));
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

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
          Reconcile Transactions
        </h1>
        <p style={{ color: '#9A8F83', fontSize: '0.9rem' }}>{accountName}</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Business Income',   value: totals.business_income,  color: '#6B8E6E' },
          { label: 'Business Expenses', value: totals.business_expense, color: '#C9963D' },
          { label: 'Unreviewed',        value: counts.unreviewed,       color: '#9A8F83', isCount: true },
        ].map(item => (
          <div key={item.label} style={{ flex: 1, padding: '1.25rem', borderRadius: '1rem', backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
            <p style={{ fontSize: '0.75rem', color: '#9A8F83', marginBottom: '0.5rem' }}>{item.label}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: item.color }}>
              {item.isCount ? item.value : `£${item.value.toFixed(2)}`}
            </p>
          </div>
        ))}
      </div>

      {/* Filter tabs + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#F0EBE1', borderRadius: '2rem', padding: '0.25rem' }}>
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
          style={{ flex: 1, minWidth: '200px', padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid #DDD5C8', backgroundColor: '#FDFCF8', fontSize: '0.875rem', color: '#1C1208', outline: 'none' }}
        />
      </div>

      {/* Transaction list */}
      {loading ? (
        <p style={{ color: '#9A8F83', textAlign: 'center', padding: '3rem' }}>Loading transactions…</p>
      ) : error ? (
        <p style={{ color: '#C4622D', textAlign: 'center', padding: '3rem' }}>{error}</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: '#9A8F83', textAlign: 'center', padding: '3rem' }}>No transactions found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(tx => (
            <div key={tx.transaction_id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderRadius: '0.875rem', backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 500, color: '#1C1208', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.description}</p>
                <p style={{ fontSize: '0.75rem', color: '#9A8F83', marginTop: '0.15rem' }}>{new Date(tx.timestamp).toLocaleDateString('en-GB')}</p>
              </div>
              <p style={{ fontWeight: 700, color: tx.amount >= 0 ? '#6B8E6E' : '#C4622D', whiteSpace: 'nowrap' }}>
                {tx.amount >= 0 ? '+' : ''}£{Math.abs(tx.amount).toFixed(2)}
              </p>
              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(tx.transaction_id, c.value)}
                    style={{
                      padding: '0.25rem 0.6rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 500,
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
        </div>
      )}
    </div>
  );
}

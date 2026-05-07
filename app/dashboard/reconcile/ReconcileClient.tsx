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
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
          Reconcile Transactions
        </h1>
        <p style={{ color: '#9A8F83', fontSize: '0.9rem' }}>{accountName}</p>
      </div>

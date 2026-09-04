'use client';
import { useState } from 'react';
import Link from 'next/link';
import DemoBanner from '@/components/DemoBanner';

interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  confidence: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected';
}

// Sample data — see DemoBanner. These are illustrative transactions, not a
// real bank feed.
const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2026-03-01', merchant: 'Apple Store', amount: 1299.00, category: 'Equipment', confidence: 'high', status: 'pending' },
  { id: '2', date: '2026-03-02', merchant: 'Starbucks', amount: 4.50, category: 'Subsistence', confidence: 'low', status: 'pending' },
  { id: '3', date: '2026-03-03', merchant: 'Trainline', amount: 45.00, category: 'Travel', confidence: 'high', status: 'pending' },
  { id: '4', date: '2026-03-04', merchant: 'WeWork', amount: 350.00, category: 'Rent / Office', confidence: 'high', status: 'pending' },
  { id: '5', date: '2026-03-05', merchant: 'Amazon', amount: 24.99, category: 'Office Supplies', confidence: 'medium', status: 'pending' },
];

const confidenceStyle = {
  high:   { bg: '#E2EDE2', text: '#4A7A4E' },
  medium: { bg: '#F5EDDC', text: '#9A6B1A' },
  low:    { bg: '#F5E4D8', text: '#C4622D' },
};

export default function Expenses() {
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);

  const handleApprove = (id: string) => setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'approved' } : t));
  const handleReject  = (id: string) => setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'rejected' } : t));

  const pendingCount  = transactions.filter(t => t.status === 'pending').length;
  const approvedTotal = transactions.filter(t => t.status === 'approved').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: '#FDFCF8' }}>

      <nav style={{ backgroundColor: '#FDFCF8', borderBottom: '1px solid #DDD5C8' }}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/actions" className="flex items-center gap-2 text-sm font-medium transition-colors" style={{ color: '#9A8F83' }}>
            ← Back to Actions
          </Link>
          <span className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ backgroundColor: '#F5EDDC', color: '#C9963D' }}>
            Sample data
          </span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-10">

        <DemoBanner>The transactions below are examples, not a real bank feed.</DemoBanner>

        <div className="mb-8">
          <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2.25rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
            Review Expenses
          </h1>
          <p style={{ color: '#9A8F83' }}>
            {pendingCount > 0
              ? <>In this example, EasyTax has flagged <strong style={{ color: '#1C1208' }}>{pendingCount}</strong> transactions for review. Approved expenses here total <strong style={{ color: '#1C1208' }}>£{approvedTotal.toFixed(2)}</strong>.</>
              : 'All transactions reviewed.'}
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #DDD5C8' }}>
          {transactions.map((t, i) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-4 px-6 py-5 transition-all"
              style={{
                backgroundColor: t.status !== 'pending' ? '#F0EBE1' : '#FDFCF8',
                borderTop: i > 0 ? '1px solid #DDD5C8' : 'none',
                opacity: t.status !== 'pending' ? 0.55 : 1,
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-semibold" style={{ color: '#1C1208' }}>{t.merchant}</p>
                  <p style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontWeight: 700, color: '#1C1208' }}>
                    £{t.amount.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs" style={{ color: '#9A8F83' }}>{t.date}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: confidenceStyle[t.confidence].bg, color: confidenceStyle[t.confidence].text }}>
                    {t.confidence.toUpperCase()} confidence
                  </span>
                  <span className="text-xs" style={{ color: '#9A8F83' }}>→ {t.category}</span>
                </div>
              </div>

              <div className="flex-shrink-0 ml-4">
                {t.status === 'pending' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(t.id)}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                      style={{ border: '1.5px solid #DDD5C8', color: '#9A8F83', backgroundColor: '#FDFCF8' }}
                      title="Mark as personal"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleApprove(t.id)}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                      style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}
                      title="Approve as business expense"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-medium" style={{ color: t.status === 'approved' ? '#6B8E6E' : '#9A8F83' }}>
                    {t.status === 'approved' ? 'Approved' : 'Personal'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {pendingCount === 0 && (
          <div className="mt-10 text-center p-8 rounded-2xl" style={{ backgroundColor: '#E2EDE2', border: '1px solid #6B8E6E30' }}>
            <p style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
              All caught up.
            </p>
            <p className="text-sm mb-6" style={{ color: '#4A4035' }}>
              Total approved: <strong>£{approvedTotal.toFixed(2)}</strong>
            </p>
            <Link href="/actions" className="inline-block px-6 py-3 rounded-full text-sm font-medium transition-all" style={{ backgroundColor: '#1C1208', color: '#FDFCF8' }}>
              Return to Action Plan →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

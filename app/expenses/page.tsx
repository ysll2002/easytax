'use client';
import { useState } from 'react';
import Link from 'next/link';

interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  confidence: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected';
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2026-03-01', merchant: 'Apple Store', amount: 1299.00, category: 'Equipment', confidence: 'high', status: 'pending' },
  { id: '2', date: '2026-03-02', merchant: 'Starbucks', amount: 4.50, category: 'Subsistence', confidence: 'low', status: 'pending' },
  { id: '3', date: '2026-03-03', merchant: 'Trainline', amount: 45.00, category: 'Travel', confidence: 'high', status: 'pending' },
  { id: '4', date: '2026-03-04', merchant: 'WeWork', amount: 350.00, category: 'Rent/Office', confidence: 'high', status: 'pending' },
  { id: '5', date: '2026-03-05', merchant: 'Amazon', amount: 24.99, category: 'Office Supplies', confidence: 'medium', status: 'pending' },
];

export default function Expenses() {
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);

  const handleApprove = (id: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, status: 'approved' } : t
    ));
  };

  const handleReject = (id: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, status: 'rejected' } : t
    ));
  };

  const pendingCount = transactions.filter(t => t.status === 'pending').length;
  const approvedTotal = transactions
    .filter(t => t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Nav */}
      <nav className="bg-white shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/actions" className="text-xl font-bold text-blue-600 flex items-center gap-2">
              <span>←</span> Back to Actions
            </Link>
            <div className="text-sm text-gray-500">
              AI Categorization Active 🤖
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Review Expenses</h1>
          <p className="mt-2 text-gray-600">
            Our AI has flagged <strong>{pendingCount}</strong> transactions for review. 
            Confirming these could save you approx <strong>£{(approvedTotal * 0.2).toFixed(2)}</strong> in tax.
          </p>
        </div>

        {/* List */}
        <div className="bg-white shadow overflow-hidden rounded-md">
          <ul className="divide-y divide-gray-200">
            {transactions.map((t) => (
              <li key={t.id} className={`p-6 hover:bg-gray-50 transition-colors ${t.status !== 'pending' ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                  
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-lg font-medium text-blue-600 truncate">{t.merchant}</p>
                      <p className="text-lg font-bold text-gray-900">£{t.amount.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-gray-500">{t.date}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${t.confidence === 'high' ? 'bg-green-100 text-green-800' : 
                          t.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        AI Confidence: {t.confidence.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-400">→ Suggested: {t.category}</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  {t.status === 'pending' ? (
                    <div className="ml-6 flex items-center gap-2">
                      <button 
                        onClick={() => handleReject(t.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Reject / Personal"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleApprove(t.id)}
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full border border-green-200 transition-colors"
                        title="Approve"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="ml-6">
                      <span className={`text-sm font-medium ${t.status === 'approved' ? 'text-green-600' : 'text-red-400'}`}>
                        {t.status === 'approved' ? 'Approved' : 'Marked Personal'}
                      </span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Summary Footer */}
        {pendingCount === 0 && (
            <div className="mt-8 text-center animate-fade-in-up">
                <div className="inline-block p-6 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-green-800 font-medium text-lg">🎉 All caught up!</p>
                    <p className="text-green-600 mt-1">Total Expenses Approved: £{approvedTotal.toFixed(2)}</p>
                    <Link href="/actions" className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
                        Return to Action Plan
                    </Link>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ActionItem {
  id: string;
  type: 'urgent' | 'warning' | 'info';
  title: string;
  description: string;
  cta: string;
  ctaLink: string;
  completed: boolean;
}

const MOCK_ACTIONS: ActionItem[] = [
  {
    id: '1',
    type: 'urgent',
    title: 'MTD ITSA Q1 Quarterly Update',
    description: 'First MTD ITSA quarter (6 Apr – 5 Jul 2026) is due 5 Aug 2026. Send your Q1 update to HMRC.',
    cta: 'Send Update',
    ctaLink: '/dashboard/tax/quarter',
    completed: false,
  },
  {
    id: '2',
    type: 'warning',
    title: 'File 2025/26 Self Assessment',
    description: 'Deadline: 31 Jan 2027. You have £45,000 in untaxed income to declare for 2025/26.',
    cta: 'Start Filing',
    ctaLink: '/payment',
    completed: false,
  },
  {
    id: '3',
    type: 'warning',
    title: 'Review Uncategorised Expenses',
    description: 'We found 5 transactions from the 2026/27 tax year that look like business expenses but need your confirmation.',
    cta: 'Review Now',
    ctaLink: '/expenses',
    completed: false,
  },
  {
    id: '4',
    type: 'info',
    title: 'Connect Business Bank Account',
    description: 'Link your Monzo or Starling account to automate expense tracking for the 2026/27 tax year.',
    cta: 'Connect Bank',
    ctaLink: '#',
    completed: false,
  },
];

const typeConfig = {
  urgent:  { bar: '#C4622D', badge: { bg: '#F5E4D8', text: '#C4622D', label: 'Urgent' } },
  warning: { bar: '#C9963D', badge: { bg: '#F5EDDC', text: '#C9963D', label: 'Action Required' } },
  info:    { bar: '#6B8E6E', badge: { bg: '#E2EDE2', text: '#6B8E6E', label: 'Info' } },
};

export default function Actions() {
  const router = useRouter();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setActions(MOCK_ACTIONS);
      setLoading(false);
    }, 1200);
  }, []);

  const handleConnect = async (id: string) => {
    setConnectingId(id);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setActions(prev => prev.map(a =>
      a.id === id ? { ...a, completed: true, title: 'Bank Account Connected', description: 'Monzo Business account linked successfully.' } : a
    ));
    setConnectingId(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: '#FDFCF8' }}>
        <div className="w-14 h-14 rounded-full border-4 animate-spin mb-6" style={{ borderColor: '#DDD5C8', borderTopColor: '#C4622D' }} />
        <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
          Analysing your tax profile
        </h2>
        <p style={{ color: '#9A8F83' }}>Checking deadlines and obligations with HMRC...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4" style={{ backgroundColor: '#FDFCF8' }}>
      <div className="max-w-2xl mx-auto">

        <div className="mb-12">
          <Link href="/" style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', color: '#C4622D', fontWeight: 700, fontSize: '1.25rem', display: 'inline-block', marginBottom: '2rem' }}>
            EasyTax
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2.5rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.75rem' }}>
            Your Action Plan
          </h1>
          <p style={{ color: '#9A8F83' }}>
            Based on your HMRC data, here is your prioritised to-do list.
          </p>
        </div>

        <div className="space-y-4">
          {actions.map((action) => {
            const cfg = typeConfig[action.type];
            return (
              <div
                key={action.id}
                className="rounded-2xl overflow-hidden transition-all"
                style={{
                  backgroundColor: action.completed ? '#F0EBE1' : '#FDFCF8',
                  border: '1px solid #DDD5C8',
                  borderLeft: `4px solid ${action.completed ? '#DDD5C8' : cfg.bar}`,
                  opacity: action.completed ? 0.6 : 1,
                }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        {!action.completed && (
                          <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ backgroundColor: cfg.badge.bg, color: cfg.badge.text }}>
                            {cfg.badge.label}
                          </span>
                        )}
                        <h3 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.2rem', fontWeight: 700, color: action.completed ? '#9A8F83' : '#1C1208', textDecoration: action.completed ? 'line-through' : 'none' }}>
                          {action.title}
                        </h3>
                      </div>
                      <p className="text-sm mb-5" style={{ color: '#4A4035', lineHeight: 1.6 }}>{action.description}</p>

                      {!action.completed && (
                        action.ctaLink === '#' ? (
                          <button
                            onClick={() => handleConnect(action.id)}
                            disabled={connectingId === action.id}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
                            style={{ backgroundColor: connectingId === action.id ? '#DDD5C8' : '#1C1208', color: '#FDFCF8', cursor: connectingId === action.id ? 'not-allowed' : 'pointer' }}
                          >
                            {connectingId === action.id ? (
                              <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Connecting...
                              </>
                            ) : <>{action.cta} →</>}
                          </button>
                        ) : (
                          <Link
                            href={action.ctaLink}
                            className="inline-block px-5 py-2.5 rounded-full text-sm font-medium transition-all"
                            style={{ backgroundColor: action.type === 'urgent' ? '#C4622D' : '#1C1208', color: '#FDFCF8' }}
                          >
                            {action.cta} →
                          </Link>
                        )
                      )}
                    </div>

                    <div className="flex-shrink-0 self-center w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: action.completed ? '#E2EDE2' : `${cfg.bar}15` }}>
                      {action.completed ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#6B8E6E">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={cfg.bar}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link href="/dashboard" className="text-sm transition-colors" style={{ color: '#9A8F83' }}>
            Skip to full dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}

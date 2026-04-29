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
    title: 'File 2024/25 Self Assessment',
    description: 'Deadline: 31 Jan 2026. You have £45,000 in untaxed income to declare.',
    cta: 'Start Filing',
    ctaLink: '/payment',
    completed: false,
  },
  {
    id: '2',
    type: 'warning',
    title: 'Review Uncategorized Expenses',
    description: 'We found 5 transactions that look like business expenses but need your confirmation.',
    cta: 'Review Now',
    ctaLink: '/expenses',
    completed: false,
  },
  {
    id: '3',
    type: 'info',
    title: 'Connect Business Bank Account',
    description: 'Link your Monzo/Starling account to automate expense tracking.',
    cta: 'Connect Bank',
    ctaLink: '#', // Handled via onClick
    completed: false, 
  }
];

export default function Actions() {
  const router = useRouter();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Simulate fetching data from HMRC API
  useEffect(() => {
    const fetchActions = async () => {
      setTimeout(() => {
        setActions(MOCK_ACTIONS);
        setLoading(false);
      }, 1500);
    };
    fetchActions();
  }, []);

  const handleConnect = async (id: string) => {
    setConnectingId(id);
    // Simulate API call to bank provider (Plaid/TrueLayer)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setActions(prev => prev.map(action => 
      action.id === id ? { ...action, completed: true, title: 'Bank Account Connected', description: 'Monzo Business account linked successfully.' } : action
    ));
    setConnectingId(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800">Analyzing your tax profile...</h2>
        <p className="text-gray-600 mt-2">Checking deadlines and obligations with HMRC</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Action Plan</h1>
          <p className="mt-2 text-gray-600">
            Based on your HMRC data, here is your prioritized to-do list.
          </p>
        </div>

        <div className="space-y-6">
          {actions.map((action) => (
            <div 
              key={action.id} 
              className={`bg-white shadow-lg rounded-xl overflow-hidden border-l-8 transition-all hover:-translate-y-1 hover:shadow-xl ${
                action.completed ? 'border-green-500 opacity-60' : 
                action.type === 'urgent' ? 'border-red-500' : 
                action.type === 'warning' ? 'border-yellow-500' : 'border-blue-500'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {action.type === 'urgent' && !action.completed && (
                        <span className="bg-red-100 text-red-800 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide animate-pulse">
                          Urgent
                        </span>
                      )}
                      {action.type === 'warning' && !action.completed && (
                         <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                           Action Required
                         </span>
                      )}
                      <h3 className={`text-xl font-bold ${action.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {action.title}
                      </h3>
                    </div>
                    
                    <p className="text-gray-600 text-base mb-6 leading-relaxed">
                      {action.description}
                    </p>
                    
                    {!action.completed && (
                      action.ctaLink === '#' ? (
                        <button
                          onClick={() => handleConnect(action.id)}
                          disabled={connectingId === action.id}
                          className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 
                            ${connectingId === action.id ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}`}
                        >
                          {connectingId === action.id ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Connecting...
                            </span>
                          ) : (
                            <>{action.cta} &rarr;</>
                          )}
                        </button>
                      ) : (
                        <Link 
                          href={action.ctaLink}
                          className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            action.type === 'urgent' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 
                            'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                          }`}
                        >
                          {action.cta} &rarr;
                        </Link>
                      )
                    )}
                  </div>
                  
                  {/* Icon */}
                  <div className="ml-6 flex-shrink-0 self-center">
                    {action.completed ? (
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : action.type === 'urgent' ? (
                      <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
            <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-blue-600 hover:underline transition-colors">
                Skip to full dashboard overview
            </Link>
        </div>

      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Onboarding() {
  const router = useRouter();
  const [gatewayId, setGatewayId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gatewayId || !password) return;
    setLoading(true);
    setStatusText('Verifying credentials...');
    setTimeout(() => setStatusText('Connecting to HMRC securely...'), 1000);
    setTimeout(() => setStatusText('Fetching income records (P60, P45)...'), 2500);
    setTimeout(() => setStatusText('Calculating expenses...'), 4000);
    setTimeout(() => { router.push('/actions'); }, 5500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: '#FDFCF8' }}>
        <div className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin mb-6" style={{ borderColor: '#DDD5C8', borderTopColor: '#C4622D' }} />
        <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
          Please wait
        </h2>
        <p style={{ color: '#9A8F83' }}>{statusText}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4" style={{ backgroundColor: '#FDFCF8' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#C4622D', display: 'inline-block', marginBottom: '2rem' }}>
            EasyTax
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.75rem' }}>
            Link your HMRC Gateway
          </h1>
          <p style={{ color: '#9A8F83', fontSize: '0.95rem', lineHeight: 1.6 }}>
            We use your Government Gateway ID to fetch your tax records securely. Your credentials are never stored.
          </p>
        </div>

        <div className="p-8 rounded-2xl" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
          <form onSubmit={handleConnect} className="space-y-5">
            <div>
              <label htmlFor="gateway-id" className="block text-sm font-semibold mb-2" style={{ color: '#1C1208' }}>
                Gateway User ID
              </label>
              <input
                id="gateway-id"
                type="text"
                required
                placeholder="e.g. 1234567890"
                value={gatewayId}
                onChange={(e) => setGatewayId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                style={{ border: '1.5px solid #DDD5C8', backgroundColor: '#FDFCF8', color: '#1C1208' }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: '#1C1208' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                placeholder="Your HMRC password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                style={{ border: '1.5px solid #DDD5C8', backgroundColor: '#FDFCF8', color: '#1C1208' }}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-medium text-sm transition-all"
              style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}
            >
              Connect &amp; Fetch Data →
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: '#9A8F83' }}>
            Your data is encrypted and never stored permanently.
          </p>
        </div>
      </div>
    </div>
  );
}

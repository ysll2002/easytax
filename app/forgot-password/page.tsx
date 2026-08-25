'use client';
import { useState } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1.5px solid #DDD5C8',
    backgroundColor: '#FDFCF8',
    color: '#1C1208',
    fontSize: '0.875rem',
    outline: 'none',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const display = 'var(--font-display), Playfair Display, Georgia, serif';

  return (
    <div className="flex flex-col min-h-screen px-4" style={{ backgroundColor: '#FDFCF8' }}>
      <SiteHeader />
      <div className="flex flex-col items-center justify-center flex-1 py-12">
        <div className="w-full max-w-md">

          <div className="text-center mb-10">
            <h1 style={{ fontFamily: display, fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
              Reset your password
            </h1>
            <p style={{ color: '#9A8F83', fontSize: '0.95rem' }}>
              Enter your email and we&apos;ll send a reset link.
            </p>
          </div>

          <div className="p-8 rounded-2xl" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
            {done ? (
              <div className="text-center">
                <p className="text-sm font-semibold mb-2" style={{ color: '#1C1208' }}>Check your inbox</p>
                <p className="text-sm mb-6" style={{ color: '#4A4035' }}>
                  If an account exists for <strong>{email}</strong>, we&apos;ve sent a reset link. It expires in 1 hour.
                </p>
                <Link href="/login" className="text-sm font-semibold" style={{ color: '#C4622D' }}>
                  Back to login →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: '#1C1208' }}>
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {error && (
                  <p className="text-sm text-center py-2 px-3 rounded-lg" style={{ backgroundColor: '#F5E4D8', color: '#C4622D' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: loading ? '#DDD5C8' : '#C4622D',
                    color: '#FDFCF8',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending…
                    </>
                  ) : 'Send reset link →'}
                </button>

                <p className="text-center text-sm mt-4" style={{ color: '#9A8F83' }}>
                  Remembered it?{' '}
                  <Link href="/login" style={{ color: '#C4622D', fontWeight: 600 }}>
                    Back to login
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

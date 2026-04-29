'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    router.push('/actions');
  };

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4" style={{ backgroundColor: '#FDFCF8' }}>
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <Link href="/" style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#C4622D', display: 'inline-block', marginBottom: '2rem' }}>
            EasyTax
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
            Welcome back
          </h1>
          <p style={{ color: '#9A8F83', fontSize: '0.95rem' }}>
            Log in to your EasyTax account
          </p>
        </div>

        <div className="p-8 rounded-2xl" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
          <form onSubmit={handleLogin} className="space-y-5">
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

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-semibold" style={{ color: '#1C1208' }}>
                  Password
                </label>
                <Link href="#" className="text-xs" style={{ color: '#C4622D' }}>
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: loading ? '#DDD5C8' : '#C4622D', color: '#FDFCF8', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Logging in...
                </>
              ) : 'Log in →'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#9A8F83' }}>
            Don&apos;t have an account?{' '}
            <Link href="/onboarding" style={{ color: '#C4622D', fontWeight: 600 }}>
              Get started
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

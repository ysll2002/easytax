'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    await signIn('google', { callbackUrl: '/actions' });
  };

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

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-medium text-sm transition-all"
            style={{
              backgroundColor: '#FDFCF8',
              border: '1.5px solid #DDD5C8',
              color: '#1C1208',
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              opacity: googleLoading ? 0.7 : 1,
            }}
          >
            {googleLoading ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
            )}
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: '#DDD5C8' }} />
            <span className="text-xs" style={{ color: '#9A8F83' }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#DDD5C8' }} />
          </div>

          {/* Email / Password form */}
          <form onSubmit={handleLogin} className="space-y-4">
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
              style={{
                backgroundColor: loading ? '#DDD5C8' : '#C4622D',
                color: '#FDFCF8',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '0.25rem',
              }}
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
            <Link href="/register" style={{ color: '#C4622D', fontWeight: 600 }}>
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [agreed, setAgreed] = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!agreed) { setError('You must agree to the Terms & Conditions and Privacy Policy'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 8)       { setError('Password must be at least 8 characters'); return; }

    setLoading(true);
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });
    const data = await res.json();

    if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return; }

    // Auto sign in after registration
    await signIn('credentials', { email: form.email, password: form.password, callbackUrl: '/dashboard' });
  };

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
    border: '1.5px solid #DDD5C8', backgroundColor: '#FDFCF8', color: '#1C1208',
    fontSize: '0.875rem', outline: 'none',
  };

  return (
    <div className="flex flex-col min-h-screen px-4" style={{ backgroundColor: '#FDFCF8' }}>
      <SiteHeader />
      <div className="flex flex-col items-center justify-center flex-1 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
            Create your account
          </h1>
          <p style={{ color: '#9A8F83', fontSize: '0.95rem' }}>Start filing your taxes in minutes</p>
        </div>

        <div className="p-8 rounded-2xl" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
          {/* Google */}
          <button
            onClick={() => {
              if (!agreed) { setError('You must agree to the Terms & Conditions and Privacy Policy'); return; }
              setError('');
              signIn('google', { callbackUrl: '/dashboard' });
            }}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-medium text-sm mb-6"
            style={{ backgroundColor: '#FDFCF8', border: '1.5px solid #DDD5C8', color: '#1C1208' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* T&C consent */}
          <label className="flex items-start gap-3 mb-5 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => { setAgreed(e.target.checked); if (e.target.checked) setError(''); }}
              style={{ marginTop: '2px', width: '16px', height: '16px', flexShrink: 0, accentColor: '#C4622D', cursor: 'pointer' }}
            />
            <span className="text-sm" style={{ color: '#4A4035', lineHeight: '1.5' }}>
              I agree to the{' '}
              <Link href="/terms" style={{ color: '#C4622D', fontWeight: 600 }}>Terms &amp; Conditions</Link>
              {' '}and{' '}
              <Link href="/privacy" style={{ color: '#C4622D', fontWeight: 600 }}>Privacy Policy</Link>
            </span>
          </label>

          {error && <p className="text-sm py-2 px-3 rounded-lg mb-4" style={{ backgroundColor: '#F5E4D8', color: '#C4622D' }}>{error}</p>}

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ backgroundColor: '#DDD5C8' }} />
            <span className="text-xs" style={{ color: '#9A8F83' }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#DDD5C8' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1C1208' }}>Full name</label>
              <input type="text" required placeholder="Jane Doe" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1C1208' }}>Email address</label>
              <input type="email" required placeholder="you@example.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1C1208' }}>Password</label>
              <input type="password" required placeholder="Min. 8 characters" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1C1208' }}>Confirm password</label>
              <input type="password" required placeholder="Repeat password" value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} style={inputStyle} />
            </div>

            {error && agreed && <p className="text-sm py-2 px-3 rounded-lg" style={{ backgroundColor: '#F5E4D8', color: '#C4622D' }}>{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
              style={{ backgroundColor: loading ? '#DDD5C8' : '#C4622D', color: '#FDFCF8', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.25rem' }}>
              {loading ? 'Creating account...' : 'Create account →'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#9A8F83' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#C4622D', fontWeight: 600 }}>Log in</Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}

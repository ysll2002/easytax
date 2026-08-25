'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
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
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
      } else {
        router.push('/login?reset=1');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const display = 'var(--font-display), Playfair Display, Georgia, serif';

  if (!token) {
    return (
      <p className="text-center text-sm" style={{ color: '#C4622D' }}>
        Invalid reset link.{' '}
        <Link href="/forgot-password" style={{ fontWeight: 600 }}>Request a new one →</Link>
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: '#1C1208' }}>
          New password
        </label>
        <input
          id="password"
          type="password"
          required
          placeholder="Min. 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-semibold mb-2" style={{ color: '#1C1208' }}>
          Confirm new password
        </label>
        <input
          id="confirm"
          type="password"
          required
          placeholder="Repeat password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
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
            Saving…
          </>
        ) : 'Set new password →'}
      </button>
    </form>
  );
}

export default function ResetPassword() {
  const display = 'var(--font-display), Playfair Display, Georgia, serif';

  return (
    <div className="flex flex-col min-h-screen px-4" style={{ backgroundColor: '#FDFCF8' }}>
      <SiteHeader />
      <div className="flex flex-col items-center justify-center flex-1 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 style={{ fontFamily: display, fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
              Set a new password
            </h1>
            <p style={{ color: '#9A8F83', fontSize: '0.95rem' }}>
              Choose a new password for your EasyTax account.
            </p>
          </div>
          <div className="p-8 rounded-2xl" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
            <Suspense fallback={<p className="text-sm text-center" style={{ color: '#9A8F83' }}>Loading…</p>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Payment() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(resolve => setTimeout(resolve, 2000));
    router.push('/payment/success');
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

  const labelStyle = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#1C1208',
    marginBottom: '0.4rem',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16" style={{ backgroundColor: '#FDFCF8' }}>
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/dashboard" style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#C4622D', display: 'inline-block', marginBottom: '1.5rem' }}>
            EasyTax
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
            Secure Checkout
          </h1>
          <p style={{ color: '#9A8F83', fontSize: '0.9rem' }}>File your 2025/26 Self Assessment securely.</p>
        </div>

        {/* Order summary */}
        <div className="p-5 rounded-2xl mb-6" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium" style={{ color: '#4A4035' }}>Tax Filing Service</span>
            <span className="font-semibold" style={{ color: '#1C1208' }}>£20.00</span>
          </div>
          <div className="flex justify-between items-center text-sm" style={{ color: '#9A8F83', marginBottom: '0.75rem' }}>
            <span>VAT (20%)</span>
            <span>£4.00</span>
          </div>
          <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid #DDD5C8' }}>
            <span className="font-semibold" style={{ color: '#1C1208' }}>Total</span>
            <span style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#C4622D' }}>£24.00</span>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 rounded-2xl" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label htmlFor="card-number" style={labelStyle}>Card Number</label>
              <div className="relative">
                <input id="card-number" type="text" required placeholder="0000 0000 0000 0000" style={inputStyle} />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#9A8F83' }}>
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="expiry" style={labelStyle}>Expiry</label>
                <input id="expiry" type="text" required placeholder="MM / YY" style={inputStyle} />
              </div>
              <div className="flex-1">
                <label htmlFor="cvc" style={labelStyle}>CVC</label>
                <input id="cvc" type="text" required placeholder="123" style={inputStyle} />
              </div>
            </div>

            <div>
              <label htmlFor="name" style={labelStyle}>Name on Card</label>
              <input id="name" type="text" required placeholder="Jane Doe" style={inputStyle} />
            </div>

            {error && (
              <p className="text-sm text-center p-2 rounded-lg" style={{ backgroundColor: '#F5E4D8', color: '#C4622D' }}>{error}</p>
            )}

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
                  Processing...
                </>
              ) : 'Pay £24.00 & File Return →'}
            </button>
          </form>

          <p className="text-center text-xs mt-5" style={{ color: '#9A8F83' }}>
            Powered by Stripe &nbsp;·&nbsp; Secure SSL Encryption
          </p>
        </div>
      </div>
    </div>
  );
}

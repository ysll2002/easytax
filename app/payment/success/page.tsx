'use client';
import Link from 'next/link';

export default function Success() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4" style={{ backgroundColor: '#FDFCF8' }}>
      <div className="w-full max-w-md text-center">

        {/* Icon */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8" style={{ backgroundColor: '#E2EDE2' }}>
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="#6B8E6E">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2.5rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.75rem' }}>
          Return filed.
        </h1>
        <p style={{ color: '#9A8F83', marginBottom: '2rem' }}>
          Your Self Assessment has been submitted to HMRC.
        </p>

        {/* Next steps */}
        <div className="p-6 rounded-2xl text-left mb-6" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#1C1208' }}>What happens next</p>
          <ul className="space-y-2">
            {[
              'Your return has been queued for HMRC submission.',
              'You\'ll receive the official HMRC confirmation by email within 24 hours.',
              'A copy of your return is available in your dashboard.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: '#4A4035' }}>
                <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E2EDE2' }}>
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#6B8E6E">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs mb-8" style={{ color: '#9A8F83' }}>
          Order #TAX-2026-8842 &nbsp;·&nbsp; {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <Link
          href="/dashboard"
          className="inline-block w-full py-3.5 rounded-xl font-medium text-sm text-center transition-all"
          style={{ backgroundColor: '#1C1208', color: '#FDFCF8' }}
        >
          Return to Dashboard →
        </Link>
      </div>
    </div>
  );
}

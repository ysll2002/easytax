'use client';
import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFCF8' }}>

      <nav className="sticky top-0 z-10" style={{ backgroundColor: '#FDFCF8', borderBottom: '1px solid #DDD5C8' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#C4622D' }}>
            EasyTax
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm" style={{ color: '#9A8F83' }}>Gateway ID: 1234567890</span>
            <button className="text-sm font-medium transition-colors" style={{ color: '#9A8F83' }}>Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">

        <div className="mb-10">
          <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2.25rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
            Tax Year 2025/2026
          </h1>
          <p className="text-sm" style={{ color: '#9A8F83' }}>
            Data fetched from HMRC on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Summary grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Income (PAYE)', value: '£45,000', sub: null },
            { label: 'Self-Employment', value: '£12,000', sub: null },
            { label: 'Allowable Expenses', value: '−£3,500', sub: null, accent: '#C4622D' },
            { label: 'Tax Already Paid', value: '£6,500', sub: null, accent: '#6B8E6E' },
          ].map((item) => (
            <div key={item.label} className="p-5 rounded-2xl" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#9A8F83' }}>{item.label}</p>
              <p style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: item.accent || '#1C1208' }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tax due card */}
        <div className="p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6" style={{ backgroundColor: '#1C1208' }}>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#4A4035' }}>Total Tax Due</p>
            <p style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '3rem', fontWeight: 700, color: '#FDFCF8', lineHeight: 1 }}>
              £2,450
            </p>
            <p className="text-xs mt-2" style={{ color: '#C4622D' }}>Deadline: 31 Jan 2027</p>
          </div>
          <Link
            href="/payment"
            className="px-7 py-3.5 rounded-full font-medium text-sm transition-all flex-shrink-0"
            style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}
          >
            File &amp; Pay Now (£20) →
          </Link>
        </div>

        {/* Tip */}
        <div className="mt-6 p-5 rounded-2xl flex gap-4" style={{ backgroundColor: '#F5EDDC', border: '1px solid #C9963D30' }}>
          <span style={{ fontSize: '1.25rem', lineHeight: 1.5, flexShrink: 0 }}>💡</span>
          <p className="text-sm" style={{ color: '#4A4035', lineHeight: 1.6 }}>
            Based on your expenses, you could save an additional <strong>£250</strong> by claiming &lsquo;Use of Home as Office&rsquo;.{' '}
            <Link href="/expenses" style={{ color: '#C9963D', fontWeight: 600, textDecoration: 'underline' }}>
              Review expenses →
            </Link>
          </p>
        </div>

      </main>
    </div>
  );
}

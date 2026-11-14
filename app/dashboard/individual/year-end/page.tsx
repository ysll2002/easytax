import type { Metadata } from 'next';
import Link from 'next/link';
import { IS_HMRC_PRODUCTION } from '@/lib/hmrc-env';
import YearEndClient from './YearEndClient';

export const metadata: Metadata = {
  title: 'Year-end final declaration',
};

// Sandbox only until HMRC approves EasyTax for end-of-year functionality —
// app/api/hmrc/year-end refuses production requests on its own as well.
export default function YearEndPage() {
  if (IS_HMRC_PRODUCTION) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl">
        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.75rem' }}>
          Year-end final declaration
        </h1>
        <p className="text-sm mb-4" style={{ color: '#4A4035', lineHeight: 1.6 }}>
          EasyTax does not support end-of-year submission yet. To make your final declaration you will need to use other software —{' '}
          <a href="https://www.gov.uk/guidance/find-software-thats-compatible-with-making-tax-digital-for-income-tax"
            target="_blank" rel="noopener noreferrer" style={{ color: '#A04E1C', textDecoration: 'underline' }}>
            find compatible software on GOV.UK
          </a>.
        </p>
        <Link href="/dashboard/individual" className="text-sm" style={{ color: '#6B6256' }}>
          ← Back to Self Assessment
        </Link>
      </div>
    );
  }
  return <YearEndClient />;
}

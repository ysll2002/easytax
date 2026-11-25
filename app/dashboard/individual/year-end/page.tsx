import type { Metadata } from 'next';
import Link from 'next/link';
import { IS_HMRC_PRODUCTION } from '@/lib/hmrc-env';
import { yearEndApproved, anyEoyApproved } from '@/lib/hmrc-eoy/access';
import YearEndShell from './YearEndShell';

export const metadata: Metadata = {
  title: 'Year-end and other income',
};

// Year end for MTD Income Tax: the guided final declaration (and amendments),
// and every other end-of-year submission — property, employment, pensions,
// benefits, charges, expenses, losses and adjustments.
//
// Against the live API, each part works only once HMRC has approved EasyTax
// for it (lib/hmrc-eoy/access.ts); the APIs refuse unapproved calls on their
// own as well. ?clientId= is an agent working on a client's return.
export default async function YearEndPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
  const { clientId } = await searchParams;
  const backHref = clientId ? `/dashboard/agent/clients/${encodeURIComponent(clientId)}` : '/dashboard/individual';

  if (!anyEoyApproved()) {
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
        <Link href={backHref} className="text-sm" style={{ color: '#6B6256' }}>
          ← Back
        </Link>
      </div>
    );
  }
  return <YearEndShell clientId={clientId} sandbox={!IS_HMRC_PRODUCTION} declarationAvailable={yearEndApproved()} backHref={backHref} />;
}

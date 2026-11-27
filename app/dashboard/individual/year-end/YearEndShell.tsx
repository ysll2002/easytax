'use client';
import { useState } from 'react';
import Link from 'next/link';
import YearEndClient, { lastEndedTaxYear } from './YearEndClient';
import EoyWorkspace from './EoyWorkspace';

// Two views of the same tax year: the guided final declaration, and all the
// year-end data HMRC holds (every endpoint, grouped by subject).
export default function YearEndShell({ clientId, sandbox, declarationAvailable, backHref }: {
  clientId?: string; sandbox: boolean; declarationAvailable: boolean; backHref: string;
}) {
  const [taxYear, setTaxYear] = useState(lastEndedTaxYear());
  const [tab, setTab] = useState<'declare' | 'data'>(declarationAvailable ? 'declare' : 'data');
  const tabs: { key: 'declare' | 'data'; label: string }[] = [
    { key: 'declare', label: 'Final declaration' },
    { key: 'data',    label: 'All year-end data' },
  ];

  return (
    <div className="p-4 sm:p-8">
      <Link href={backHref} className="text-sm mb-6 inline-block" style={{ color: '#6B6256' }}>
        ← Back
      </Link>
      <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
        Year end
      </h1>
      {sandbox && (
        <p className="text-sm mb-4 p-3 rounded-xl max-w-2xl" style={{ backgroundColor: '#FEF3C7', color: '#713F12', border: '1px solid #E5CFA8' }}>
          <strong>HMRC sandbox.</strong> This uses HMRC&apos;s test service, so nothing here is a real tax return.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-4 mb-5">
        <div role="tablist" aria-label="Year-end views" className="flex gap-1" style={{ backgroundColor: '#F0EBE1', borderRadius: '2rem', padding: '0.25rem' }}>
          {tabs.map(t => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
              style={{ padding: '0.45rem 1rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: tab === t.key ? '#1C1208' : 'transparent', color: tab === t.key ? '#FDFCF8' : '#4A4035' }}>
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'data' && (
          <label className="text-sm" style={{ color: '#4A4035' }}>
            <span className="block font-medium mb-1">Tax year</span>
            <input type="text" inputMode="numeric" value={taxYear} onChange={e => setTaxYear(e.target.value.trim())}
              style={{ border: '1px solid #8A7F72', backgroundColor: '#FFFFFF', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', width: '7rem' }} />
          </label>
        )}
      </div>

      {tab === 'declare' ? (
        declarationAvailable
          ? <YearEndClient taxYear={taxYear} setTaxYear={setTaxYear} clientId={clientId} sandbox={sandbox} onOpenWorkspace={() => setTab('data')} />
          : <p className="text-sm max-w-2xl" style={{ color: '#4A4035', lineHeight: 1.6 }}>
              MTD Buddy is not yet approved by HMRC for the final declaration. To submit it, use{' '}
              <a href="https://www.gov.uk/guidance/find-software-thats-compatible-with-making-tax-digital-for-income-tax" target="_blank" rel="noopener noreferrer" style={{ color: '#A04E1C', textDecoration: 'underline' }}>other compatible software</a>.
            </p>
      ) : (
        <div className="max-w-4xl">
          <EoyWorkspace taxYear={taxYear} clientId={clientId} />
        </div>
      )}
    </div>
  );
}

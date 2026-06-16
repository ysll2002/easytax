import { auth } from '@/auth';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import PlaidLinkButton from '@/components/PlaidLinkButton';

export default async function BankingPage() {
  const session = await auth();
  void session;
  const t = await getTranslations('dashboard.banking');

  return (
    <div className="p-4 sm:p-8 max-w-xl">
      <Link href="/dashboard/individual" className="text-sm mb-6 inline-block" style={{ color: '#9A8F83' }}>{t('back')}</Link>

      <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
        {t('title')}
      </h1>
      <p style={{ color: '#9A8F83', marginBottom: '2rem', lineHeight: 1.6 }}>
        {t('subtitle')}
      </p>

      <div className="p-5 rounded-2xl mb-6 space-y-2" style={{ backgroundColor: '#E2EDE2', border: '1px solid #6B8E6E30' }}>
        <p className="text-sm font-semibold" style={{ color: '#1C1208' }}>{t('supportedBanks')}</p>
        {['Monzo Business', 'Starling Bank', 'Barclays', 'HSBC', 'NatWest', 'Lloyds', t('moreUkBanks')].map(b => (
          <div key={b} className="flex items-center gap-2 text-sm" style={{ color: '#4A4035' }}>
            <span style={{ color: '#6B8E6E' }}>✓</span> {b}
          </div>
        ))}
      </div>

      <PlaidLinkButton
        className="w-full text-center py-3.5 rounded-xl font-medium text-sm"
        style={{ backgroundColor: '#1C1208', color: '#FDFCF8', border: 'none' }}
      >
        {t('connect')}
      </PlaidLinkButton>

      <p className="text-xs text-center mt-4" style={{ color: '#9A8F83' }}>
        {t('poweredBy')}
      </p>
    </div>
  );
}

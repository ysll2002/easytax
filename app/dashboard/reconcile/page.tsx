import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import ReconcileClient from './ReconcileClient';

export default async function ReconcilePage() {
  const session = await auth();
  const profileId = session!.user.profileId;
  const t = await getTranslations('dashboard.reconcile');

  const { data: bank } = await supabase
    .from('bank_connections')
    .select('*')
    .eq('user_id', profileId)
    .single();

  if (!bank) {
    return (
      <div className="p-4 sm:p-8 max-w-xl">
        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
          {t('title')}
        </h1>
        <p style={{ color: '#9A8F83', marginBottom: '2rem', lineHeight: 1.7 }}>
          {t('intro')}
        </p>

        <div className="p-6 rounded-2xl" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: '#F5EDDC' }}>
              🏦
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>{t('noBankTitle')}</p>
              <p className="text-sm mb-4" style={{ color: '#9A8F83', lineHeight: 1.6 }}>
                {t('noBankBody')}
              </p>
              <Link
                href="/dashboard/tax/banking"
                className="inline-block px-5 py-2.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: '#C4622D', color: '#FDFCF8', textDecoration: 'none' }}
              >
                {t('connectBank')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <ReconcileClient accountName={bank.account_name} accountId={bank.account_id} />;
}

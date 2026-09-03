import { auth } from '@/auth';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ChevronRight, User, Building2, RefreshCw } from 'lucide-react';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import ActivationChecklist from '@/components/ActivationChecklist';

/** Which setup steps this user has completed. Errors are treated as "not
 *  connected": a failed lookup should show an extra nudge, never blank the
 *  dashboard. */
async function getActivationState(userId: string | undefined) {
  if (!userId) return { hmrcConnected: false, bankConnected: false };

  const [hmrc, bank] = await Promise.all([
    supabase.from('hmrc_connections').select('id', { head: true, count: 'exact' }).eq('user_id', userId),
    supabase.from('bank_connections').select('id', { head: true, count: 'exact' }).eq('user_id', userId),
  ]);

  return {
    hmrcConnected: (hmrc.count ?? 0) > 0,
    bankConnected: (bank.count ?? 0) > 0,
  };
}

export default async function DashboardHome() {
  const session = await auth();
  const t = await getTranslations('dashboard.home');
  const name = session?.user.name ?? session?.user.email ?? 'there';
  const firstName = name.split(' ')[0];
  const activation = await getActivationState(session?.user?.profileId);

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
          {t('welcome', { name: firstName })}
        </h1>
        <p style={{ color: '#9A8F83', fontSize: '0.9rem' }}>{t('question')}</p>
      </div>

      <ActivationChecklist
        hmrcConnected={activation.hmrcConnected}
        bankConnected={activation.bankConnected}
      />

      <div className="space-y-4 mb-8">
        {/* Self Assessment track */}
        <Link href="/dashboard/individual" style={{ textDecoration: 'none', display: 'block' }}>
          <div className="p-5 sm:p-6 rounded-2xl flex items-center gap-5 transition-all hover:shadow-md" style={{ backgroundColor: '#1C1208', border: '1px solid #2E2418' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#C4622D' }}>
              <User size={22} color="#FDFCF8" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>{t('soleKicker')}</p>
              <p style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.1rem', fontWeight: 700, color: '#FDFCF8', marginBottom: '0.25rem' }}>{t('soleTitle')}</p>
              <p className="text-xs" style={{ color: '#9A8F83', lineHeight: 1.5 }}>{t('soleDesc')}</p>
            </div>
            <ChevronRight size={18} color="#9A8F83" className="flex-shrink-0" />
          </div>
        </Link>

        {/* Company Tax track */}
        <Link href="/dashboard/company" style={{ textDecoration: 'none', display: 'block' }}>
          <div className="p-5 sm:p-6 rounded-2xl flex items-center gap-5 transition-all hover:shadow-md" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E8E2DA' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F0EBE1' }}>
              <Building2 size={22} color="#1C1208" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>{t('companyKicker')}</p>
              <p style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.1rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>{t('companyTitle')}</p>
              <p className="text-xs" style={{ color: '#9A8F83', lineHeight: 1.5 }}>{t('companyDesc')}</p>
            </div>
            <ChevronRight size={18} color="#C4622D" className="flex-shrink-0" />
          </div>
        </Link>
      </div>

      {/* Quick access */}
      <div style={{ borderTop: '1px solid #E8E2DA', paddingTop: '1.5rem' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9A8F83' }}>{t('quickAccess')}</p>
        <Link href="/dashboard/reconcile" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: 500, color: '#1C1208', backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
          <RefreshCw size={14} strokeWidth={1.8} />
          {t('reconcileTransactions')}
        </Link>
      </div>
    </div>
  );
}

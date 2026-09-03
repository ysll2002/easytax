import { auth } from '@/auth';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ChevronRight, User, Building2, RefreshCw, FlaskConical } from 'lucide-react';
import LaunchWaitlist from '@/components/LaunchWaitlist';

export default async function DashboardHome() {
  const session = await auth();
  const t = await getTranslations('dashboard.home');
  const name = session?.user.name ?? session?.user.email ?? 'there';
  const firstName = name.split(' ')[0];
  const email = session?.user.email ?? undefined;
  const isSandbox = (process.env.HMRC_ENV ?? 'sandbox') !== 'production';

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
          {t('welcome', { name: firstName })}
        </h1>
        <p style={{ color: '#9A8F83', fontSize: '0.9rem' }}>{t('question')}</p>
      </div>

      {/* Honest launch status. A user emailed in July asking why "Connect HMRC"
          showed test-user credentials — nothing on the dashboard said the app
          was still on HMRC's sandbox. Say so plainly, and turn the wait into a
          founder-price reservation. Disappears once HMRC_ENV=production. */}
      {isSandbox && (
        <div className="p-5 sm:p-6 rounded-2xl mb-8" style={{ backgroundColor: '#FBF1EA', border: '1px solid #E8C9B4' }}>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#C4622D' }}>
              <FlaskConical size={17} color="#FDFCF8" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm" style={{ color: '#1C1208' }}>Live HMRC filing opens soon — you&apos;re early</p>
              <p className="text-xs mt-1" style={{ color: '#4A4035', lineHeight: 1.6 }}>
                EasyTax is fully built and is currently connected to <strong>HMRC&apos;s test environment</strong> while HMRC completes its production review of our software. That&apos;s why &ldquo;Connect HMRC&rdquo; may show test credentials. Nothing you submit here reaches your real tax record yet. You can already connect your bank and let AI categorise your transactions so you&apos;re ready on day one.
              </p>
            </div>
          </div>
          <LaunchWaitlist source="dashboard" defaultEmail={email} buttonLabel="Email me when live filing opens · lock £24/filing" />
        </div>
      )}

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

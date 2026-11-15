import { auth } from '@/auth';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ChevronRight, User, Building2 } from 'lucide-react';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import FilingStatus from '@/components/FilingStatus';
import { IS_HMRC_PRODUCTION } from '@/lib/hmrc-env';
import { SHOW_COMPANY_TAX } from '@/lib/features';

/** Whether this address is already on the launch list, so the banner does not
 *  offer a subscription somebody has already taken. Any failure reads as "not
 *  subscribed": showing the button twice is a far smaller cost than hiding it
 *  from someone who has not signed up. */
async function isOnLaunchList(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  try {
    const { count } = await supabase
      .from('launch_subscribers')
      .select('id', { head: true, count: 'exact' })
      .eq('email', email.toLowerCase());
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

export default async function DashboardHome() {
  const session = await auth();
  const t = await getTranslations('dashboard.home');
  const name = session?.user.name ?? session?.user.email ?? 'there';
  const firstName = name.split(' ')[0];
  // The "filing is not open yet" banner only applies where filing really
  // is not open (the sandbox / staging); production filing opened on
  // 2026-11-11. And once someone has asked to be emailed, it has done its
  // job and is not shown again.
  const showFilingStatus = !IS_HMRC_PRODUCTION && !(await isOnLaunchList(session?.user?.email));

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
          {t('welcome', { name: firstName })}
        </h1>
        <p style={{ color: '#6B6256', fontSize: '0.9rem' }}>{t('question')}</p>
      </div>

      {showFilingStatus && <FilingStatus />}

      <div className="space-y-4 mb-8">
        {/* Self Assessment track */}
        <Link href="/dashboard/individual" style={{ textDecoration: 'none', display: 'block' }}>
          <div className="p-5 sm:p-6 rounded-2xl flex items-center gap-5 transition-all hover:shadow-md" style={{ backgroundColor: '#1C1208', border: '1px solid #2E2418' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#A04E1C' }}>
              <User size={22} color="#FDFCF8" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#A89D90' }}>{t('soleKicker')}</p>
              <p style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.1rem', fontWeight: 700, color: '#FDFCF8', marginBottom: '0.25rem' }}>{t('soleTitle')}</p>
              <p className="text-xs" style={{ color: '#A89D90', lineHeight: 1.5 }}>{t('soleDesc')}</p>
            </div>
            <ChevronRight size={18} color="#6B6256" className="flex-shrink-0" />
          </div>
        </Link>

        {/* Company Tax track */}
        {SHOW_COMPANY_TAX && <Link href="/dashboard/company" style={{ textDecoration: 'none', display: 'block' }}>
          <div className="p-5 sm:p-6 rounded-2xl flex items-center gap-5 transition-all hover:shadow-md" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E8E2DA' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F0EBE1' }}>
              <Building2 size={22} color="#1C1208" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#6B6256' }}>{t('companyKicker')}</p>
              <p style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.1rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>{t('companyTitle')}</p>
              <p className="text-xs" style={{ color: '#6B6256', lineHeight: 1.5 }}>{t('companyDesc')}</p>
            </div>
            <ChevronRight size={18} color="#A04E1C" className="flex-shrink-0" />
          </div>
        </Link>}
      </div>

    </div>
  );
}

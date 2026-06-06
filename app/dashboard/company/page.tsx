import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { Receipt, FileText, BarChart2, TrendingUp, RefreshCw, BookOpen, ChevronRight, CheckCircle2, Lock } from 'lucide-react';

export default async function CompanyPage() {
  const session = await auth();
  const profileId = session!.user.profileId;
  const t = await getTranslations('dashboard.company');
  const locale = await getLocale();

  const { data: hmrc } = await supabase
    .from('hmrc_connections')
    .select('vrn, access_token, connected_at')
    .eq('user_id', profileId)
    .single();

  const hasHmrc = !!hmrc?.access_token;
  const hasVrn  = !!hmrc?.vrn;

  const services: {
    icon: React.ElementType;
    label: string;
    desc: string;
    href?: string;
    status: 'available' | 'coming_soon' | 'locked';
    badge?: string;
  }[] = [
    {
      icon: Receipt,
      label: t('vatLabel'),
      desc: t('vatDesc'),
      href: '/dashboard/tax/vat',
      status: hasVrn ? 'available' : hasHmrc ? 'locked' : 'locked',
      badge: hasVrn ? undefined : t('vatBadge'),
    },
    {
      icon: TrendingUp,
      label: t('plLabel'),
      desc: t('plDesc'),
      href: '/dashboard/company/pl',
      status: 'available' as const,
    },
    {
      icon: BarChart2,
      label: t('balanceLabel'),
      desc: t('balanceDesc'),
      href: '/dashboard/company/balance-sheet',
      status: 'available' as const,
    },
    {
      icon: FileText,
      label: t('ct600Label'),
      desc: t('ct600Desc'),
      status: 'coming_soon' as const,
      badge: t('comingSoon'),
    },
    {
      icon: BookOpen,
      label: t('coaLabel'),
      desc: t('coaDesc'),
      href: '/dashboard/company/accounts',
      status: 'available' as const,
    },
    {
      icon: RefreshCw,
      label: t('reconcileLabel'),
      desc: t('reconcileDesc'),
      href: '/dashboard/reconcile',
      status: 'available' as const,
    },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm mb-4 inline-block" style={{ color: '#9A8F83', textDecoration: 'none' }}>
          {t('back')}
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
          {t('title')}
        </h1>
        <p style={{ color: '#9A8F83', fontSize: '0.9rem' }}>
          {t('subtitle')}
        </p>
      </div>

      {!hasHmrc && (
        <div className="p-5 rounded-2xl mb-6 flex items-start gap-4" style={{ backgroundColor: '#F5EDDC', border: '1px solid #C9963D30' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base" style={{ backgroundColor: '#F5EDDC', border: '1px solid #C9963D40' }}>⚠️</div>
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#1C1208' }}>{t('connectFirstTitle')}</p>
            <p className="text-xs mb-3" style={{ color: '#9A8F83', lineHeight: 1.6 }}>
              {t('connectFirstBody')}
            </p>
            <Link href="/dashboard/tax" className="inline-block px-4 py-2 rounded-full text-xs font-semibold" style={{ backgroundColor: '#1C1208', color: '#FDFCF8', textDecoration: 'none' }}>
              {t('connectHmrc')}
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {services.map(({ icon: Icon, label, desc, href, status, badge }) => {
          const isAvailable = status === 'available';
          const content = (
            <div
              className="flex items-center gap-4 p-5 rounded-2xl transition-all"
              style={{
                backgroundColor: isAvailable ? '#FFFFFF' : '#FAFAF9',
                border: `1.5px solid ${isAvailable ? '#DDD5C8' : '#EDEAE5'}`,
                opacity: status === 'locked' && !hasHmrc ? 0.6 : 1,
                cursor: isAvailable ? 'pointer' : 'default',
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: isAvailable ? '#F0EBE1' : '#F4F2EE' }}
              >
                <Icon size={20} color={isAvailable ? '#1C1208' : '#C0B8AF'} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-sm font-semibold" style={{ color: isAvailable ? '#1C1208' : '#A09890' }}>{label}</p>
                  {badge && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                      backgroundColor: status === 'coming_soon' ? '#F0EBE1' : '#F5EDDC',
                      color: status === 'coming_soon' ? '#9A8F83' : '#C9963D',
                    }}>
                      {badge}
                    </span>
                  )}
                  {isAvailable && hasVrn && <CheckCircle2 size={14} color="#6B8E6E" />}
                </div>
                <p className="text-xs" style={{ color: '#9A8F83', lineHeight: 1.5 }}>{desc}</p>
              </div>
              {isAvailable ? (
                <ChevronRight size={16} color="#C4622D" className="flex-shrink-0" />
              ) : status === 'locked' ? (
                <Lock size={14} color="#C0B8AF" className="flex-shrink-0" />
              ) : null}
            </div>
          );

          return isAvailable && href ? (
            <Link key={label} href={href} style={{ textDecoration: 'none', display: 'block' }}>
              {content}
            </Link>
          ) : (
            <div key={label}>{content}</div>
          );
        })}
      </div>

      {hasHmrc && (
        <div className="mt-8 pt-6 flex items-center gap-2" style={{ borderTop: '1px solid #E8E2DA' }}>
          <p className="text-xs" style={{ color: '#9A8F83' }}>
            {t('connectedHmrc')}
            {hmrc?.connected_at ? ` · ${new Date(hmrc.connected_at).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
          </p>
          {hasVrn && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#E2EDE2', color: '#6B8E6E' }}>{t('vrnRegistered')}</span>}
        </div>
      )}
    </div>
  );
}

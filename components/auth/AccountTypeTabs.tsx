'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LOGIN_PATH, REGISTER_PATH, type AccountType } from '@/lib/account-type';

// The switch at the top of the sign-in and sign-up pages between an
// individual account and an agent account. They are separate accounts (see
// lib/account-type.ts), so each tab is its own page.
export default function AccountTypeTabs({ current, mode }: { current: AccountType; mode: 'login' | 'register' }) {
  const t = useTranslations('accounts');
  const paths = mode === 'login' ? LOGIN_PATH : REGISTER_PATH;
  const tabs: { type: AccountType; label: string }[] = [
    { type: 'individual', label: t('tabIndividual') },
    { type: 'agent',      label: t('tabAgent') },
  ];
  return (
    <nav aria-label={t('tabsLabel')} className="mb-8">
      <div className="grid grid-cols-2 gap-1 p-1 rounded-full" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
        {tabs.map(tab => {
          const active = tab.type === current;
          return (
            <Link
              key={tab.type}
              href={paths[tab.type]}
              aria-current={active ? 'page' : undefined}
              className="text-center text-sm font-semibold py-2.5 px-3 rounded-full transition-colors"
              style={{
                backgroundColor: active ? '#1C1208' : 'transparent',
                color: active ? '#FDFCF8' : '#4A4035',
                textDecoration: 'none',
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

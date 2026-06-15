'use client';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';

export default function LogoutButton() {
  const t = useTranslations('dashboard.nav');
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #2E2418', color: '#4A4035', fontSize: '0.8rem', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left' }}
    >
      {t('logout')}
    </button>
  );
}

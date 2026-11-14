'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

// `compact` matches the language switcher's pill so the two sit on one row in
// the 240px dashboard sidebar.
export default function HomepageLink({ compact = false }: { compact?: boolean } = {}) {
  const t = useTranslations('dashboard.nav');
  return (
    <Link
      href="/"
      className={compact
        ? 'inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full'
        : 'text-sm font-medium px-5 py-2.5 rounded-full'}
      style={{
        backgroundColor: '#A04E1C',
        color: '#FDFCF8',
        textDecoration: 'none',
      }}
    >
      {t('homepage')}
    </Link>
  );
}

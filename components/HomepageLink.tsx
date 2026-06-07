'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function HomepageLink() {
  const t = useTranslations('dashboard.nav');
  return (
    <Link
      href="/"
      className="text-sm font-medium px-5 py-2.5 rounded-full"
      style={{
        backgroundColor: '#C4622D',
        color: '#FDFCF8',
        textDecoration: 'none',
      }}
    >
      {t('homepage')}
    </Link>
  );
}

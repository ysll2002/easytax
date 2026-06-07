'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Home } from 'lucide-react';

export default function HomepageLink() {
  const t = useTranslations('dashboard.nav');
  return (
    <Link
      href="/"
      aria-label={t('homepage')}
      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
      style={{
        backgroundColor: '#C4622D',
        color: '#FDFCF8',
        textDecoration: 'none',
      }}
    >
      <Home size={14} strokeWidth={2} />
      <span>{t('homepage')}</span>
    </Link>
  );
}

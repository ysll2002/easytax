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
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
      style={{
        color: '#4A4035',
        backgroundColor: '#F0EBE1',
        border: '1px solid #DDD5C8',
        textDecoration: 'none',
      }}
    >
      <Home size={13} strokeWidth={2} />
      <span>{t('homepage')}</span>
    </Link>
  );
}

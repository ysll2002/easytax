'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import TasksTimeline from '@/components/TasksTimeline';

// This page used to be a near-line-for-line copy of components/TasksTimeline:
// the same TYPE_ICON/TYPE_COLOR/STATUS_CONFIG tables, the same TaskCard, the
// same Group, the same fetch. Roughly 100 duplicated lines.
//
// That duplication is what made the language bug two bugs. The three error
// states were written as Chinese literals in both files, so fixing one would
// have left the other showing a Chinese red box on an English page. Now there
// is one component and one set of strings, all of them in `messages/`.
//
// The stats row is suppressed here because this page shows the same counts in
// its own header, beside the title.
export default function TasksPage() {
  const t = useTranslations('dashboard.tasks');

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <Link href="/dashboard/individual" className="text-sm mb-4 inline-block" style={{ color: '#9A8F83', textDecoration: 'none' }}>
        {t('back')}
      </Link>

      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(1.6rem, 5vw, 2rem)', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
          {t('pageTitle')}
        </h1>
        <p style={{ color: '#9A8F83', fontSize: '0.9rem' }}>{t('pageSubtitle')}</p>
      </div>

      <TasksTimeline />
    </div>
  );
}

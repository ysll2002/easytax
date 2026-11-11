'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import {
  CheckCircle2, AlertCircle, Clock, ChevronRight,
  FileText, Receipt, CreditCard, TrendingUp, CalendarClock,
} from 'lucide-react';
import type { Task, TaskType, TaskStatus } from '@/app/api/hmrc/tasks/route';
import { hmrcFetch } from '@/lib/hmrc-client';

// Every string a user can see here comes from `messages/`, and every date is
// formatted in the active locale.
//
// It did not before. The three error states were written in Chinese as
// literals while the rest of the component was English literals, so an
// English-speaking user who hit the NINO mismatch got a red box in Chinese on
// an otherwise English page. The same block existed twice — this file and
// app/dashboard/individual/tasks/page.tsx were near-identical copies, which is
// how one set of hardcoded strings became two. That page now renders this
// component instead of repeating it.
//
// The task titles are built here rather than taken from the API. The route
// returns `title` and `subtitle` as English prose, but it also returns the
// data those sentences were made of — `type`, `taxYear`, `periodStart`,
// `periodEnd` — so the label can be composed in whatever language the reader
// chose. Those two API fields are no longer what anyone sees.

const TYPE_ICON: Record<TaskType, React.ElementType> = {
  quarterly_mtd:     TrendingUp,
  sa_filing:         FileText,
  payment_balancing: CreditCard,
  payment_poa1:      CreditCard,
  payment_poa2:      CreditCard,
  vat_return:        Receipt,
};

const TYPE_COLOR: Record<TaskType, string> = {
  quarterly_mtd:     '#6B8E6E',
  sa_filing:         '#C4622D',
  payment_balancing: '#7C3AED',
  payment_poa1:      '#7C3AED',
  payment_poa2:      '#7C3AED',
  vat_return:        '#059669',
};

const STATUS_STYLE: Record<TaskStatus, { bg: string; color: string }> = {
  completed: { bg: '#E2EDE2', color: '#6B8E6E' },
  overdue:   { bg: '#FEE2E2', color: '#991B1B' },
  due_soon:  { bg: '#FEF3C7', color: '#92400E' },
  upcoming:  { bg: '#F0EBE1', color: '#9A8F83' },
};

const STATUS_KEY: Record<TaskStatus, string> = {
  completed: 'statusCompleted',
  overdue:   'statusOverdue',
  due_soon:  'statusDueSoon',
  upcoming:  'statusUpcoming',
};

const TITLE_KEY: Record<TaskType, string> = {
  quarterly_mtd:     'titleQuarterly',
  sa_filing:         'titleSaFiling',
  vat_return:        'titleVat',
  payment_poa1:      'titlePoa1',
  payment_poa2:      'titlePoa2',
  payment_balancing: 'titleBalancing',
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

/** BCP-47 tag for Intl. The app's locale codes are already valid tags; en is
 *  pinned to en-GB because these are UK tax dates and "11/12" should not flip. */
function intlLocale(locale: string): string {
  return locale === 'en' ? 'en-GB' : locale;
}

type T = ReturnType<typeof useTranslations>;

function fmtDate(iso: string, locale: string, withYear = true): string {
  return new Date(iso).toLocaleDateString(intlLocale(locale), {
    day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}),
  });
}

function taskTitle(task: Task, t: T, locale: string): string {
  const key = TITLE_KEY[task.type];
  if (task.type === 'quarterly_mtd' || task.type === 'vat_return') {
    const period = task.periodStart && task.periodEnd
      ? `${fmtDate(task.periodStart, locale, false)} – ${fmtDate(task.periodEnd, locale)}`
      : '';
    return period ? t(key, { period }) : t(key, { period: '' }).replace(/\s*·\s*$/, '');
  }
  return t(key);
}

function taskSubtitle(task: Task, t: T, locale: string): string | null {
  const date = fmtDate(task.dueDate, locale);
  switch (task.type) {
    case 'quarterly_mtd': return task.taxYear ? t('subQuarterly', { taxYear: task.taxYear }) : null;
    case 'sa_filing':     return task.taxYear ? t('subSaFiling', { taxYear: task.taxYear, date }) : null;
    case 'vat_return':    return t('subVat', { date });
    default:              return task.taxYear ? t('subPayment', { taxYear: task.taxYear, date }) : null;
  }
}

function TaskCard({ task }: { task: Task }) {
  const t = useTranslations('dashboard.tasks');
  const locale = useLocale();
  const Icon = TYPE_ICON[task.type];
  const iconColor = TYPE_COLOR[task.type];
  const st = STATUS_STYLE[task.status];
  const days = daysUntil(task.dueDate);
  const isPayment = task.type.startsWith('payment');
  const subtitle = taskSubtitle(task, t, locale);

  const timing = task.completedDate
    ? t('completedOn', { date: fmtDate(task.completedDate, locale) })
    : task.status === 'overdue'
    ? t('wasDue', { date: fmtDate(task.dueDate, locale, false), days: Math.abs(days) })
    : days >= 0 && days <= 90
    ? t('dueInDays', { date: fmtDate(task.dueDate, locale), days })
    : t('due', { date: fmtDate(task.dueDate, locale) });

  const card = (
    <div
      className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:shadow-sm"
      style={{
        backgroundColor: task.status === 'completed' ? '#FAFAF8' : '#FFFFFF',
        border: `1.5px solid ${task.status === 'overdue' ? '#FCA5A5' : task.status === 'due_soon' ? '#FDE68A' : '#E8E2DA'}`,
        opacity: task.status === 'completed' ? 0.75 : 1,
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconColor + '15' }}>
        {task.status === 'completed'
          ? <CheckCircle2 size={18} color={iconColor} strokeWidth={2} />
          : task.status === 'overdue'
          ? <AlertCircle size={18} color="#EF4444" strokeWidth={2} />
          : <Icon size={18} color={iconColor} strokeWidth={1.8} />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-sm font-semibold" style={{ color: task.status === 'completed' ? '#9A8F83' : '#1C1208' }}>
            {taskTitle(task, t, locale)}
          </p>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ backgroundColor: st.bg, color: st.color }}>
            {t(STATUS_KEY[task.status])}
          </span>
        </div>
        <p className="text-xs" style={{ color: '#9A8F83', lineHeight: 1.5 }}>{timing}</p>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: '#BDB5AA' }}>{subtitle}</p>}
      </div>

      <div className="flex-shrink-0">
        {task.status === 'completed' ? (
          isPayment
            ? <span className="text-xs" style={{ color: '#9A8F83' }}>{t('paid')}</span>
            : <ChevronRight size={14} color="#9A8F83" />
        ) : isPayment ? (
          <span className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ backgroundColor: '#7C3AED15', color: '#7C3AED', border: '1px solid #7C3AED30' }}>{t('pay')}</span>
        ) : (
          <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ backgroundColor: task.status === 'overdue' ? '#EF4444' : '#1C1208', color: '#FDFCF8' }}>
            {task.status === 'overdue' ? t('fixNow') : t('start')}
          </span>
        )}
      </div>
    </div>
  );

  if (isPayment && task.status !== 'completed') {
    return <a href="https://www.gov.uk/pay-self-assessment-tax-bill" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>{card}</a>;
  }
  if (task.actionHref) {
    return <Link href={task.actionHref} style={{ textDecoration: 'none', display: 'block' }}>{card}</Link>;
  }
  return <div>{card}</div>;
}

function Group({ title, icon, tasks, defaultOpen = true }: { title: string; icon: React.ReactNode; tasks: Task[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  if (tasks.length === 0) return null;
  return (
    <div className="mb-6">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 mb-3 w-full text-left">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9A8F83' }}>{title}</span>
        <span className="text-xs px-1.5 py-0.5 rounded-full ml-1" style={{ backgroundColor: '#F0EBE1', color: '#9A8F83' }}>{tasks.length}</span>
        <span className="ml-auto text-xs" style={{ color: '#BDB5AA' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="space-y-2">{tasks.map(t => <TaskCard key={t.id} task={t} />)}</div>}
    </div>
  );
}

/** The stats row and the four grouped lists. `showStats` is off on the
 *  standalone page, which puts the same counts in its header instead. */
export default function TasksTimeline({ showStats = true }: { showStats?: boolean } = {}) {
  const t = useTranslations('dashboard.tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // `hmrcFetch`, not bare `fetch`. This route reaches HMRC — it calls
    // getObligations() and getVatObligations() — so the request has to carry
    // `x-easytax-device-data`, which only hmrcFetch sets.
    //
    // A bare fetch was not obviously broken, because fraudHeaders() falls back
    // to the `hmrc_device` cookie and a same-site XHR does send it. But that
    // cookie is written with `max-age=3600`: an hour after the collector last
    // ran, it is gone, and this request would have reached
    // /organisations/vat/{vrn}/obligations with all nine Gov-Client-* device
    // headers empty. That is the first of the four endpoints in HMRC's FPH
    // review, and this was the last client-side caller on the site still
    // taking that path.
    hmrcFetch('/api/hmrc/tasks')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setTasks(d.tasks ?? []); })
      .catch(() => setError('UNREACHABLE'))
      .finally(() => setLoading(false));
  }, []);

  const overdue   = tasks.filter(t => t.status === 'overdue');
  const dueSoon   = tasks.filter(t => t.status === 'due_soon');
  const upcoming  = tasks.filter(t => t.status === 'upcoming');
  const completed = tasks.filter(t => t.status === 'completed');

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-8" style={{ color: '#9A8F83' }}>
        <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        {t('loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 rounded-2xl text-sm" style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5' }}>
        <div className="flex items-start gap-3">
          <AlertCircle size={18} color="#991B1B" className="flex-shrink-0 mt-0.5" />
          <div>
            {error === 'No HMRC connection' ? (
              <>
                <p className="font-semibold mb-1" style={{ color: '#991B1B' }}>{t('errNotConnectedTitle')}</p>
                <p style={{ color: '#7F1D1D' }}>
                  {t('errNotConnectedBody')}{' '}
                  <Link href="/dashboard/individual" style={{ color: '#C4622D' }}>{t('errNotConnectedCta')}</Link>
                </p>
              </>
            ) : error === 'NINO_MISMATCH' ? (
              <>
                <p className="font-semibold mb-1" style={{ color: '#991B1B' }}>{t('errNinoMismatchTitle')}</p>
                <p className="mb-3" style={{ color: '#7F1D1D', lineHeight: 1.6 }}>{t('errNinoMismatchBody')}</p>
                <Link href="/dashboard/individual" style={{ color: '#C4622D', fontWeight: 600 }}>{t('errNinoMismatchCta')}</Link>
              </>
            ) : (
              <>
                <p className="font-semibold mb-1" style={{ color: '#991B1B' }}>{t('errGenericTitle')}</p>
                {/* `error` is HMRC's own code (e.g. MATCHING_RESOURCE_NOT_FOUND) or
                    our sentinel for a dead connection — not prose, so it is not
                    translated. UNREACHABLE is ours and does have a message. */}
                <p style={{ color: '#7F1D1D' }}>{error === 'UNREACHABLE' ? t('errUnreachable') : error}</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="p-6 rounded-2xl text-center" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
        <CalendarClock size={32} color="#9A8F83" className="mx-auto mb-3" />
        <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>{t('emptyTitle')}</p>
        <p className="text-sm" style={{ color: '#9A8F83' }}>{t('emptyBody')}</p>
      </div>
    );
  }

  return (
    <div>
      {showStats && (
        <div className="flex gap-4 mb-6">
          {overdue.length > 0 && (
            <div className="text-center">
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#EF4444', lineHeight: 1 }}>{overdue.length}</p>
              <p style={{ fontSize: '0.65rem', color: '#9A8F83' }}>{t('statOverdue')}</p>
            </div>
          )}
          <div className="text-center">
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6B8E6E', lineHeight: 1 }}>{completed.length}</p>
            <p style={{ fontSize: '0.65rem', color: '#9A8F83' }}>{t('statDone')}</p>
          </div>
          <div className="text-center">
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1C1208', lineHeight: 1 }}>{upcoming.length + dueSoon.length}</p>
            <p style={{ fontSize: '0.65rem', color: '#9A8F83' }}>{t('statUpcoming')}</p>
          </div>
        </div>
      )}
      <Group title={t('groupOverdue')}  icon={<AlertCircle   size={14} color="#EF4444" />} tasks={overdue}   />
      <Group title={t('groupDueSoon')}  icon={<Clock         size={14} color="#F59E0B" />} tasks={dueSoon}   />
      <Group title={t('groupUpcoming')} icon={<CalendarClock size={14} color="#9A8F83" />} tasks={upcoming}  />
      <Group title={t('groupCompleted')} icon={<CheckCircle2 size={14} color="#6B8E6E" />} tasks={completed} defaultOpen={false} />
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, AlertCircle, Clock, ChevronRight,
  FileText, Receipt, CreditCard, TrendingUp, CalendarClock,
} from 'lucide-react';
import type { Task, TaskType, TaskStatus } from '@/app/api/hmrc/tasks/route';

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

const STATUS_CONFIG: Record<TaskStatus, { label: string; bg: string; color: string }> = {
  completed: { label: 'Completed', bg: '#E2EDE2', color: '#6B8E6E' },
  overdue:   { label: 'Overdue',   bg: '#FEE2E2', color: '#991B1B' },
  due_soon:  { label: 'Due soon',  bg: '#FEF3C7', color: '#92400E' },
  upcoming:  { label: 'Upcoming',  bg: '#F0EBE1', color: '#9A8F83' },
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function TaskCard({ task }: { task: Task }) {
  const Icon = TYPE_ICON[task.type];
  const iconColor = TYPE_COLOR[task.type];
  const st = STATUS_CONFIG[task.status];
  const days = daysUntil(task.dueDate);
  const isPayment = task.type.startsWith('payment');

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
            {task.title}
          </p>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ backgroundColor: st.bg, color: st.color }}>
            {st.label}
          </span>
        </div>
        <p className="text-xs" style={{ color: '#9A8F83', lineHeight: 1.5 }}>
          {task.completedDate
            ? `Completed ${new Date(task.completedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
            : task.status === 'overdue'
            ? `Was due ${new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${Math.abs(days)} days ago`
            : `Due ${new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}${days >= 0 && days <= 90 ? ` · ${days} days` : ''}`
          }
        </p>
        {task.subtitle && (
          <p className="text-xs mt-0.5" style={{ color: '#BDB5AA' }}>{task.subtitle}</p>
        )}
      </div>

      <div className="flex-shrink-0">
        {task.status === 'completed' ? (
          isPayment
            ? <span className="text-xs" style={{ color: '#9A8F83' }}>Paid</span>
            : <ChevronRight size={14} color="#9A8F83" />
        ) : isPayment ? (
          <span className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ backgroundColor: '#7C3AED15', color: '#7C3AED', border: '1px solid #7C3AED30' }}>Pay →</span>
        ) : (
          <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ backgroundColor: task.status === 'overdue' ? '#EF4444' : '#1C1208', color: '#FDFCF8' }}>
            {task.status === 'overdue' ? 'Fix now' : 'Start →'}
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/hmrc/tasks')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setTasks(d.tasks ?? []); })
      .catch(() => setError('Could not reach HMRC'))
      .finally(() => setLoading(false));
  }, []);

  const overdue   = tasks.filter(t => t.status === 'overdue');
  const dueSoon   = tasks.filter(t => t.status === 'due_soon');
  const upcoming  = tasks.filter(t => t.status === 'upcoming');
  const completed = tasks.filter(t => t.status === 'completed');

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <Link href="/dashboard/tax" className="text-sm mb-4 inline-block" style={{ color: '#9A8F83', textDecoration: 'none' }}>← Self Assessment</Link>

      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
            Tax Tasks
          </h1>
          <p style={{ color: '#9A8F83', fontSize: '0.9rem' }}>Your HMRC obligations — past year &amp; next 12 months.</p>
        </div>
        {!loading && tasks.length > 0 && (
          <div className="flex gap-4 flex-shrink-0">
            {overdue.length > 0 && (
              <div className="text-center">
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#EF4444', lineHeight: 1 }}>{overdue.length}</p>
                <p style={{ fontSize: '0.65rem', color: '#9A8F83' }}>overdue</p>
              </div>
            )}
            <div className="text-center">
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6B8E6E', lineHeight: 1 }}>{completed.length}</p>
              <p style={{ fontSize: '0.65rem', color: '#9A8F83' }}>done</p>
            </div>
            <div className="text-center">
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1C1208', lineHeight: 1 }}>{upcoming.length + dueSoon.length}</p>
              <p style={{ fontSize: '0.65rem', color: '#9A8F83' }}>upcoming</p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-12" style={{ color: '#9A8F83' }}>
          <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          Analysing your HMRC obligations…
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 p-4 rounded-xl text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
          <AlertCircle size={16} />
          {error === 'No HMRC connection'
            ? <span>Connect HMRC first. <Link href="/dashboard/tax" style={{ color: '#C4622D' }}>Self Assessment →</Link></span>
            : error}
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-6 rounded-2xl text-center" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
          <CalendarClock size={32} color="#9A8F83" className="mx-auto mb-3" />
          <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>No obligations found</p>
          <p className="text-sm" style={{ color: '#9A8F83' }}>HMRC hasn&apos;t issued any obligations yet.</p>
        </div>
      ) : (
        <>
          <Group title="Overdue"               icon={<AlertCircle  size={14} color="#EF4444" />} tasks={overdue}  />
          <Group title="Due soon · 14 days"    icon={<Clock        size={14} color="#F59E0B" />} tasks={dueSoon} />
          <Group title="Upcoming"              icon={<CalendarClock size={14} color="#9A8F83" />} tasks={upcoming} />
          <Group title="Completed"             icon={<CheckCircle2 size={14} color="#6B8E6E" />} tasks={completed} defaultOpen={false} />
        </>
      )}
    </div>
  );
}

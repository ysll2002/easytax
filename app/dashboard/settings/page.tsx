import Link from 'next/link';
import { auth } from '@/auth';
import { getLocale } from 'next-intl/server';
import { Bell, Download, ShieldCheck, Mail } from 'lucide-react';
import DeleteAccountCard from '@/components/DeleteAccountCard';
import { getNextDeadline, formatDeadlineDate, formatPeriod } from '@/lib/mtd-deadlines';

// Settings used to show three decorative toggles ("Two-factor authentication",
// "Data sharing"…) that did nothing. Everything on this page now reflects what
// the product actually does.

const display = 'var(--font-display), Playfair Display, Georgia, serif';

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user;
  const locale = await getLocale();
  const next = getNextDeadline();

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <h1 style={{ fontFamily: display, fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
        Settings
      </h1>
      <p style={{ color: '#9A8F83', marginBottom: '2rem' }}>Your account, notifications and data.</p>

      <div className="space-y-4">
        {/* Account */}
        <section className="p-5 sm:p-6 rounded-2xl" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9A8F83' }}>Account</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p style={{ color: '#9A8F83', fontSize: '0.75rem' }}>Name</p>
              <p style={{ color: '#1C1208', fontWeight: 600 }}>{user?.name ?? '—'}</p>
            </div>
            <div className="min-w-0">
              <p style={{ color: '#9A8F83', fontSize: '0.75rem' }}>Email</p>
              <p className="truncate" style={{ color: '#1C1208', fontWeight: 600 }}>{user?.email ?? '—'}</p>
            </div>
          </div>
          <p className="text-xs mt-4" style={{ color: '#9A8F83', lineHeight: 1.6 }}>
            Tax identifiers (NINO) live on your <Link href="/dashboard/profile" style={{ color: '#C4622D' }}>Profile</Link>. To change your email or name, contact <a href="mailto:hello@easytax.vip" style={{ color: '#C4622D' }}>hello@easytax.vip</a>.
          </p>
        </section>

        {/* Notifications */}
        <section className="p-5 sm:p-6 rounded-2xl flex gap-4" style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F0EBE1' }}>
            <Bell size={18} color="#C4622D" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm" style={{ color: '#1C1208' }}>Deadline reminders — on</p>
            <p className="text-xs mt-1" style={{ color: '#4A4035', lineHeight: 1.6 }}>
              We email you two weeks before every MTD ITSA quarterly deadline. Next: <strong>Q{next.quarter}</strong> ({formatPeriod(next, locale)}) due <strong>{formatDeadlineDate(next.due, locale)}</strong> — {next.daysLeft} days away. No marketing emails, ever.
            </p>
          </div>
        </section>

        {/* Security */}
        <section className="p-5 sm:p-6 rounded-2xl flex gap-4" style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F0EBE1' }}>
            <ShieldCheck size={18} color="#6B8E6E" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm" style={{ color: '#1C1208' }}>How your data is protected</p>
            <ul className="text-xs mt-1 space-y-1" style={{ color: '#4A4035', lineHeight: 1.6, paddingLeft: '1rem' }}>
              <li>HMRC access is via Government Gateway OAuth — we never see or store your Gateway password.</li>
              <li>Bank access is read-only Open Banking (Plaid). EasyTax cannot move money.</li>
              <li>Passwords are hashed with bcrypt and never stored in plain text; your data sits in a Supabase Postgres database encrypted at rest.</li>
              <li>Two-factor authentication is not yet available; if you signed in with Google, Google&apos;s 2FA protects your login.</li>
            </ul>
          </div>
        </section>

        {/* Export */}
        <section className="p-5 sm:p-6 rounded-2xl flex gap-4" style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F0EBE1' }}>
            <Download size={18} color="#1C1208" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm" style={{ color: '#1C1208' }}>Export your data</p>
            <p className="text-xs mt-1 mb-3" style={{ color: '#4A4035', lineHeight: 1.6 }}>
              Download a JSON archive of everything we hold on you — profile, tax IDs, filings, bank connections.
            </p>
            <a href="/api/profile/export" className="inline-flex items-center px-5 rounded-full text-sm font-medium" style={{ minHeight: 44, backgroundColor: '#1C1208', color: '#FDFCF8', textDecoration: 'none' }}>
              Download export
            </a>
          </div>
        </section>

        <DeleteAccountCard />

        {/* Help */}
        <section className="p-5 sm:p-6 rounded-2xl flex gap-4" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FDFCF8' }}>
            <Mail size={18} color="#C4622D" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm" style={{ color: '#1C1208' }}>Need a hand?</p>
            <p className="text-xs mt-1" style={{ color: '#4A4035', lineHeight: 1.6 }}>
              Email <a href="mailto:hello@easytax.vip" style={{ color: '#C4622D' }}>hello@easytax.vip</a> — a human replies, usually within one working day.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

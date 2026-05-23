'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, RefreshCw, Building2, User, Settings } from 'lucide-react';

const groups = [
  {
    label: 'Personal',
    items: [
      { href: '/dashboard/tax',       label: 'Self Assessment', icon: FileText },
      { href: '/dashboard/reconcile', label: 'Reconcile',       icon: RefreshCw },
    ],
  },
  {
    label: 'Company',
    items: [
      { href: '/dashboard/company',   label: 'Company Tax', icon: Building2 },
      { href: '/dashboard/reconcile', label: 'Reconcile',   icon: RefreshCw },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/dashboard/profile',  label: 'Profile',  icon: User },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav style={{ flex: 1, padding: '0 0.75rem', overflowY: 'auto' }}>
      {groups.map((group, gi) => (
        <div key={group.label} style={{ marginBottom: gi < groups.length - 1 ? '1.25rem' : 0 }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4A4035', padding: '0 0.75rem', marginBottom: '0.35rem' }}>
            {group.label}
          </p>
          {group.items.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.65rem 0.75rem', borderRadius: '0.75rem',
                  color: active ? '#FF6B35' : '#9A8F83',
                  backgroundColor: active ? '#2E2418' : 'transparent',
                  fontSize: '0.875rem', fontWeight: active ? 600 : 500,
                  marginBottom: '0.15rem', textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
                className={active ? '' : 'hover:bg-white/5 hover:text-[#FDFCF8]'}
              >
                <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/dashboard/tax',       label: 'Tax Filing',  icon: '📄' },
  { href: '/dashboard/reconcile', label: 'Reconcile',   icon: '🔁' },
  { href: '/dashboard/fph-test',  label: 'FPH Test',    icon: '🔒' },
  { href: '/dashboard/profile',   label: 'Profile',     icon: '👤' },
  { href: '/dashboard/settings',  label: 'Settings',    icon: '⚙️'  },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav style={{ flex: 1, padding: '0 0.75rem' }}>
      {nav.map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 0.75rem', borderRadius: '0.75rem',
              color: active ? '#C4622D' : '#9A8F83',
              backgroundColor: active ? '#2E2418' : 'transparent',
              fontSize: '0.9rem', fontWeight: active ? 600 : 500,
              marginBottom: '0.25rem', textDecoration: 'none',
              transition: 'all 0.15s',
            }}
            className={active ? '' : 'hover:bg-white/5 hover:text-[#FDFCF8]'}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

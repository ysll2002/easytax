'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/dashboard/individual',       label: 'Tax Filing',  icon: '📄' },
  { href: '/dashboard/reconcile', label: 'Reconcile',   icon: '🔁' },
  { href: '/dashboard/fph-test',  label: 'FPH Test',    icon: '🔒' },
  { href: '/dashboard/profile',   label: 'Profile',     icon: '👤' },
  { href: '/dashboard/settings',  label: 'Settings',    icon: '⚙️'  },
];

export default function DashboardNav() {
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
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 0.75rem',
              borderRadius: '0.75rem',
              color: active ? '#FDFCF8' : '#9A8F83',
              backgroundColor: active ? '#ffffff14' : 'transparent',
              fontSize: '0.9rem',
              fontWeight: active ? 600 : 500,
              marginBottom: '0.25rem',
              textDecoration: 'none',
            }}
            className="hover:bg-white/5 hover:text-[#FDFCF8] transition-colors"
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

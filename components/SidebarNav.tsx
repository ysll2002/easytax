'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, RefreshCw, Shield, User, Settings } from 'lucide-react';

const nav = [
  { href: '/dashboard/tax',       label: 'Tax Filing', icon: FileText },
  { href: '/dashboard/reconcile', label: 'Reconcile',  icon: RefreshCw },
  { href: '/dashboard/fph-test',  label: 'FPH Test',   icon: Shield },
  { href: '/dashboard/profile',   label: 'Profile',    icon: User },
  { href: '/dashboard/settings',  label: 'Settings',   icon: Settings },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav style={{ flex: 1, padding: '0 0.75rem' }}>
      {nav.map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 0.75rem', borderRadius: '0.75rem',
              color: active ? '#FF6B35' : '#9A8F83',
              backgroundColor: active ? '#2E2418' : 'transparent',
              fontSize: '0.9rem', fontWeight: active ? 600 : 500,
              marginBottom: '0.25rem', textDecoration: 'none',
              transition: 'all 0.15s',
            }}
            className={active ? '' : 'hover:bg-white/5 hover:text-[#FDFCF8]'}
          >
            <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

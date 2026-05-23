'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Building2, RefreshCw, User, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

const nav = [
  { href: '/dashboard/tax',       label: 'Self Assess', icon: FileText },
  { href: '/dashboard/company',   label: 'Company',     icon: Building2 },
  { href: '/dashboard/reconcile', label: 'Reconcile',   icon: RefreshCw },
  { href: '/dashboard/profile',   label: 'Profile',     icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
      backgroundColor: '#1C1208', borderTop: '1px solid #2E2418',
      display: 'flex', alignItems: 'stretch',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {nav.map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 3, padding: '10px 4px',
            color: active ? '#FF6B35' : '#9A8F83', textDecoration: 'none',
          }}>
            <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
            <span style={{ fontSize: '0.6rem', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>{item.label}</span>
          </Link>
        );
      })}
      <button onClick={() => signOut({ callbackUrl: '/' })} style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 3, padding: '10px 4px',
        color: '#9A8F83', background: 'none', border: 'none', cursor: 'pointer',
      }}>
        <LogOut size={20} strokeWidth={1.8} />
        <span style={{ fontSize: '0.6rem' }}>Log out</span>
      </button>
    </nav>
  );
}

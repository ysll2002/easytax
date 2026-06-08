import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DeviceDataCollector from '@/components/DeviceDataCollector';
import SidebarNav from '@/components/SidebarNav';
import LogoutButton from '@/components/LogoutButton';
import MobileNav from '@/components/MobileNav';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import HomepageLink from '@/components/HomepageLink';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  const user = session.user;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FDFCF8' }}>

      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex" style={{ width: '240px', flexShrink: 0, backgroundColor: '#1C1208', flexDirection: 'column', padding: '1.5rem 0', position: 'sticky', top: 0, height: '100vh' }}>
        <Link href="/dashboard" style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#C4622D', padding: '0 1.5rem', marginBottom: '2.5rem', display: 'block' }}>
          EasyTax
        </Link>

        <SidebarNav />

        <div style={{ padding: '0 1.5rem', borderTop: '1px solid #2E2418', paddingTop: '1.25rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            {user.image ? (
              <img src={user.image} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FDFCF8', fontSize: '0.875rem', fontWeight: 600 }}>
                {user.name?.charAt(0) ?? user.email?.charAt(0) ?? '?'}
              </div>
            )}
            <div style={{ overflow: 'hidden' }}>
              <p style={{ color: '#FDFCF8', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name ?? 'User'}</p>
              <p style={{ color: '#4A4035', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
            </div>
          </div>

          <LogoutButton />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex md:hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40, backgroundColor: '#1C1208', padding: '0 1rem', height: '52px', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/dashboard" style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.1rem', fontWeight: 700, color: '#C4622D', textDecoration: 'none' }}>
          EasyTax
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LanguageSwitcher />
          <HomepageLink />
        </div>
      </div>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', paddingTop: 0, position: 'relative' }}>
        {/* Desktop floating top-right controls */}
        <div className="hidden md:flex" style={{ position: 'absolute', top: '1.25rem', right: '1.5rem', zIndex: 30, gap: '0.5rem' }}>
          <LanguageSwitcher />
          <HomepageLink />
        </div>
        {/* Mobile top spacer */}
        <div className="md:hidden" style={{ height: '52px' }} />
        <DeviceDataCollector />
        {children}
        {/* Mobile bottom spacer */}
        <div className="md:hidden" style={{ height: '72px' }} />
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  );
}

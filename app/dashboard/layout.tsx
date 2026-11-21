import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import DeviceDataCollector from '@/components/DeviceDataCollector';
import SidebarNav from '@/components/SidebarNav';
import LogoutButton from '@/components/LogoutButton';
import MobileNav from '@/components/MobileNav';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import HomepageLink from '@/components/HomepageLink';
import { AGENT_MODE_AVAILABLE } from '@/lib/agent';
import { asAccountType } from '@/lib/account-type';

// Default <title> for dashboard pages (WCAG 2.4.2); each route's own layout
// overrides it.
export const metadata: Metadata = {
  title: { default: 'Dashboard', template: '%s | EasyTax' },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  const user = session.user;
  // Agent accounts get the agent dashboard only where agent mode is open.
  const accountType = AGENT_MODE_AVAILABLE ? asAccountType(user.accountType) : 'individual';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FDFCF8' }}>

      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex" style={{ width: '240px', flexShrink: 0, backgroundColor: '#1C1208', flexDirection: 'column', padding: '1.5rem 0', position: 'sticky', top: 0, height: '100vh' }}>
        <Link href={accountType === 'agent' ? '/dashboard/agent' : '/dashboard'} style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#E8895A', padding: '0 1.5rem', marginBottom: '1rem', display: 'block' }}>
          EasyTax
        </Link>

        {/* Language and Homepage live in the sidebar on desktop. They used to
            float absolutely over the top-right of <main>, where they sat on top
            of any page whose header has its own right-hand buttons (Records:
            "Add a record", "Import CSV statement"). Here they cannot overlap
            page content, and the language menu has room to open downwards. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', padding: '0 1.5rem', marginBottom: '2rem' }}>
          <LanguageSwitcher align="left" />
          <HomepageLink compact />
        </div>

        <SidebarNav accountType={accountType} />

        <div style={{ padding: '0 1.5rem', borderTop: '1px solid #2E2418', paddingTop: '1.25rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            {user.image ? (
              <img src={user.image} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#A04E1C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FDFCF8', fontSize: '0.875rem', fontWeight: 600 }}>
                {user.name?.charAt(0) ?? user.email?.charAt(0) ?? '?'}
              </div>
            )}
            <div style={{ overflow: 'hidden' }}>
              <p style={{ color: '#FDFCF8', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name ?? 'User'}</p>
              <p style={{ color: '#A89D90', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
            </div>
          </div>

          <LogoutButton />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex md:hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40, backgroundColor: '#1C1208', padding: '0 1rem', height: '52px', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/dashboard" style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.1rem', fontWeight: 700, color: '#E8895A', textDecoration: 'none' }}>
          EasyTax
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LanguageSwitcher />
          <HomepageLink />
        </div>
      </div>

      {/* Main content */}
      <main id="main-content" style={{ flex: 1, overflow: 'auto', paddingTop: 0, position: 'relative' }}>
        {/* Mobile top spacer */}
        <div className="md:hidden" style={{ height: '52px' }} />
        <DeviceDataCollector />
        {children}
        {/* The site-wide scope notices that used to sit here (unsupported income
            types; end-of-year not supported) were removed on request. The
            end-of-year signposting HMRC requires of in-year-only software still
            appears where it applies: Step 4 of the Tasks wizard. */}
        <footer style={{ padding: '2rem 1.5rem 3rem', borderTop: '1px solid #EEE4D3', marginTop: '3rem', color: '#6B6256', fontSize: '0.75rem', lineHeight: 1.5 }}>
          <div style={{ maxWidth: '52rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p>
              <Link href="/accessibility" style={{ color: '#A04E1C', textDecoration: 'underline' }}>Accessibility statement</Link>
            </p>
          </div>
        </footer>
        {/* Mobile bottom spacer */}
        <div className="md:hidden" style={{ height: '72px' }} />
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <MobileNav accountType={accountType} />
      </div>
    </div>
  );
}

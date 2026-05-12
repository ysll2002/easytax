import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DeviceDataCollector from '@/components/DeviceDataCollector';
import SidebarNav from '@/components/SidebarNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  const user = session.user;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FDFCF8' }}>

      {/* Sidebar */}
      <aside style={{ width: '240px', flexShrink: 0, backgroundColor: '#1C1208', display: 'flex', flexDirection: 'column', padding: '1.5rem 0', position: 'sticky', top: 0, height: '100vh' }}>
        <Link href="/dashboard" style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#C4622D', padding: '0 1.5rem', marginBottom: '2.5rem', display: 'block' }}>
          EasyTax
        </Link>

        <SidebarNav />

        {/* User + log out */}
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
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }); }}>
            <button type="submit" style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #2E2418', color: '#4A4035', fontSize: '0.8rem', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
              Log out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <DeviceDataCollector />
        {children}
      </main>
    </div>
  );
}

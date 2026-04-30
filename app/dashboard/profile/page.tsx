import { auth } from '@/auth';

export default async function ProfilePage() {
  const session = await auth();
  const user = session!.user;

  return (
    <div className="p-8 max-w-2xl">
      <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
        Profile
      </h1>
      <p style={{ color: '#9A8F83', marginBottom: '2rem' }}>Manage your personal information</p>

      <div className="p-6 rounded-2xl space-y-5" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
        <div className="flex items-center gap-4 pb-5" style={{ borderBottom: '1px solid #DDD5C8' }}>
          {user.image ? (
            <img src={user.image} alt="" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FDFCF8', fontSize: '1.5rem', fontWeight: 600 }}>
              {user.name?.charAt(0) ?? '?'}
            </div>
          )}
          <div>
            <p style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontWeight: 700, fontSize: '1.1rem', color: '#1C1208' }}>{user.name}</p>
            <p style={{ color: '#9A8F83', fontSize: '0.875rem' }}>{user.email}</p>
          </div>
        </div>

        {[
          { label: 'Full name', value: user.name ?? '—' },
          { label: 'Email address', value: user.email ?? '—' },
          { label: 'Account ID', value: user.profileId ?? '—' },
        ].map(field => (
          <div key={field.label}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#9A8F83' }}>{field.label}</p>
            <p style={{ color: '#1C1208', fontSize: '0.95rem' }}>{field.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

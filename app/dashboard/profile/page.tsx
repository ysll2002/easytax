'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

type TaxIds = { nino: string; user: { name?: string; email?: string; image?: string; profileId?: string } };

const inputStyle = {
  width: '100%', padding: '0.6rem 0.875rem', borderRadius: '0.75rem',
  border: '1px solid #DDD5C8', backgroundColor: '#FDFCF8',
  fontSize: '0.9rem', color: '#1C1208', outline: 'none',
  fontFamily: 'monospace', letterSpacing: '0.05em',
};

export default function ProfilePage() {
  const t = useTranslations('dashboard.profile');
  const [data, setData]     = useState<TaxIds | null>(null);
  const [nino, setNino]     = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    fetch('/api/profile/tax-ids')
      .then(r => r.json())
      .then((d: TaxIds) => { setData(d); setNino(d.nino); });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/profile/tax-ids', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nino: nino.trim().toUpperCase() }),
      });
      const d = await res.json();
      if (d.error) { setError(d.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const user = data?.user;

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
        {t('title')}
      </h1>
      <p style={{ color: '#9A8F83', marginBottom: '2.5rem' }}>{t('subtitle')}</p>

      <div className="p-6 rounded-2xl mb-6" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
        <div className="flex items-center gap-4 pb-5 mb-5" style={{ borderBottom: '1px solid #DDD5C8' }}>
          {user?.image ? (
            <img src={user.image} alt="" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FDFCF8', fontSize: '1.25rem', fontWeight: 600 }}>
              {user?.name?.charAt(0) ?? '?'}
            </div>
          )}
          <div>
            <p style={{ fontWeight: 700, color: '#1C1208' }}>{user?.name ?? '—'}</p>
            <p style={{ color: '#9A8F83', fontSize: '0.875rem' }}>{user?.email ?? '—'}</p>
          </div>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#9A8F83' }}>{t('accountId')}</p>
        <p style={{ color: '#4A4035', fontSize: '0.875rem', fontFamily: 'monospace' }}>{user?.profileId ?? '—'}</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="p-6 rounded-2xl" style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' }}>
          <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
            {t('taxIdsTitle')}
          </h2>
          <p className="text-sm mb-5" style={{ color: '#9A8F83' }}>
            {t('taxIdsSubtitle')}
          </p>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#4A4035' }}>
              {t('ninoLabel')}
            </label>
            <input
              type="text"
              value={nino}
              onChange={e => setNino(e.target.value)}
              placeholder="AB 12 34 56 C"
              maxLength={13}
              style={inputStyle}
            />
            <p className="text-xs mt-1" style={{ color: '#9A8F83' }}>{t('ninoHelp')}</p>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>{error}</div>
          )}

          <div className="flex items-center gap-3 mt-6">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-full text-sm font-medium"
              style={{ backgroundColor: '#1C1208', color: '#FDFCF8', opacity: saving ? 0.6 : 1, cursor: saving ? 'wait' : 'pointer' }}
            >
              {saving ? t('saving') : t('save')}
            </button>
            {saved && <span className="text-sm" style={{ color: '#6B8E6E' }}>{t('saved')}</span>}
          </div>
        </div>
      </form>
    </div>
  );
}

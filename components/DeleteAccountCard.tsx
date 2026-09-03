'use client';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { AlertTriangle } from 'lucide-react';
import { track } from '@/lib/track';

export default function DeleteAccountCard() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [state, setState] = useState<'idle' | 'deleting' | 'error'>('idle');
  const [error, setError] = useState('');

  const canDelete = confirm.trim().toUpperCase() === 'DELETE' && state !== 'deleting';

  async function handleDelete() {
    if (!canDelete) return;
    setState('deleting');
    setError('');
    try {
      const res = await fetch('/api/profile/delete', { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState('error');
        setError(data.error || 'Deletion failed. Please try again or email hello@easytax.vip.');
        track('account_delete_failed', { reason: data.code || 'api_error' });
        return;
      }
      track('account_deleted');
      await signOut({ callbackUrl: '/?account=deleted' });
    } catch {
      setState('error');
      setError('Network error. Please try again.');
      track('account_delete_failed', { reason: 'network' });
    }
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl" style={{ backgroundColor: '#FDFCF8', border: '1px solid #E8C9B4' }}>
      <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
        Delete account
      </h2>
      <p className="text-sm mb-4" style={{ color: '#4A4035', lineHeight: 1.6 }}>
        Permanently removes your profile, tax identifiers, HMRC connection, bank connection and filing records from EasyTax. This cannot be undone. Anything already submitted to HMRC stays with HMRC — deleting here does not withdraw a return.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => { setOpen(true); track('account_delete_opened'); }}
          className="px-5 py-2.5 rounded-full text-sm font-medium"
          style={{ backgroundColor: 'transparent', color: '#B23A3A', border: '1.5px solid #B23A3A', cursor: 'pointer', minHeight: 44 }}
        >
          Delete my account…
        </button>
      ) : (
        <div className="p-4 rounded-xl" style={{ backgroundColor: '#FBF1EA', border: '1px solid #E8C9B4' }}>
          <p className="text-sm flex items-start gap-2 mb-3" style={{ color: '#1C1208' }}>
            <AlertTriangle size={16} color="#C4622D" className="flex-shrink-0 mt-0.5" />
            <span>Consider <a href="/dashboard/profile" style={{ color: '#C4622D', fontWeight: 600 }}>exporting your data</a> first. Type <strong>DELETE</strong> to confirm.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="DELETE"
              aria-label="Type DELETE to confirm"
              autoComplete="off"
              className="flex-1 px-4 rounded-full text-sm"
              style={{ minHeight: 44, border: '1.5px solid #DDD5C8', backgroundColor: '#FFFFFF', color: '#1C1208', outline: 'none', letterSpacing: '0.08em' }}
            />
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete}
              className="px-5 rounded-full text-sm font-semibold"
              style={{ minHeight: 44, backgroundColor: '#B23A3A', color: '#FDFCF8', border: 'none', cursor: canDelete ? 'pointer' : 'not-allowed', opacity: canDelete ? 1 : 0.5 }}
            >
              {state === 'deleting' ? 'Deleting…' : 'Permanently delete'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setConfirm(''); setError(''); setState('idle'); }}
              className="px-4 rounded-full text-sm"
              style={{ minHeight: 44, backgroundColor: 'transparent', color: '#9A8F83', border: 'none', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-xs mt-3" style={{ color: '#B23A3A' }}>{error}</p>}
        </div>
      )}
    </div>
  );
}

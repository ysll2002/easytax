'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Edit2 } from 'lucide-react';

export default function NinoForm({ initialNino }: { initialNino: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(!initialNino);
  const [nino,    setNino]    = useState(initialNino);
  const [input,   setInput]   = useState(initialNino);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  // Format input as XX 99 99 99 X
  function handleChange(val: string) {
    const clean = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 9);
    setInput(clean);
  }

  function displayNino(n: string) {
    return n.replace(/(.{2})(.{2})(.{2})(.{2})(.{1})/, '$1 $2 $3 $4 $5').trim();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (input.length !== 9) { setError('NINO must be 9 characters, e.g. QQ 12 34 56 A'); return; }
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/profile/tax-ids', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nino: input }),
      });
      const d = await res.json();
      if (d.error) { setError(d.error); return; }
      setNino(input);
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!editing && nino) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={18} color="#6B8E6E" />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#1C1208' }}>
              {displayNino(nino)}
            </p>
            <p className="text-xs" style={{ color: '#9A8F83' }}>National Insurance Number on file</p>
          </div>
        </div>
        <button onClick={() => { setInput(nino); setEditing(true); }}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full"
          style={{ border: '1px solid #1C1208', color: '#1C1208', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 600 }}>
          <Edit2 size={12} /> Edit
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave}>
      <p className="text-sm mb-3" style={{ color: '#4A4035' }}>
        Your NINO is required for all HMRC Self Assessment submissions. You can find it on a payslip, P60, or letter from HMRC.
      </p>
      {error && <p className="text-xs mb-2" style={{ color: '#EF4444' }}>{error}</p>}
      <div className="flex gap-2">
        <input
          value={displayNino(input)}
          onChange={e => handleChange(e.target.value)}
          placeholder="QQ 12 34 56 A"
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-mono tracking-widest"
          style={{ border: '1.5px solid #DDD5C8', backgroundColor: '#FFFFFF', outline: 'none', color: '#1C1208', letterSpacing: '0.1em' }}
          maxLength={11}
          required
        />
        <button type="submit" disabled={saving}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: '#1C1208', color: '#FDFCF8', border: 'none', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {nino && (
          <button type="button" onClick={() => setEditing(false)}
            className="px-4 py-2.5 rounded-xl text-sm"
            style={{ border: '1px solid #DDD5C8', color: '#9A8F83', backgroundColor: 'transparent', cursor: 'pointer' }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

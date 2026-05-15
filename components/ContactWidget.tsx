'use client';
import { useState } from 'react';
import { MessageCircle, X, Send, CheckCircle2 } from 'lucide-react';

export default function ContactWidget() {
  const [open,       setOpen]       = useState(false);
  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [message,    setMessage]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent,       setSent]       = useState(false);
  const [error,      setError]      = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const d = await res.json();
      if (d.error) { setError(d.error); return; }
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setOpen(false);
    if (sent) {
      setTimeout(() => { setSent(false); setName(''); setEmail(''); setMessage(''); }, 400);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Contact us"
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 50,
          width: 52, height: 52, borderRadius: '50%',
          backgroundColor: '#C4622D', color: '#FDFCF8',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px #C4622D50',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        className="hover:scale-110"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '5rem', right: '1.5rem', zIndex: 50,
          width: 340, borderRadius: '1rem', overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif',
          animation: 'slideUp 0.2s ease-out',
        }}>
          {/* Header */}
          <div style={{ backgroundColor: '#1C1208', padding: '16px 20px' }}>
            <p style={{ margin: 0, color: '#FDFCF8', fontWeight: 700, fontSize: '0.95rem' }}>Contact us</p>
            <p style={{ margin: '2px 0 0', color: '#9A8F83', fontSize: '0.75rem' }}>We usually reply within one business day.</p>
          </div>

          {/* Body */}
          <div style={{ backgroundColor: '#FDFCF8', padding: '20px' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle2 size={40} color="#6B8E6E" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 700, color: '#1C1208', marginBottom: 4 }}>Message sent!</p>
                <p style={{ color: '#9A8F83', fontSize: '0.85rem' }}>We&apos;ll be in touch soon.</p>
                <button onClick={handleClose} style={{ marginTop: 16, fontSize: '0.85rem', color: '#C4622D', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {error && (
                  <p style={{ fontSize: '0.8rem', color: '#EF4444', margin: 0 }}>{error}</p>
                )}
                <input
                  required value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E8E2DA', fontSize: '0.875rem', outline: 'none', color: '#1C1208', backgroundColor: '#FFFFFF' }}
                />
                <input
                  required type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Your email"
                  style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E8E2DA', fontSize: '0.875rem', outline: 'none', color: '#1C1208', backgroundColor: '#FFFFFF' }}
                />
                <textarea
                  required value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  rows={4}
                  style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E8E2DA', fontSize: '0.875rem', outline: 'none', color: '#1C1208', resize: 'none', backgroundColor: '#FFFFFF', fontFamily: 'inherit' }}
                />
                <button
                  type="submit" disabled={submitting}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px', borderRadius: 8, border: 'none', cursor: submitting ? 'wait' : 'pointer',
                    backgroundColor: '#C4622D', color: '#FDFCF8', fontWeight: 600, fontSize: '0.875rem',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting
                    ? <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} /> Sending…</>
                    : <><Send size={14} /> Send message</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

'use client';
// Shared bits for the agent pages.
import type { AuthStatus } from '@/lib/agent-types';

export const card = { padding: '1.25rem', borderRadius: '1rem', backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' } as const;
export const input = { width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.6rem', border: '1px solid #B8AE9F', backgroundColor: '#FDFCF8', fontSize: '0.875rem', color: '#1C1208' } as const;
export const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1C1208', marginBottom: '0.3rem' } as const;
export const primaryBtn = { padding: '0.6rem 1.2rem', borderRadius: '2rem', border: 'none', backgroundColor: '#A04E1C', color: '#FDFCF8', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' } as const;
export const secondaryBtn = { padding: '0.45rem 0.95rem', borderRadius: '2rem', border: '1px solid #DDD5C8', backgroundColor: '#F0EBE1', color: '#1C1208', fontWeight: 500, fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' } as const;
export const h1Style = { fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.4rem' } as const;
export const h2Style = { fontSize: '1.05rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.6rem' } as const;

const STATUS: Record<AuthStatus, { label: string; color: string; bg: string }> = {
  none:         { label: 'Not requested',       color: '#4A4035', bg: '#F0EBE1' },
  pending:      { label: 'Waiting for client',  color: '#7A4A1E', bg: '#F5EDDC' },
  authorised:   { label: 'Authorised',          color: '#2F5232', bg: '#E2EDE2' },
  rejected:     { label: 'Declined by client',  color: '#991B1B', bg: '#FEE2E2' },
  expired:      { label: 'Request expired',     color: '#4A4035', bg: '#F0EBE1' },
  cancelled:    { label: 'Request cancelled',   color: '#4A4035', bg: '#F0EBE1' },
  deauthorised: { label: 'No longer authorised', color: '#991B1B', bg: '#FEE2E2' },
};

export function StatusBadge({ status }: { status: AuthStatus }) {
  const s = STATUS[status] ?? STATUS.none;
  return (
    <span style={{ display: 'inline-block', padding: '0.15rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, color: s.color, backgroundColor: s.bg, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

export async function api<T = Record<string, unknown>>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message ?? data.error ?? `Request failed (${res.status})`);
  return data as T;
}

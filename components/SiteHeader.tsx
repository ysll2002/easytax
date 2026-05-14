'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function SiteHeader() {
  const { data: session } = useSession();

  return (
    <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
      <Link href="/" style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#C4622D', letterSpacing: '-0.01em', textDecoration: 'none' }}>
        EasyTax
      </Link>
      <nav className="hidden md:flex gap-8 text-sm font-medium">
        <Link href="/#features"  style={{ color: '#9A8F83', textDecoration: 'none' }} className="hover:text-[#1C1208] transition-colors">How it Works</Link>
        <Link href="/#pricing"   style={{ color: '#9A8F83', textDecoration: 'none' }} className="hover:text-[#1C1208] transition-colors">Pricing</Link>
        <Link href="/#faq"       style={{ color: '#9A8F83', textDecoration: 'none' }} className="hover:text-[#1C1208] transition-colors">FAQ</Link>
        <Link href="/timetable"  style={{ color: '#9A8F83', textDecoration: 'none' }} className="hover:text-[#1C1208] transition-colors">Timetable</Link>
      </nav>
      <div className="flex gap-4 items-center">
        {session ? (
          <>
            <Link href="/dashboard" className="text-sm font-medium px-5 py-2.5 rounded-full transition-all" style={{ backgroundColor: '#C4622D', color: '#FDFCF8', textDecoration: 'none' }}>Dashboard</Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-sm font-medium transition-colors"
              style={{ backgroundColor: 'transparent', color: '#9A8F83', border: 'none', cursor: 'pointer' }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login"    className="text-sm font-medium transition-colors" style={{ color: '#9A8F83', textDecoration: 'none' }}>Log in</Link>
            <Link href="/register" className="text-sm font-medium px-5 py-2.5 rounded-full transition-all" style={{ backgroundColor: '#C4622D', color: '#FDFCF8', textDecoration: 'none' }}>Register</Link>
          </>
        )}
      </div>
    </header>
  );
}

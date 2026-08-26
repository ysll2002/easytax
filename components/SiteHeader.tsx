'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

export default function SiteHeader() {
  const { data: session } = useSession();
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);

  return (
    <header style={{ position: 'relative' }}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center">
        <Link href="/" style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#C4622D', letterSpacing: '-0.01em', textDecoration: 'none' }}>
          EasyTax
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-8 text-sm font-medium">
          <Link href="/#features" style={{ color: '#9A8F83', textDecoration: 'none' }} className="hover:text-[#1C1208] transition-colors">{t('howItWorks')}</Link>
          <Link href="/pricing"   style={{ color: '#9A8F83', textDecoration: 'none' }} className="hover:text-[#1C1208] transition-colors">{t('pricing')}</Link>
          <Link href="/#faq"      style={{ color: '#9A8F83', textDecoration: 'none' }} className="hover:text-[#1C1208] transition-colors">{t('faq')}</Link>
          <Link href="/timetable" style={{ color: '#9A8F83', textDecoration: 'none' }} className="hover:text-[#1C1208] transition-colors">{t('timetable')}</Link>
          <Link href="/tax-tips"  style={{ color: '#9A8F83', textDecoration: 'none' }} className="hover:text-[#1C1208] transition-colors">{t('taxTips')}</Link>
        </nav>

        {/* Desktop auth + language */}
        <div className="hidden md:flex gap-3 items-center">
          <LanguageSwitcher />
          {session ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium px-5 py-2.5 rounded-full" style={{ backgroundColor: '#C4622D', color: '#FDFCF8', textDecoration: 'none' }}>{t('dashboard')}</Link>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="text-sm font-medium" style={{ backgroundColor: 'transparent', color: '#9A8F83', border: 'none', cursor: 'pointer' }}>{t('logout')}</button>
            </>
          ) : (
            <>
              <Link href="/login"    className="text-sm font-medium" style={{ color: '#9A8F83', textDecoration: 'none' }}>{t('login')}</Link>
              <Link href="/register" className="text-sm font-medium px-5 py-2.5 rounded-full" style={{ backgroundColor: '#C4622D', color: '#FDFCF8', textDecoration: 'none' }}>{t('register')}</Link>
            </>
          )}
        </div>

        {/* Mobile: language + CTA + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <LanguageSwitcher />
          {session ? (
            <Link href="/dashboard" className="text-sm font-semibold px-4 py-2 rounded-full" style={{ backgroundColor: '#C4622D', color: '#FDFCF8', textDecoration: 'none' }}>{t('dashboard')}</Link>
          ) : (
            <Link href="/register" className="text-sm font-semibold px-4 py-2 rounded-full" style={{ backgroundColor: '#C4622D', color: '#FDFCF8', textDecoration: 'none' }}>{t('register')}</Link>
          )}
          <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1C1208', padding: 4 }}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden" style={{ backgroundColor: '#FDFCF8', borderTop: '1px solid #E8E2DA', borderBottom: '1px solid #E8E2DA', padding: '1rem 1.5rem' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { href: '/#features', label: t('howItWorks') },
              { href: '/pricing',   label: t('pricing') },
              { href: '/#faq',      label: t('faq') },
              { href: '/timetable', label: t('timetable') },
              { href: '/tax-tips',  label: t('taxTips') },
            ].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                style={{ color: '#4A4035', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, padding: '0.25rem 0' }}>
                {item.label}
              </Link>
            ))}
            {!session && (
              <Link href="/login" onClick={() => setOpen(false)}
                style={{ color: '#9A8F83', textDecoration: 'none', fontSize: '0.95rem', padding: '0.25rem 0' }}>
                {t('login')}
              </Link>
            )}
            {session && (
              <button onClick={() => { signOut({ callbackUrl: '/' }); setOpen(false); }}
                style={{ color: '#9A8F83', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem', padding: '0.25rem 0' }}>
                {t('logout')}
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import MtdStatusBar from './MtdStatusBar';

export default function SiteHeader() {
  const { data: session } = useSession();
  const t = useTranslations('nav');
  const a11y = useTranslations('a11y');
  const [open, setOpen] = useState(false);

  return (
    <header style={{ position: 'relative' }}>
      {/* The mandate is live, and until now only the homepage said so. Putting
          it in the shared header is what makes that true of every page. */}
      <MtdStatusBar />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-wrap gap-y-2 justify-between items-center">
        <Link href="/" style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#A04E1C', letterSpacing: '-0.01em', textDecoration: 'none' }}>
          EasyTax
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-8 text-sm font-medium">
          {/* The homepage section ids are services / how / faq / notify. This
              pointed at #features, which has never existed — so "How it Works"
              was a no-op in the nav of every page on the site. */}
          <Link href="/#how" style={{ color: '#6B6256', textDecoration: 'none' }} className="hover:text-[#1C1208] transition-colors">{t('howItWorks')}</Link>
          <Link href="/pricing"   style={{ color: '#6B6256', textDecoration: 'none' }} className="hover:text-[#1C1208] transition-colors">{t('pricing')}</Link>
          <Link href="/#faq"      style={{ color: '#6B6256', textDecoration: 'none' }} className="hover:text-[#1C1208] transition-colors">{t('faq')}</Link>
          <Link href="/timetable" style={{ color: '#6B6256', textDecoration: 'none' }} className="hover:text-[#1C1208] transition-colors">{t('timetable')}</Link>
          {/* The hub rather than a single tool: it links every calculator and
              keeps the nav from growing an entry per tool. */}
          <Link href="/tools" style={{ color: '#6B6256', textDecoration: 'none' }} className="hover:text-[#1C1208] transition-colors">{t('tools')}</Link>
          <Link href="/tax-tips"  style={{ color: '#6B6256', textDecoration: 'none' }} className="hover:text-[#1C1208] transition-colors">{t('taxTips')}</Link>
          <Link href="/trust"     style={{ color: '#6B6256', textDecoration: 'none' }} className="hover:text-[#1C1208] transition-colors">{t('trust')}</Link>
        </nav>

        {/* Desktop auth + language */}
        <div className="hidden md:flex gap-3 items-center">
          <LanguageSwitcher />
          {session ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium px-5 py-2.5 rounded-full" style={{ backgroundColor: '#A04E1C', color: '#FDFCF8', textDecoration: 'none' }}>{t('dashboard')}</Link>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="text-sm font-medium" style={{ backgroundColor: 'transparent', color: '#6B6256', border: 'none', cursor: 'pointer' }}>{t('logout')}</button>
            </>
          ) : (
            <>
              <Link href="/login"    className="text-sm font-medium" style={{ color: '#6B6256', textDecoration: 'none' }}>{t('login')}</Link>
              <Link href="/register" className="text-sm font-medium px-5 py-2.5 rounded-full" style={{ backgroundColor: '#A04E1C', color: '#FDFCF8', textDecoration: 'none' }}>{t('register')}</Link>
            </>
          )}
        </div>

        {/* Mobile: language + CTA + hamburger */}
        <div className="flex md:hidden flex-wrap justify-end items-center gap-2 ml-auto">
          <LanguageSwitcher />
          {session ? (
            <Link href="/dashboard" className="text-sm font-semibold px-4 py-2 rounded-full" style={{ backgroundColor: '#A04E1C', color: '#FDFCF8', textDecoration: 'none' }}>{t('dashboard')}</Link>
          ) : (
            <Link href="/register" className="text-sm font-semibold px-4 py-2 rounded-full" style={{ backgroundColor: '#A04E1C', color: '#FDFCF8', textDecoration: 'none' }}>{t('register')}</Link>
          )}
          <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls="site-mobile-menu" aria-label={open ? a11y('closeMenu') : a11y('openMenu')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1C1208', padding: 10 }}>
            {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div id="site-mobile-menu" className="md:hidden" style={{ backgroundColor: '#FDFCF8', borderTop: '1px solid #E8E2DA', borderBottom: '1px solid #E8E2DA', padding: '1rem 1.5rem' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { href: '/#how',      label: t('howItWorks') },
              { href: '/pricing',   label: t('pricing') },
              { href: '/#faq',      label: t('faq') },
              { href: '/timetable', label: t('timetable') },
              { href: '/tools',     label: t('tools') },
              { href: '/tax-tips',  label: t('taxTips') },
              { href: '/trust',     label: t('trust') },
            ].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                style={{ color: '#4A4035', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, padding: '0.25rem 0' }}>
                {item.label}
              </Link>
            ))}
            {!session && (
              <Link href="/login" onClick={() => setOpen(false)}
                style={{ color: '#6B6256', textDecoration: 'none', fontSize: '0.95rem', padding: '0.25rem 0' }}>
                {t('login')}
              </Link>
            )}
            {session && (
              <button onClick={() => { signOut({ callbackUrl: '/' }); setOpen(false); }}
                style={{ color: '#6B6256', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem', padding: '0.25rem 0' }}>
                {t('logout')}
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

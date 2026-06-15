'use client';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition, useRef, useEffect } from 'react';
import { setLocaleAction } from '@/lib/locale-actions';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/routing';
import { Check } from 'lucide-react';

export default function LanguageSwitcher() {
  const current = useLocale() as Locale;
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function pick(next: Locale) {
    setOpen(false);
    startTransition(async () => {
      await setLocaleAction(next);
    });
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={t('language')}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
        style={{ color: '#4A4035', backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8', cursor: 'pointer' }}
      >
        <span style={{ fontSize: '1rem', lineHeight: 1 }} aria-hidden>{localeFlags[current]}</span>
        <span>{localeNames[current]}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute mt-2 rounded-xl shadow-lg overflow-hidden"
          style={{
            right: 0,
            backgroundColor: '#FDFCF8',
            border: '1px solid #DDD5C8',
            minWidth: 160,
            zIndex: 50,
          }}
        >
          {locales.map(loc => {
            const active = loc === current;
            return (
              <button
                key={loc}
                role="menuitem"
                disabled={pending}
                onClick={() => pick(loc)}
                className="flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors"
                style={{
                  backgroundColor: active ? '#F8F5F0' : 'transparent',
                  color: active ? '#1C1208' : '#4A4035',
                  border: 'none',
                  cursor: pending ? 'wait' : 'pointer',
                  textAlign: 'start',
                  fontWeight: active ? 600 : 500,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.05rem', lineHeight: 1 }} aria-hidden>{localeFlags[loc]}</span>
                  <span>{localeNames[loc]}</span>
                </span>
                {active && <Check size={14} color="#6B8E6E" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

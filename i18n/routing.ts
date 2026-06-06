export const locales = ['en', 'es', 'fr', 'zh', 'ko', 'ja', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  zh: '中文',
  ko: '한국어',
  ja: '日本語',
  ar: 'العربية',
};

export const rtlLocales: ReadonlyArray<Locale> = ['ar'] as const;
export const isRtl = (l: string) => (rtlLocales as readonly string[]).includes(l);

export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function isValidLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/// Picks a locale from an Accept-Language header (e.g. "zh-CN,zh;q=0.9,en;q=0.8").
export function pickLocaleFromHeader(header: string | null | undefined): Locale {
  if (!header) return defaultLocale;
  const candidates = header.split(',').map(p => p.trim().split(';')[0].trim().toLowerCase());
  for (const c of candidates) {
    const short = c.split('-')[0];
    if (isValidLocale(short)) return short;
  }
  return defaultLocale;
}

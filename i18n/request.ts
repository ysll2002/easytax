import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { LOCALE_COOKIE, defaultLocale, isValidLocale, pickLocaleFromHeader } from './routing';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  let locale: string;
  if (cookieLocale && isValidLocale(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const h = await headers();
    locale = pickLocaleFromHeader(h.get('accept-language'));
  }
  if (!isValidLocale(locale)) locale = defaultLocale;

  const messages = (await import(`@/messages/${locale}.json`)).default;
  return { locale, messages };
});

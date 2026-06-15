'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { isValidLocale, LOCALE_COOKIE } from '@/i18n/routing';

export async function setLocaleAction(locale: string) {
  if (!isValidLocale(locale)) return { ok: false };
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  revalidatePath('/', 'layout');
  return { ok: true };
}

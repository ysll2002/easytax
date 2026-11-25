'use client';

import { useEffect } from 'react';
import { NEW_SIGNUP_COOKIE } from '@/lib/signup-beacon';

declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}

// Email sign-ups send GA register_success from the register form. A Google
// sign-up leaves the site for Google and lands straight on the dashboard, so
// the account is created on the server (auth.ts) and GA never heard about it.
// auth.ts leaves a short-lived cookie; this sends the event once and clears it.
export default function SignupBeacon() {
  useEffect(() => {
    const match = document.cookie.split('; ').find(c => c.startsWith(`${NEW_SIGNUP_COOKIE}=`));
    if (!match) return;
    document.cookie = `${NEW_SIGNUP_COOKIE}=; path=/; max-age=0; samesite=lax; secure`;
    const method = decodeURIComponent(match.split('=')[1] || 'google');
    // gtag loads asynchronously; give it a moment rather than lose the event.
    let tries = 0;
    const send = () => {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'register_success', { method });
      } else if (++tries < 20) {
        setTimeout(send, 250);
      }
    };
    send();
  }, []);
  return null;
}

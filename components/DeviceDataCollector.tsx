'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Collects browser data required by HMRC fraud prevention headers.
// Stores in a short-lived cookie read by server-side HMRC API calls.
export default function DeviceDataCollector() {
  const { data: session } = useSession();

  useEffect(() => {
    const COOKIE_KEY = 'hmrc_device';

    let deviceId = localStorage.getItem('hmrc_device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('hmrc_device_id', deviceId);
    }

    const screens = `width=${window.screen.width}&height=${window.screen.height}&scaling-factor=${window.devicePixelRatio}&colour-depth=${window.screen.colorDepth}`;
    const windowSize = `width=${window.innerWidth}&height=${window.innerHeight}`;
    const offset = -new Date().getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const h = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
    const m = String(Math.abs(offset) % 60).padStart(2, '0');
    const timezone = `UTC${sign}${h}:${m}`;

    const payload = JSON.stringify({
      userAgent: navigator.userAgent,
      deviceId,
      screens,
      timezone,
      window: windowSize,
      ip:     '',
      ipTs:   new Date().toISOString(),
      userId: session?.user?.profileId ?? '',
    });

    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(payload)};path=/;max-age=3600;SameSite=Strict`;
  }, [session?.user?.profileId]);

  return null;
}

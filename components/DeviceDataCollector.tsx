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

    const writeCookie = (ip: string, port: string) => {
      const payload = JSON.stringify({
        userAgent: navigator.userAgent,
        deviceId,
        screens,
        timezone,
        window:   windowSize,
        ip,
        port,
        ipTs:     new Date().toISOString(),
        userId:   session?.user?.profileId ?? '',
      });
      document.cookie = `${COOKIE_KEY}=${encodeURIComponent(payload)};path=/;max-age=3600;SameSite=Strict`;
    };

    // Use WebRTC STUN to discover the NAT-mapped public port
    const getPublicPort = (): Promise<string> => new Promise(resolve => {
      try {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        pc.createDataChannel('');
        let done = false;
        const finish = (port: string) => { if (!done) { done = true; pc.close(); resolve(port); } };
        pc.onicecandidate = e => {
          if (!e.candidate) { finish(''); return; }
          const parts = e.candidate.candidate.split(' ');
          // srflx = server reflexive = NAT external IP:port
          if (parts[7] === 'srflx') finish(parts[5]);
        };
        pc.createOffer().then(o => pc.setLocalDescription(o)).catch(() => finish(''));
        setTimeout(() => finish(''), 4000);
      } catch { resolve(''); }
    });

    fetch('/api/client-ip')
      .then(r => r.json())
      .then(async d => {
        const port = await getPublicPort();
        writeCookie(d.ip ?? '', port);
      })
      .catch(() => writeCookie('', ''));
  }, [session?.user?.profileId]);

  return null;
}

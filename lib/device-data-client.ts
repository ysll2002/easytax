'use client';

// Client-side collector for HMRC fraud-prevention header values.
//
// Historically the collected data was written to a cookie which the server-side
// fraudHeaders() helper read. HMRC's FPH review then flagged missing headers on
// requests fired before the cookie had been written (the collection is async —
// it waits on an IP fetch and a WebRTC STUN handshake). To close that race, this
// module exposes a memoised promise: hmrcFetch awaits it and attaches the data
// as a request header, so the server always sees the same values the client
// collected, regardless of cookie write timing.

export type DeviceData = {
  userAgent: string;
  deviceId:  string;
  screens:   string;
  timezone:  string;
  window:    string;
  ip:        string;
  port:      string;
  ipTs:      string;
};

let cached: Promise<DeviceData> | null = null;

export function collectDeviceData(): Promise<DeviceData> {
  if (typeof window === 'undefined') {
    return Promise.resolve({
      userAgent: '', deviceId: '', screens: '', timezone: '',
      window: '', ip: '', port: '', ipTs: '',
    });
  }
  if (!cached) cached = doCollect();
  return cached;
}

async function doCollect(): Promise<DeviceData> {
  let deviceId = '';
  try {
    deviceId = localStorage.getItem('hmrc_device_id') ?? '';
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('hmrc_device_id', deviceId);
    }
  } catch { /* localStorage may be disabled */ }

  const screens    = `width=${window.screen.width}&height=${window.screen.height}&scaling-factor=${window.devicePixelRatio}&colour-depth=${window.screen.colorDepth}`;
  const windowSize = `width=${window.innerWidth}&height=${window.innerHeight}`;
  const offset = -new Date().getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const h = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const m = String(Math.abs(offset) % 60).padStart(2, '0');
  const timezone = `UTC${sign}${h}:${m}`;

  const [ip, port] = await Promise.all([fetchClientIp(), getPublicPort()]);

  const data: DeviceData = {
    userAgent: navigator.userAgent,
    deviceId,
    screens,
    timezone,
    window: windowSize,
    ip,
    port,
    ipTs: new Date().toISOString(),
  };

  // Legacy cookie kept as a fallback so any server route hit without the new
  // X-EasyTax-Device-Data header (e.g. direct curl) still populates what it can.
  try {
    document.cookie = `hmrc_device=${encodeURIComponent(JSON.stringify({ ...data, userId: '' }))};path=/;max-age=3600;SameSite=Strict`;
  } catch { /* ignore */ }

  return data;
}

async function fetchClientIp(): Promise<string> {
  try {
    const r = await fetch('/api/client-ip', { signal: AbortSignal.timeout(3000) });
    const d = await r.json();
    return typeof d?.ip === 'string' ? d.ip : '';
  } catch {
    return '';
  }
}

function getPublicPort(): Promise<string> {
  return new Promise(resolve => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pc.createDataChannel('');
      let done = false;
      const finish = (port: string) => { if (!done) { done = true; pc.close(); resolve(port); } };
      pc.onicecandidate = e => {
        if (!e.candidate) { finish(''); return; }
        const parts = e.candidate.candidate.split(' ');
        // srflx = server reflexive candidate = NAT-mapped external IP:port
        if (parts[7] === 'srflx') finish(parts[5]);
      };
      pc.createOffer().then(o => pc.setLocalDescription(o)).catch(() => finish(''));
      setTimeout(() => finish(''), 4000);
    } catch {
      resolve('');
    }
  });
}

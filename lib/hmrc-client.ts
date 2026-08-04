'use client';

// Waits for DeviceDataCollector to have written the hmrc_device cookie
// before returning. Any HMRC-bound fetch fired before that would otherwise
// ship empty browser-side fraud-prevention headers (Gov-Client-Screens,
// Gov-Client-Public-IP, etc.), which HMRC's FPH review explicitly flags.
// Bails after `timeoutMs` so a broken collector doesn't wedge the page —
// the server-side fraud-headers helper will still omit any headers whose
// values it can't fill, rather than sending empty strings.
async function waitForHmrcDevice(timeoutMs = 6000): Promise<void> {
  if (typeof document === 'undefined') return;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (document.cookie.split('; ').some(c => c.startsWith('hmrc_device='))) return;
    await new Promise(r => setTimeout(r, 50));
  }
}

export async function hmrcFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  await waitForHmrcDevice();
  return fetch(input, init);
}

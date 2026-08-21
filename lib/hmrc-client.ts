'use client';

import { collectDeviceData } from './device-data-client';

// All HMRC-bound requests fired from the browser go through this wrapper. It
// waits for the memoised device-data collection to resolve, then attaches the
// collected values as X-EasyTax-Device-Data. The server-side fraudHeaders()
// helper reads that header and populates the Gov-Client-* headers HMRC's FPH
// review requires. This closes the earlier race where a request could fire
// before the client had finished writing the hmrc_device cookie.
export async function hmrcFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const data = await collectDeviceData();
  const headers = new Headers(init?.headers);
  headers.set('x-easytax-device-data', encodeURIComponent(JSON.stringify(data)));
  return fetch(input, { ...init, headers });
}

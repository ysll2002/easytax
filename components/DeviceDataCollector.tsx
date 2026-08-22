'use client';
import { useEffect } from 'react';
import { collectDeviceData } from '@/lib/device-data-client';

// Kicks off HMRC device-data collection as soon as the dashboard mounts so the
// memoised promise is ready (or well underway) by the time an HMRC-bound
// hmrcFetch call awaits it. The actual data flows to server routes via a
// request header set by hmrcFetch, not via a cookie.
export default function DeviceDataCollector() {
  useEffect(() => {
    collectDeviceData();
  }, []);
  return null;
}

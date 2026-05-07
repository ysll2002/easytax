import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getValidToken } from '@/lib/hmrc';
import { cookies } from 'next/headers';

const SANDBOX = 'https://test-api.service.hmrc.gov.uk';

async function getVendorIp(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2000) });
    const { ip } = await res.json();
    return ip ?? '';
  } catch { return ''; }
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const jar = await cookies();
  let deviceData: Record<string, string> = {};
  try {
    const raw = jar.get('hmrc_device')?.value;
    if (raw) deviceData = JSON.parse(decodeURIComponent(raw));
  } catch { /* ignore */ }

  const vendorIp = await getVendorIp();
  const clientIp = deviceData.ip ?? '';

  const fphHeaders: Record<string, string> = {
    'Gov-Client-Connection-Method':     'WEB_APP_VIA_SERVER',
    'Gov-Client-Browser-JS-User-Agent': deviceData.userAgent ?? '',
    'Gov-Client-Device-ID':             deviceData.deviceId  ?? '',
    'Gov-Client-Screens':               deviceData.screens   ?? '',
    'Gov-Client-Timezone':              deviceData.timezone  ?? 'UTC+00:00',
    'Gov-Client-Window-Size':           deviceData.window    ?? '',
    'Gov-Client-Public-IP':             clientIp,
    'Gov-Client-Public-IP-Timestamp':   deviceData.ipTs      ?? new Date().toISOString(),
    'Gov-Client-Public-Port':           deviceData.port      ?? '',
    'Gov-Client-User-IDs':              deviceData.userId ? `easytax=${deviceData.userId}` : '',
    'Gov-Vendor-Product-Name':          'EasyTax',
    'Gov-Vendor-Version':               'easytax=0.1.0',
    'Gov-Vendor-Public-IP':             vendorIp,
    'Gov-Vendor-Forwarded':             clientIp && vendorIp ? `by=${vendorIp}&for=${clientIp}` : '',
    'Gov-Vendor-License-IDs':           'easytax=0.1.0',
  };

  try {
    const token = await getValidToken(session.user.profileId);

    const res = await fetch(`${SANDBOX}/test/fraud-prevention-headers/validate`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.hmrc.1.0+json',
        ...fphHeaders,
      },
    });

    const data = await res.json();
    return NextResponse.json({ status: res.status, result: data, headers: fphHeaders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg, headers: fphHeaders }, { status: 502 });
  }
}

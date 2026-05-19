import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const SANDBOX = 'https://test-api.service.hmrc.gov.uk';

// Gets an application-restricted (server) token via client_credentials grant
async function getAppToken(): Promise<string> {
  const res = await fetch(`${SANDBOX}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     (process.env.HMRC_CLIENT_ID     ?? '').trim(),
      client_secret: (process.env.HMRC_CLIENT_SECRET ?? '').trim(),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`App token failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const appToken = await getAppToken();

    const res = await fetch(`${SANDBOX}/create-test-user/individuals`, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${appToken}`,
        Accept:         'application/vnd.hmrc.1.0+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceNames: [
          'national-insurance',
          'self-assessment',
          'mtd-income-tax',
          'mtd-vat',
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: `HMRC ${res.status}`, detail: data }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      instructions: 'Use these credentials to sign in on the HMRC sandbox OAuth page when connecting your account.',
      user: {
        userId:   data.userId,
        password: data.password,
        nino:     data.nino,
        vrn:      data.mtdItId ?? data.vrn ?? '(none)',
        saUtr:    data.saUtr ?? '(none)',
      },
      raw: data,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getValidToken, fraudHeaders } from '@/lib/hmrc';

const SANDBOX = 'https://test-api.service.hmrc.gov.uk';

// Diagnostic endpoint — hits HMRC's own fraud-prevention-headers validator
// with the exact headers our regular API paths would send, so we can see
// what HMRC's rule engine returns without touching a real MTD endpoint.
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const fphHeaders = await fraudHeaders();

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

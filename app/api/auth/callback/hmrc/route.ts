import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';
import { getBusinessDetails, getVatObligations } from '@/lib/hmrc';

const BASE = process.env.HMRC_ENV === 'production'
  ? 'https://api.service.hmrc.gov.uk'
  : 'https://test-api.service.hmrc.gov.uk';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/dashboard/tax/hmrc?error=access_denied', req.url));
  }

  const tokenRes = await fetch(`${BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     process.env.HMRC_CLIENT_ID!,
      client_secret: process.env.HMRC_CLIENT_SECRET!,
      code,
      redirect_uri:  process.env.HMRC_REDIRECT_URI!,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/dashboard/tax/hmrc?error=token_exchange', req.url));
  }

  const tokens = await tokenRes.json();

  const session = await auth();
  if (!session) return NextResponse.redirect(new URL('/login', req.url));

  const profileId = session.user.profileId;

  // In sandbox, use known test-user identifiers; in production the user provides these during onboarding
  const nino = process.env.HMRC_ENV !== 'production' ? 'AA000003D' : null;
  const vrn  = process.env.HMRC_ENV !== 'production' ? '999999999' : null;

  // Fetch the self-employment businessId from HMRC
  let businessId: string | null = null;
  try {
    const businesses = await getBusinessDetails(nino ?? 'AA000003D', tokens.access_token);
    const selfEmp = businesses.find(b => b.typeOfBusiness === 'self-employment');
    businessId = selfEmp?.businessId ?? null;
  } catch { /* non-blocking */ }

  // Warm up VAT obligations (makes a real API call to satisfy HMRC sandbox activity requirement)
  try {
    if (vrn) await getVatObligations(vrn, tokens.access_token);
  } catch { /* non-blocking */ }

  await supabase.from('hmrc_connections').upsert({
    user_id:          profileId,
    access_token:     tokens.access_token,
    refresh_token:    tokens.refresh_token ?? null,
    token_expires_at: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
    nino,
    vrn,
    business_id:  businessId,
    connected_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  return NextResponse.redirect(new URL('/dashboard/tax', req.url));
}

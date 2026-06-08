import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
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

  const redirectUri = (process.env.HMRC_REDIRECT_URI ?? '').trim();

  const tokenRes = await fetch(`${BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     (process.env.HMRC_CLIENT_ID ?? '').trim(),
      client_secret: (process.env.HMRC_CLIENT_SECRET ?? '').trim(),
      code,
      redirect_uri:  redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text().catch(() => '');
    const detail = encodeURIComponent(`redirect_uri sent: ${redirectUri} | HMRC: ${body.slice(0, 200)}`);
    return NextResponse.redirect(new URL(`/dashboard/tax/hmrc?error=token_exchange&detail=${detail}&status=${tokenRes.status}`, req.url));
  }

  const tokens = await tokenRes.json();

  const session = await auth();
  if (!session) return NextResponse.redirect(new URL('/login', req.url));

  const profileId = session.user.profileId;

  // Preserve NINO/VRN the user has already entered; use maybeSingle to avoid error on missing row
  const { data: existing } = await supabase
    .from('hmrc_connections')
    .select('nino, vrn')
    .eq('user_id', profileId)
    .maybeSingle();

  // Never overwrite a real NINO/VRN with sandbox defaults
  const nino = existing?.nino && existing.nino !== 'GW460330D' ? existing.nino : (existing?.nino ?? null);
  const vrn  = existing?.vrn  && existing.vrn  !== '999999999' ? existing.vrn  : (existing?.vrn  ?? null);

  // Fetch the self-employment businessId from HMRC
  let businessId: string | null = null;
  try {
    const businesses = await getBusinessDetails(nino ?? 'GW460330D', tokens.access_token);
    const selfEmp = businesses.find(b => b.typeOfBusiness === 'self-employment');
    businessId = selfEmp?.businessId ?? null;
  } catch { /* non-blocking */ }

  // Warm up VAT obligations (makes a real API call to satisfy HMRC sandbox activity requirement)
  try {
    if (vrn) await getVatObligations(vrn, tokens.access_token);
  } catch { /* non-blocking */ }

  const payload: Record<string, string | null> = {
    access_token:     tokens.access_token,
    refresh_token:    tokens.refresh_token ?? null,
    token_expires_at: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
    nino,
    vrn,
    connected_at: new Date().toISOString(),
  };
  // Only include business_id if we found one (column may not exist yet)
  if (businessId) payload.business_id = businessId;

  const { error: dbError } = await supabase
    .from('hmrc_connections')
    .upsert({ user_id: profileId, ...payload }, { onConflict: 'user_id' });

  if (dbError) {
    const detail = encodeURIComponent(`DB error: ${dbError.message}`);
    return NextResponse.redirect(new URL(`/dashboard/tax/hmrc?error=db&detail=${detail}`, req.url));
  }

  return NextResponse.redirect(new URL('/dashboard/tax', req.url));
}

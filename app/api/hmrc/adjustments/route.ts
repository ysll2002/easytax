import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import {
  getValidToken,
  submitAnnualAdjustments,
  submitSavingsIncome,
  submitDividendsIncome,
  submitCharitableGiving,
} from '@/lib/hmrc';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = session.user.profileId;
  const body = await req.json();
  const { taxYear, businessAdjustments, savingsAccounts, dividends, giftAid } = body;

  const { data: hmrc } = await supabase
    .from('hmrc_connections')
    .select('nino, business_id')
    .eq('user_id', profileId)
    .single();

  const nino       = hmrc?.nino       ?? (process.env.HMRC_ENV !== 'production' ? 'GW460330D'       : null);
  const businessId = hmrc?.business_id ?? (process.env.HMRC_ENV !== 'production' ? 'XAIS12345678910' : null);

  if (!nino) return NextResponse.json({ error: 'NINO missing — add it in Profile' }, { status: 400 });

  try {
    const token = await getValidToken(profileId);
    const results: Record<string, unknown> = {};

    if (businessId && Object.values(businessAdjustments ?? {}).some(Boolean)) {
      results.businessAdjustments = await submitAnnualAdjustments(nino, businessId, taxYear, businessAdjustments, token);
    }
    if (savingsAccounts?.length) {
      results.savings = await submitSavingsIncome(nino, taxYear, savingsAccounts, token);
    }
    if (dividends?.foreignDividend?.length || dividends?.stockDividend) {
      results.dividends = await submitDividendsIncome(nino, taxYear, dividends, token);
    }
    if (giftAid?.totalAmount) {
      results.giftAid = await submitCharitableGiving(nino, taxYear, { giftAidPayments: { totalAmount: giftAid.totalAmount } }, token);
    }

    await supabase
      .from('hmrc_connections')
      .update({ adjustments_submitted: true })
      .eq('user_id', profileId);

    return NextResponse.json({ success: true, results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('hmrc_connections')
    .select('adjustments_submitted')
    .eq('user_id', session.user.profileId)
    .single();

  return NextResponse.json({ submitted: data?.adjustments_submitted ?? false });
}

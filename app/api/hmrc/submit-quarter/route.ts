import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';
import { getValidToken, submitQuarterlyUpdate, type QuarterlyData } from '@/lib/hmrc';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = session.user.profileId;
  const body: QuarterlyData & { taxYear: string } = await req.json();

  const { data: hmrc } = await supabase
    .from('hmrc_connections')
    .select('nino, business_id')
    .eq('user_id', profileId)
    .single();

  if (!hmrc) return NextResponse.json({ error: 'No HMRC connection' }, { status: 404 });

  const nino       = hmrc.nino       ?? (process.env.HMRC_ENV !== 'production' ? 'GW460330D' : null);
  const businessId = hmrc.business_id ?? (process.env.HMRC_ENV !== 'production' ? 'XAIS12345678910' : null);

  if (!nino || !businessId) {
    return NextResponse.json({ error: 'NINO or businessId missing' }, { status: 400 });
  }

  try {
    const token = await getValidToken(profileId);
    const result = await submitQuarterlyUpdate(nino, businessId, body.taxYear, body, token);
    return NextResponse.json({ success: true, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

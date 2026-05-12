import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';
import { getValidToken, triggerCalculation, getCalculation } from '@/lib/hmrc';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = session.user.profileId;
  const { taxYear } = await req.json();

  const { data: hmrc } = await supabase
    .from('hmrc_connections')
    .select('nino')
    .eq('user_id', profileId)
    .single();

  const nino = hmrc?.nino ?? (process.env.HMRC_ENV !== 'production' ? 'GW460330D' : null);
  if (!nino) return NextResponse.json({ error: 'NINO missing' }, { status: 400 });

  try {
    const token  = await getValidToken(profileId);
    const result = await triggerCalculation(nino, taxYear, token);
    return NextResponse.json({ calculationId: result.calculationId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = session.user.profileId;
  const { searchParams } = new URL(req.url);
  const taxYear       = searchParams.get('taxYear')!;
  const calculationId = searchParams.get('calculationId')!;

  const { data: hmrc } = await supabase
    .from('hmrc_connections')
    .select('nino')
    .eq('user_id', profileId)
    .single();

  const nino = hmrc?.nino ?? (process.env.HMRC_ENV !== 'production' ? 'GW460330D' : null);
  if (!nino) return NextResponse.json({ error: 'NINO missing' }, { status: 400 });

  try {
    const token  = await getValidToken(profileId);
    const result = await getCalculation(nino, taxYear, calculationId, token);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

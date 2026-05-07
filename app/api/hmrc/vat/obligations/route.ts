import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';
import { getValidToken, getVatObligations } from '@/lib/hmrc';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = session.user.profileId;

  const { data: hmrc } = await supabase
    .from('hmrc_connections')
    .select('vrn')
    .eq('user_id', profileId)
    .single();

  const vrn = hmrc?.vrn ?? (process.env.HMRC_ENV !== 'production' ? '999999999' : null);
  if (!vrn) return NextResponse.json({ error: 'VRN not found' }, { status: 400 });

  try {
    const token = await getValidToken(profileId);
    const obligations = await getVatObligations(vrn, token);
    return NextResponse.json({ obligations });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

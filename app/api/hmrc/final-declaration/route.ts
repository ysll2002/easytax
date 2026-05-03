import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';
import { getValidToken, submitFinalDeclaration } from '@/lib/hmrc';

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

  const nino = hmrc?.nino ?? (process.env.HMRC_ENV !== 'production' ? 'AA000003D' : null);
  if (!nino) return NextResponse.json({ error: 'NINO missing' }, { status: 400 });

  try {
    const token  = await getValidToken(profileId);
    const result = await submitFinalDeclaration(nino, taxYear, token);
    return NextResponse.json({ success: true, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

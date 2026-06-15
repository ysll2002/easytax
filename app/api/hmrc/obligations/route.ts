import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getValidToken, getObligations } from '@/lib/hmrc';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = session.user.profileId;

  const { data: hmrc } = await supabase
    .from('hmrc_connections')
    .select('nino, access_token, refresh_token, token_expires_at')
    .eq('user_id', profileId)
    .single();

  if (!hmrc) return NextResponse.json({ error: 'No HMRC connection' }, { status: 404 });

  const nino = hmrc.nino ?? (process.env.HMRC_ENV !== 'production' ? 'GW460330D' : null);
  if (!nino) return NextResponse.json({ error: 'NINO not found' }, { status: 400 });

  try {
    const token = await getValidToken(profileId);
    const obligations = await getObligations(nino, token);
    return NextResponse.json({ obligations });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'NINO_MISMATCH') {
      return NextResponse.json({ error: 'NINO_MISMATCH' }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getValidToken, getVatObligations } from '@/lib/hmrc';
import { clientFilingContext, AgentError } from '@/lib/agent';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = session.user.profileId;

  // ?clientId= : an agent reading an authorised client's VAT obligations.
  const clientId = req.nextUrl.searchParams.get('clientId');
  if (clientId) {
    try {
      const { client, token } = await clientFilingContext(profileId, clientId, 'vat');
      return NextResponse.json({ obligations: await getVatObligations(client.vrn!, token) });
    } catch (err) {
      if (err instanceof AgentError) return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
      return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
    }
  }

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

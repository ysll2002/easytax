import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getValidToken, submitVatReturn, type VatReturnPayload } from '@/lib/hmrc';
import { clientFilingContext, AgentError } from '@/lib/agent';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = session.user.profileId;

  // ?clientId= : an agent submitting an authorised client's VAT return.
  const clientId = req.nextUrl.searchParams.get('clientId');
  if (clientId) {
    try {
      const { client, token } = await clientFilingContext(profileId, clientId, 'vat');
      const payload: VatReturnPayload = await req.json();
      return NextResponse.json(await submitVatReturn(client.vrn!, payload, token));
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

  const payload: VatReturnPayload = await req.json();

  try {
    const token = await getValidToken(profileId);
    const result = await submitVatReturn(vrn, payload, token);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

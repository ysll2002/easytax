import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getBusinessDetails, getObligations, getVatObligations } from '@/lib/hmrc';
import { getClient, clientFilingContext } from '@/lib/agent';
import { agentUserId, errorResponse } from '../../../_shared';

// What is due for a client: Income Tax quarterly obligations and VAT return
// obligations, fetched with the agent's token. Each tax is reported on its
// own, so a VAT problem does not hide the Income Tax list.
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const uid = await agentUserId();
  if (!uid) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const id = (await params).id;
  try {
    const client = await getClient(uid, id);
    const out: Record<string, unknown> = {};

    if (client.itsa_status === 'authorised' && client.nino) {
      try {
        const { token } = await clientFilingContext(uid, id, 'itsa');
        if (!client.business_id) {
          const se = (await getBusinessDetails(client.nino, token)).find(b => b.typeOfBusiness === 'self-employment');
          if (se?.businessId) {
            await supabase.from('agent_clients').update({ business_id: se.businessId }).eq('id', id).eq('agent_user_id', uid);
          }
        }
        out.itsa = { obligations: await getObligations(client.nino, token) };
      } catch (err) {
        out.itsa = { error: err instanceof Error ? err.message : String(err) };
      }
    }
    if (client.vat_status === 'authorised' && client.vrn) {
      try {
        const { token } = await clientFilingContext(uid, id, 'vat');
        out.vat = { obligations: await getVatObligations(client.vrn, token) };
      } catch (err) {
        out.vat = { error: err instanceof Error ? err.message : String(err) };
      }
    }
    return NextResponse.json(out);
  } catch (err) {
    return errorResponse(err);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getValidToken, submitQuarterlyUpdate, type QuarterlyData } from '@/lib/hmrc';
import { resolveBusinessId } from '@/lib/hmrc-business';
import { clientFilingContext, AgentError } from '@/lib/agent';
import { submitAsAgent } from '@/lib/agent-filing';
import { figuresMatchRecords } from '@/lib/records-check';

const mismatch = (reason: string) => NextResponse.json({
  error: `${reason} Refill the figures from your records and try again.`,
  code: 'figures_do_not_match_records',
}, { status: 409 });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = session.user.profileId;
  const body: QuarterlyData & { taxYear: string } = await req.json();

  // ?clientId= : an agent submitting for an authorised client, with the
  // agent's own HMRC token and the client's NINO.
  const clientId = req.nextUrl.searchParams.get('clientId');
  if (clientId) {
    try {
      const ctx = await clientFilingContext(profileId, clientId, 'itsa');
      const check = await figuresMatchRecords(profileId, ctx.client.id, body);
      if (!check.ok) return mismatch(check.reason);
      return NextResponse.json(await submitAsAgent(profileId, ctx, body, check.recordIds));
    } catch (err) {
      if (err instanceof AgentError) return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
      return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
    }
  }

  const { data: hmrc } = await supabase
    .from('hmrc_connections')
    .select('nino, business_id')
    .eq('user_id', profileId)
    .single();

  if (!hmrc) return NextResponse.json({ error: 'No HMRC connection' }, { status: 404 });

  const nino = hmrc.nino ?? (process.env.HMRC_ENV !== 'production' ? 'GW460330D' : null);
  if (!nino) return NextResponse.json({ error: 'NINO missing' }, { status: 400 });

  const check = await figuresMatchRecords(profileId, null, body);
  if (!check.ok) return mismatch(check.reason);

  try {
    const token = await getValidToken(profileId);

    // Resolved here rather than at connect time. The OAuth callback used to
    // fetch this, and it is the one route that cannot attach a single
    // Gov-Client-* device header — see lib/hmrc-business.ts. This request came
    // from the dashboard through hmrcFetch, so it carries real device data,
    // and the lookup only happens on the first filing for a connection.
    const businessId = (await resolveBusinessId(profileId, nino, token, hmrc.business_id))
      ?? (process.env.HMRC_ENV !== 'production' ? 'XAIS12345678910' : null);

    if (!businessId) {
      return NextResponse.json({ error: 'businessId missing' }, { status: 400 });
    }

    const result = await submitQuarterlyUpdate(nino, businessId, body, token);

    const totalExpenses = Object.values(body.expenses ?? {}).reduce((s, v) => s + (v ?? 0), 0);
    await supabase.from('sa_filings').insert({
      user_id:         profileId,
      tax_year:        body.taxYear,
      filing_type:     'quarterly',
      period_start:    body.periodStartDate,
      period_end:      body.periodEndDate,
      turnover:        body.turnover,
      total_expenses:  totalExpenses,
      net_profit:      body.turnover - totalExpenses,
      expenses_detail: body.expenses,
      hmrc_response:   result,
      record_ids:      check.recordIds,
    });

    return NextResponse.json({ success: true, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

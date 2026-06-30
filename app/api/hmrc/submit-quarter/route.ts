import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
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
    const token  = await getValidToken(profileId);
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
    });

    return NextResponse.json({ success: true, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

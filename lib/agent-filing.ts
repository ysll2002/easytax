import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getBusinessDetails, submitQuarterlyUpdate, type QuarterlyData } from '@/lib/hmrc';
import { AgentError, type AgentClient } from '@/lib/agent';

// An agent's quarterly update for a client: the same HMRC call a taxpayer
// makes, sent with the agent's token for the client's NINO and business, and
// recorded in sa_filings under the agent with the client's id.
export async function submitAsAgent(
  agentUserId: string,
  ctx: { client: AgentClient; token: string },
  body: QuarterlyData & { taxYear: string },
  recordIds: string[] = [],
  figures?: { taxYear: string; cumulative: boolean; send: { periodStartDate: string; periodEndDate: string; turnover: number; expenses: Record<string, number> } },
) {
  const { client, token } = ctx;
  if (!client.nino) throw new AgentError('MISSING_NINO', 400, 'This client has no National Insurance number.');

  let businessId = client.business_id;
  if (!businessId) {
    const se = (await getBusinessDetails(client.nino, token)).find(b => b.typeOfBusiness === 'self-employment');
    businessId = se?.businessId ?? null;
    if (!businessId) throw new AgentError('NO_SELF_EMPLOYMENT', 400, 'HMRC has no self-employment business for this client.');
    await supabase.from('agent_clients').update({ business_id: businessId }).eq('id', client.id).eq('agent_user_id', agentUserId);
  }

  // From 2025-26 HMRC takes the year-to-date totals (records-check.ts).
  const sent = figures ? { ...figures.send, taxYear: figures.taxYear } : body;
  const result = await submitQuarterlyUpdate(client.nino, businessId, sent, token);

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const totalExpenses = round2(Object.values(body.expenses ?? {}).reduce((s, v) => s + (v ?? 0), 0));
  const { error: saveError } = await supabase.from('sa_filings').insert({
    user_id:         agentUserId,
    client_id:       client.id,
    tax_year:        figures?.taxYear ?? body.taxYear,
    filing_type:     'quarterly',
    period_start:    body.periodStartDate,
    period_end:      body.periodEndDate,
    turnover:        body.turnover,
    total_expenses:  totalExpenses,
    net_profit:      round2(body.turnover - totalExpenses),
    expenses_detail: body.expenses,
    hmrc_response:   { result, submittedAs: 'agent', cumulative: figures?.cumulative ?? false, sent },
    record_ids:      recordIds,
  });
  if (saveError && saveError.code !== '23505') console.warn('[agent-filing] sa_filings insert failed:', saveError.message);
  return { success: true, result, cumulative: figures?.cumulative ?? false, sent };
}

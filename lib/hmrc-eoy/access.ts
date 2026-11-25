import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { IS_HMRC_PRODUCTION } from '@/lib/hmrc-env';
import { getValidToken } from '@/lib/hmrc';
import { clientFilingContext, AgentError } from '@/lib/agent';
import type { Endpoint } from './catalog';

// Who a year-end request acts for, and with which HMRC token: the signed-in
// individual for themselves, or an agent for one of their authorised clients
// (?clientId=), using the agent's own token and the client's NINO.

export type EoyContext = {
  profileId:  string;
  clientId:   string | null;
  nino:       string;
  businessId: string | null;
  token:      string;
  agentType:  'main' | 'supporting' | null;
  /** Shown in the workspace so it is always clear whose return this is. */
  label:      string;
};

export class EoyError extends Error {
  constructor(public code: string, public status: number, message: string) { super(message); }
}

// Sandbox test user used when a sandbox connection has no NINO stored. Never
// used against the live API.
const SANDBOX_NINO = 'GW460330D';

export async function eoyContext(clientIdParam: string | null): Promise<EoyContext> {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) throw new EoyError('UNAUTHORIZED', 401, 'Sign in again.');
  const type = session.user.accountType;

  if (clientIdParam) {
    if (type !== 'agent') throw new EoyError('AGENT_ACCOUNT_REQUIRED', 403, 'Only agent accounts can work on client returns.');
    try {
      const { client, token } = await clientFilingContext(profileId, clientIdParam, 'itsa');
      if (!client.nino) throw new EoyError('NINO_MISSING', 400, `Add ${client.display_name}'s National Insurance number first.`);
      return {
        profileId, clientId: client.id, nino: client.nino, businessId: client.business_id, token,
        agentType: client.itsa_agent_type, label: client.display_name,
      };
    } catch (err) {
      if (err instanceof AgentError) throw new EoyError(err.code, err.status, err.message);
      throw err;
    }
  }

  if (type === 'agent') throw new EoyError('INDIVIDUAL_ACCOUNT_REQUIRED', 403, 'Agent accounts work on their clients\' returns only.');

  const { data: hmrc } = await supabase
    .from('hmrc_connections')
    .select('nino, business_id')
    .eq('user_id', profileId)
    .single();
  if (!hmrc) throw new EoyError('HMRC_NOT_CONNECTED', 400, 'Connect EasyTax to HMRC first.');
  const nino = hmrc.nino ?? (IS_HMRC_PRODUCTION ? null : SANDBOX_NINO);
  if (!nino) throw new EoyError('NINO_MISSING', 400, 'Add your National Insurance number in your HMRC settings first.');

  let token: string;
  try {
    token = await getValidToken(profileId);
  } catch (err) {
    throw new EoyError('HMRC_TOKEN', 401, err instanceof Error ? err.message : 'Reconnect to HMRC.');
  }
  return { profileId, clientId: null, nino, businessId: hmrc.business_id ?? null, token, agentType: null, label: 'You' };
}

// HMRC's MTD Income Tax end-to-end service guide, "Main and supporting agent
// access": a supporting agent can use only these APIs (and, for Business
// Details, only these endpoints). Everything else is main-agent only — tax
// calculations, the final declaration and the non-business income APIs.
const SUPPORTING_AGENT_APIS = new Set([
  'individuals-expenses-api', 'individual-losses-api', 'self-assessment-biss-api',
  'self-assessment-bsas-api', 'property-business-api', 'individuals-tax-liability-adjustments-api',
]);
const SUPPORTING_AGENT_BUSINESS_DETAILS = [
  'List All Businesses', 'Retrieve Business Details', 'Create and Amend Quarterly Period Type for a Business',
  'Retrieve Periods of Account', 'Create or Update Periods of Account',
  'Retrieve Late Accounting Date Rule Election', 'Disapply Late Accounting Date Rule', 'Withdraw Late Accounting Date Rule',
];

export function supportingAgentMay(e: Endpoint): boolean {
  if (SUPPORTING_AGENT_APIS.has(e.apiKey)) return true;
  if (e.apiKey === 'business-details-api') return SUPPORTING_AGENT_BUSINESS_DETAILS.includes(e.summary);
  return false;
}

// Which of these APIs EasyTax may call against the live API. HMRC grants
// production access per API, after reviewing sandbox testing; until an API is
// approved for EasyTax's production application, calls to it are refused here
// rather than sent. Set HMRC_PRODUCTION_EOY_APIS to a comma-separated list of
// approved api keys (as in lib/hmrc-eoy/catalog.json) once HMRC approves them.
// Business Details and Individual Calculations were approved with the in-year
// product on 2026-11-11; the final declaration itself is year-end and stays
// behind 'year-end' in the same list.
export function productionAllows(e: Endpoint, calculationType?: string): boolean {
  if (!IS_HMRC_PRODUCTION) return true;
  const approved = new Set((process.env.HMRC_PRODUCTION_EOY_APIS ?? '').split(',').map(s => s.trim()).filter(Boolean));
  if (e.apiKey === 'individual-calculations-api') {
    if (e.method === 'GET' || calculationType === 'in-year') return true;
    return approved.has('year-end');
  }
  if (e.apiKey === 'business-details-api' && /^(List All Businesses|Retrieve Business Details)$/.test(e.summary)) return true;
  return approved.has(e.apiKey);
}

/** The guided final declaration: approved by HMRC for the live API? */
export function yearEndApproved(): boolean {
  if (!IS_HMRC_PRODUCTION) return true;
  return (process.env.HMRC_PRODUCTION_EOY_APIS ?? '').split(',').map(x => x.trim()).includes('year-end');
}

/** Anything in the year-end workspace approved for the live API beyond what came with the in-year product? */
export function anyEoyApproved(): boolean {
  if (!IS_HMRC_PRODUCTION) return true;
  return (process.env.HMRC_PRODUCTION_EOY_APIS ?? '').split(',').some(x => x.trim() !== '');
}

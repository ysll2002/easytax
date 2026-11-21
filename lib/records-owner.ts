import { getClient, AgentError } from '@/lib/agent';
import { auth } from '@/auth';

// Whose records a request is about: the signed-in user's own (null), or one
// of their agent clients'. A client id is only accepted if that client
// belongs to the user.
//
// Individual and agent accounts are separate (lib/account-type.ts): only an
// agent account works on client records, and an agent account has no records
// of its own.
export async function recordsOwner(userId: string, clientIdParam: string | null | undefined): Promise<string | null> {
  const type = (await auth())?.user?.accountType;
  if (!clientIdParam) {
    if (type === 'agent') throw new AgentError('INDIVIDUAL_ACCOUNT_REQUIRED', 403, 'Agent accounts work on their clients\' records only.');
    return null;
  }
  if (type !== 'agent') throw new AgentError('AGENT_ACCOUNT_REQUIRED', 403, 'Only agent accounts can work on client records.');
  const client = await getClient(userId, clientIdParam);
  return client.id;
}

// Supabase filter for "this owner's records". Typed loosely on purpose:
// the query builder's generics are too deep for a structural constraint.
type Filterable = { eq: (c: string, v: string) => unknown; is: (c: string, v: null) => unknown };
export function ownerFilter<Q>(q: Q, clientId: string | null): Q {
  const f = q as unknown as Filterable;
  return (clientId ? f.eq('client_id', clientId) : f.is('client_id', null)) as Q;
}

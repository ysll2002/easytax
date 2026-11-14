import { getClient } from '@/lib/agent';

// Whose records a request is about: the signed-in user's own (null), or one
// of their agent clients'. A client id is only accepted if that client
// belongs to the user.
export async function recordsOwner(userId: string, clientIdParam: string | null | undefined): Promise<string | null> {
  if (!clientIdParam) return null;
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

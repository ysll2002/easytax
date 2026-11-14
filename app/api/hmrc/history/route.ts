import { NextRequest, NextResponse } from 'next/server';
import { recordsOwner } from '@/lib/records-owner';
import { AgentError } from '@/lib/agent';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// The user's own filings, or with ?clientId= the filings they made as an
// agent for that client.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let clientId: string | null;
  try { clientId = await recordsOwner(session.user.profileId, req.nextUrl.searchParams.get('clientId')); }
  catch (err) {
    if (err instanceof AgentError) return NextResponse.json({ error: err.code }, { status: err.status });
    throw err;
  }

  const base = supabase.from('sa_filings').select('*').eq('user_id', session.user.profileId);
  const { data, error } = await (clientId ? base.eq('client_id', clientId) : base.is('client_id', null))
    .order('submitted_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ filings: data ?? [] });
}

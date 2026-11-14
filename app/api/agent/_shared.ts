import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AgentError } from '@/lib/agent';

export async function agentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.profileId ?? null;
}

export function errorResponse(err: unknown) {
  if (err instanceof AgentError) return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
  const msg = err instanceof Error ? err.message : String(err);
  console.error('[agent]', msg);
  return NextResponse.json({ error: 'UNEXPECTED', message: 'Something went wrong talking to HMRC. Please try again.' }, { status: 502 });
}

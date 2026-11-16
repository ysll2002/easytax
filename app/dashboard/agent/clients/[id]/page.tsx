import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { AGENT_MODE_AVAILABLE, SANDBOX_CLIENT_SIMULATION, getClient, AgentError } from '@/lib/agent';
import ClientDetail from './ClientDetail';

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  if (!AGENT_MODE_AVAILABLE) notFound();
  const session = await auth();
  const { id } = await params;
  try {
    const client = await getClient(session!.user.profileId, id);
    return <ClientDetail initial={client} sandbox={SANDBOX_CLIENT_SIMULATION} />;
  } catch (err) {
    if (err instanceof AgentError) notFound();
    throw err;
  }
}

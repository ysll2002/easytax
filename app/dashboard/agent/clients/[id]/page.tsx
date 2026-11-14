import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { AGENT_MODE_AVAILABLE, getClient, AgentError } from '@/lib/agent';
import ClientDetail from './ClientDetail';

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  if (!AGENT_MODE_AVAILABLE) notFound();
  const session = await auth();
  const { id } = await params;
  try {
    const client = await getClient(session!.user.profileId, id);
    return <ClientDetail initial={client} />;
  } catch (err) {
    if (err instanceof AgentError) notFound();
    throw err;
  }
}

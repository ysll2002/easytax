import { AGENT_MODE_AVAILABLE, SANDBOX_CLIENT_SIMULATION } from '@/lib/agent';
import { Suspense } from 'react';
import AgentHome from './AgentHome';

export default function AgentPage() {
  if (!AGENT_MODE_AVAILABLE) {
    return (
      <div className="p-4 sm:p-8 max-w-xl">
        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>Agent clients</h1>
        <p style={{ color: '#4A4035', lineHeight: 1.6 }}>
          Filing for clients as an agent is not available yet. It will open once HMRC grants MTD Buddy production access for agent services.
        </p>
      </div>
    );
  }
  return <Suspense><AgentHome sandbox={SANDBOX_CLIENT_SIMULATION} /></Suspense>;
}

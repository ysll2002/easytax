// Client-safe types for agent mode (lib/agent.ts is server-only).
export type AuthStatus = 'none' | 'pending' | 'authorised' | 'rejected' | 'expired' | 'cancelled' | 'deauthorised';

export type AgentClientView = {
  id: string;
  display_name: string;
  client_type: 'personal' | 'business';
  nino: string | null;
  postcode: string | null;
  business_id: string | null;
  itsa_agent_type: 'main' | 'supporting';
  itsa_status: AuthStatus;
  itsa_client_action_url: string | null;
  itsa_expires_on: string | null;
  vrn: string | null;
  vat_reg_date: string | null;
  vat_status: AuthStatus;
  vat_client_action_url: string | null;
  vat_expires_on: string | null;
  last_checked_at: string | null;
};

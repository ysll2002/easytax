// Individual (taxpayer) and agent (acting for clients) accounts are kept
// apart: separate sign-up and sign-in pages, separate dashboards. The type is
// stored on the profile and fixed at sign-up.
export type AccountType = 'individual' | 'agent';

export const ACCOUNT_TYPES: AccountType[] = ['individual', 'agent'];

export function asAccountType(v: unknown): AccountType {
  return v === 'agent' ? 'agent' : 'individual';
}

// Set by the sign-in / sign-up page just before Google sign-in, so the auth
// callback knows which entry the person used (Google sign-in carries no
// custom fields). Short-lived and not sensitive.
export const ACCOUNT_TYPE_COOKIE = 'et_account_type';

export const LOGIN_PATH: Record<AccountType, string> = { individual: '/login', agent: '/agent/login' };
export const REGISTER_PATH: Record<AccountType, string> = { individual: '/register', agent: '/agent/register' };
export const HOME_PATH: Record<AccountType, string> = { individual: '/dashboard', agent: '/dashboard/agent' };

// Error codes passed back to a sign-in page when the email belongs to the
// other kind of account.
export const WRONG_TYPE_ERROR: Record<AccountType, string> = {
  individual: 'agent_account',      // used the individual entry with an agent account
  agent:      'individual_account', // used the agent entry with an individual account
};

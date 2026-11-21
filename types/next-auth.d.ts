import { DefaultSession } from 'next-auth';
import type { AccountType } from '@/lib/account-type';

declare module 'next-auth' {
  interface Session {
    user: {
      profileId: string;
      accountType: AccountType;
    } & DefaultSession['user'];
  }
}

import NextAuth, { CredentialsSignin } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { track, EVENTS } from '@/lib/analytics';
import { NEW_SIGNUP_COOKIE } from '@/lib/signup-beacon';
import {
  ACCOUNT_TYPE_COOKIE, LOGIN_PATH, WRONG_TYPE_ERROR, asAccountType, type AccountType,
} from '@/lib/account-type';

// Allow NextAuth to infer the URL from request headers on Vercel Preview deployments
if (process.env.VERCEL_URL && !process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

// Individual and agent accounts are separate (lib/account-type.ts). Signing in
// at one entry with an account of the other type is refused with a code the
// sign-in page turns into "use the other sign-in".
class WrongAccountType extends CredentialsSignin {
  constructor(code: string) { super(); this.code = code; }
}

/** Which entry the person came through, from the cookie the sign-in page sets. */
async function intendedType(): Promise<AccountType | null> {
  try {
    const v = (await cookies()).get(ACCOUNT_TYPE_COOKIE)?.value;
    return v === 'agent' || v === 'individual' ? v : null;
  } catch {
    return null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email:       { label: 'Email',    type: 'email' },
        password:    { label: 'Password', type: 'password' },
        accountType: { label: 'Account type', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, name, avatar_url, password_hash, account_type')
          .eq('email', credentials.email)
          .single();

        if (!profile?.password_hash) return null;

        const valid = await bcrypt.compare(credentials.password as string, profile.password_hash);
        if (!valid) return null;

        // Checked only after the password, so the error cannot be used to
        // find out what kind of account an email has.
        const wanted = asAccountType(credentials.accountType);
        if (asAccountType(profile.account_type) !== wanted) throw new WrongAccountType(WRONG_TYPE_ERROR[wanted]);

        return { id: profile.id, email: profile.email, name: profile.name, image: profile.avatar_url };
      },
    }),
  ],
  pages: { signIn: '/login' },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        const wanted = await intendedType();
        const { data: existing } = await supabase
          .from('profiles')
          .select('id, account_type')
          .eq('email', user.email)
          .single();

        if (!existing) {
          const accountType = wanted ?? 'individual';
          const { data: created, error } = await supabase.from('profiles').insert({
            email: user.email,
            name:  user.name,
            avatar_url: user.image,
            account_type: accountType,
          }).select('id').single();
          // A Google sign-up is a registration too. It used to create the
          // profile without any event, so these sign-ups were missing from
          // the funnel in /api/admin/daily-metrics and from GA.
          const path = accountType === 'agent' ? '/agent/register' : '/register';
          if (error) {
            console.error('[auth] google sign-up insert failed', { code: error.code, message: error.message });
            await track({ name: EVENTS.registerFailed, path, props: { method: 'google', code: error.code || 'db_error', accountType } });
          } else {
            await track({ name: EVENTS.registerCompleted, userId: created?.id ?? null, path, props: { method: 'google', accountType } });
            // Read once by components/SignupBeacon.tsx on the dashboard, which
            // sends GA its register_success; GA never sees the server.
            try {
              (await cookies()).set(NEW_SIGNUP_COOKIE, 'google', { path: '/', maxAge: 600, sameSite: 'lax', secure: true, httpOnly: false });
            } catch { /* not settable here: GA misses this one, our own event has it */ }
          }
        } else if (wanted && asAccountType(existing.account_type) !== wanted) {
          return `${LOGIN_PATH[wanted]}?error=${WRONG_TYPE_ERROR[wanted]}`;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, account_type')
          .eq('email', user.email)
          .single();
        token.profileId = profile?.id;
        token.accountType = asAccountType(profile?.account_type);
      } else if (token.profileId && !token.accountType) {
        // Sessions from before account types existed.
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', token.profileId as string)
          .single();
        token.accountType = asAccountType(profile?.account_type);
      }
      return token;
    },
    async session({ session, token }) {
      session.user.profileId = token.profileId as string;
      session.user.accountType = asAccountType(token.accountType);
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.includes('/actions')) return `${baseUrl}/dashboard`;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/dashboard`;
    },
  },
});

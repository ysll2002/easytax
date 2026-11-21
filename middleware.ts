import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { HOME_PATH, LOGIN_PATH, asAccountType } from '@/lib/account-type';

// Individual and agent accounts each have their own dashboard
// (lib/account-type.ts):
//   individual  everything under /dashboard except /dashboard/agent
//   agent       /dashboard/agent, plus the shared account pages, plus the
//               filing pages when they are opened for one of their clients
//               (?clientId=), which is how an agent files a quarterly update
//               or VAT return for a client.
// The APIs check the account type too; this keeps people on the right pages.

const SHARED = ['/dashboard/profile', '/dashboard/settings'];
const CLIENT_PAGES = ['/dashboard/individual', '/dashboard/reconcile', '/dashboard/company'];

const under = (path: string, prefix: string) => path === prefix || path.startsWith(prefix + '/');

export default auth(req => {
  const { pathname, searchParams } = req.nextUrl;
  const to = (path: string) => NextResponse.redirect(new URL(path, req.nextUrl.origin));

  if (!req.auth?.user) {
    // The dashboard layout sends signed-out visitors to /login; agent pages
    // go to the agent sign-in instead.
    return under(pathname, '/dashboard/agent') ? to(LOGIN_PATH.agent) : NextResponse.next();
  }

  const type = asAccountType(req.auth.user.accountType);
  if (type === 'individual') {
    return under(pathname, '/dashboard/agent') ? to(HOME_PATH.individual) : NextResponse.next();
  }

  // Agent account.
  if (under(pathname, '/dashboard/agent') || SHARED.some(p => under(pathname, p))) return NextResponse.next();
  if (CLIENT_PAGES.some(p => under(pathname, p)) && searchParams.get('clientId')) return NextResponse.next();
  return to(HOME_PATH.agent);
});

export const config = {
  matcher: ['/dashboard/:path*'],
};

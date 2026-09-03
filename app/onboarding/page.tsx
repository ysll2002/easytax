import { redirect } from 'next/navigation';

// This route used to render a mock "Link your HMRC Gateway" form that asked
// for a Government Gateway user ID and password, showed a fake progress
// spinner, and then sent people to the dashboard. Nothing linked to it, but a
// page that collects HMRC passwords is the wrong thing to have lying around
// while HMRC is reviewing the app. The real connection is HMRC's OAuth flow
// under Self Assessment → Connect HMRC, so send anyone who lands here there.
export default function Onboarding() {
  redirect('/dashboard/individual');
}

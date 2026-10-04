'use client';

import { usePathname } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { isEmbedPath } from '@/lib/embed';

// Google Analytics and Vercel Analytics, everywhere except inside the widget.
//
// This exists for one reason. `/embed/*` renders inside somebody else's page,
// and the root layout would otherwise load both of these there — putting our
// analytics, and Google's cookies, in front of visitors who came to read an
// accountant's blog and have consented to nothing of ours. That is not our
// consent to collect, it is a compliance problem we would be handing to the
// person who did us the favour of embedding, and /tools/embed promises in
// writing that the widget sets no cookies on their visitors.
//
// The widget still records that it was served, server-side, against the
// embedding domain and nothing else — no cookie, no identifier, no page path.
//
// The pathname check needs a client component, and the layout is a server one,
// which is the only reason this file is a wrapper rather than two lines in the
// layout.
export default function SiteAnalytics({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  if (isEmbedPath(pathname)) return null;

  return (
    <>
      <Analytics />
      <GoogleAnalytics gaId={gaId} />
    </>
  );
}

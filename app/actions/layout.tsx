import type { Metadata } from 'next';

// Product-preview page with sample data. Keeping it out of the index stops it
// competing with the real landing pages and stops a search result implying the
// sample figures are a live account.
export const metadata: Metadata = {
  title: 'Action plan demo',
  robots: { index: false, follow: false },
};

export default function ActionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

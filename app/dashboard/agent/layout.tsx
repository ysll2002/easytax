import type { Metadata } from 'next';

// Own <title> (WCAG 2.4.2 Page Titled).
export const metadata: Metadata = { title: 'Agent clients' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';

// The page itself is a client component and cannot export metadata, so its
// <title> lives here. Without it the page inherited the home page's title,
// which fails WCAG 2.4.2 (Page Titled).
export const metadata: Metadata = {
  title: 'Log in',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

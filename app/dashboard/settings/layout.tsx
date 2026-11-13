import type { Metadata } from 'next';

// Gives this dashboard route its own <title> (WCAG 2.4.2 Page Titled); the
// root layout's template appends "| EasyTax".
export const metadata: Metadata = {
  title: 'Settings',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

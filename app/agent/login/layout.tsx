import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agent sign in',
  description: 'Sign in to EasyTax as an accountant or tax agent filing Making Tax Digital updates for your clients.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

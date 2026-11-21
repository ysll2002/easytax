import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create an agent account',
  description: 'Create an EasyTax agent account to file Making Tax Digital quarterly updates and VAT returns for your clients.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

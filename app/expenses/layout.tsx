import type { Metadata } from 'next';

// Product-preview page with sample data — see app/actions/layout.tsx.
export const metadata: Metadata = {
  title: 'Expense review demo',
  robots: { index: false, follow: false },
};

export default function ExpensesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

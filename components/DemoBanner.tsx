import Link from 'next/link';
import { FlaskConical } from 'lucide-react';

// Shown on the product-preview pages (/actions, /expenses).
//
// Those pages render fixed sample data — invented transactions, invented
// income figures — but previously described it as the visitor's own ("Based on
// your HMRC data…", "Our AI flagged 5 transactions"). They are reachable
// without logging in, so a first-time visitor had no way to tell the numbers
// were made up. This banner is the disclosure that makes them honest.

export default function DemoBanner({
  children = 'This is an interactive demo with sample figures — not a real account. Nothing here is connected to HMRC.',
}: {
  children?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl px-4 py-3 sm:px-5 sm:py-4 mb-8"
      style={{ backgroundColor: '#F5EDDC', border: '1px solid #E0CFA8' }}
      role="note"
    >
      <FlaskConical size={18} style={{ color: '#9A6B1A', flexShrink: 0, marginTop: 2 }} />
      <p className="text-xs sm:text-sm leading-relaxed m-0" style={{ color: '#7A5714' }}>
        <strong style={{ color: '#5E430F' }}>Demo.</strong> {children}{' '}
        <Link href="/register" style={{ color: '#9A6B1A', textDecoration: 'underline' }}>
          Create an account
        </Link>{' '}
        to work with your own figures.
      </p>
    </div>
  );
}

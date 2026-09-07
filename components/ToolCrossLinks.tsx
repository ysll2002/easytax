import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { otherTools, type ToolKey } from '@/lib/tools';

// Cross-links between the free calculators.
//
// Each tool page was a leaf: it answered its one question and then offered the
// reader nothing. Someone working out a late filing penalty is, by definition,
// someone with a Self Assessment problem — the payments on account calculator
// is the next question they have. Linking the set also gives every tool a
// third inbound internal link, which is what gets a page crawled.

export default function ToolCrossLinks({ current }: { current: ToolKey }) {
  const others = otherTools(current);

  return (
    <section className="mt-14 pt-8" style={{ borderTop: '1px solid #E8E2DA' }}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
        <h2
          style={{
            fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#1C1208',
          }}
        >
          Other free tools
        </h2>
        <Link
          href="/tools"
          className="text-sm font-medium"
          style={{ color: '#C4622D', textDecoration: 'none' }}
        >
          All free tools →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {others.map(t => (
          <Link key={t.href} href={t.href} style={{ textDecoration: 'none' }}>
            <div
              className="h-full p-5 rounded-2xl transition-all hover:shadow-md flex flex-col"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2DA' }}
            >
              <p className="font-semibold text-sm mb-1.5" style={{ color: '#1C1208' }}>
                {t.name}
              </p>
              <p className="text-xs flex-1 mb-3" style={{ color: '#9A8F83', lineHeight: 1.6 }}>
                {t.question}
              </p>
              <span
                className="inline-flex items-center gap-1.5 text-xs font-medium"
                style={{ color: '#C4622D' }}
              >
                Open the calculator <ArrowRight size={13} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

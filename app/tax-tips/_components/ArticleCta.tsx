'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { trackClient } from '@/components/PageViewTracker';
import DeadlineScheduleForm from '@/components/DeadlineScheduleForm';

// Conversion path for article traffic.
//
// The Tax Tips archive is the site's largest body of indexable content, but an
// article page linked only back to the article index — a reader who arrived
// from search had no route to the product at all. The click is tracked so the
// archive's contribution to signups is measurable rather than assumed.

export default function ArticleCta({ slug }: { slug: string }) {
  return (
    <aside
      className="mt-12 p-5 sm:p-6 rounded-2xl"
      style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}
    >
      <p
        style={{
          fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
          fontSize: '1.15rem',
          fontWeight: 700,
          color: '#1C1208',
          marginBottom: '0.5rem',
        }}
      >
        When does this apply to you?
      </p>
      <p className="text-sm mb-5" style={{ color: '#4A4035', lineHeight: 1.65 }}>
        Making Tax Digital replaces one annual return with four quarterly updates and a final
        declaration. Find out which tax year that starts for you, and we will send you the dates.
      </p>

      {/* A reader who arrived from search has a question, not an intention to
          sign up — and filing is not open yet, so "create a free account" asks
          them to do something that does nothing for them today. The dates are
          something we can actually give them now. */}
      <DeadlineScheduleForm
        source={`article:${slug}`}
        heading="Get your MTD deadlines by email"
        blurb="Enter your qualifying income and we will work out which tax year brings you into MTD, your four quarterly dates and your final declaration date."
      />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center mt-5">
        <Link
          href="/tools"
          onClick={() => trackClient('article_cta_click', { slug, target: 'tools' })}
          className="inline-flex items-center justify-center gap-2"
          style={{
            color: '#4A4035',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 500,
            minHeight: '44px',
          }}
        >
          Free tax calculators <ArrowRight size={14} />
        </Link>

        <Link
          href="/trust"
          onClick={() => trackClient('article_cta_click', { slug, target: 'trust' })}
          className="inline-flex items-center justify-center gap-1.5"
          style={{
            color: '#4A4035',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 500,
            minHeight: '44px',
          }}
        >
          <ShieldCheck size={14} /> How we handle your data
        </Link>
      </div>
    </aside>
  );
}

'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { trackClient } from '@/components/PageViewTracker';

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
        Filing this yourself?
      </p>
      <p className="text-sm mb-4" style={{ color: '#4A4035', lineHeight: 1.65 }}>
        EasyTax sends MTD ITSA quarterly updates, Self Assessment, VAT returns and CT600 straight to
        HMRC. £20 + VAT per submission, no monthly subscription, and no card to create an account.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <Link
          href="/register"
          onClick={() => trackClient('article_cta_click', { slug, target: 'register' })}
          className="inline-flex items-center justify-center gap-2"
          style={{
            backgroundColor: '#C4622D',
            color: '#FDFCF8',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            padding: '0.75rem 1.5rem',
            borderRadius: '50px',
            minHeight: '44px',
          }}
        >
          Create a free account <ArrowRight size={15} />
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

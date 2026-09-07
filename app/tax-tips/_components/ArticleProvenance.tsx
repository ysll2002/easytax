import Link from 'next/link';
import { BookOpen, CircleAlert, UserCheck } from 'lucide-react';

// Who wrote this, how, and whether a person checked it.
//
// The archive is 140 pages of UK tax guidance produced by a model on a cron.
// Until now every one of them was presented with a date and nothing else: no
// author, no method, no statement of whether a human had ever read it. For
// advice about someone's tax bill that is the wrong way round — the reader is
// the one carrying the consequences of a mistake, so the reader is owed the
// provenance.
//
// The honest version is also the useful one. An article that has been through
// review says so and names the date; one that predates the review gate says
// that instead, rather than borrowing credibility it has not earned.

export type Provenance = {
  publishedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ArticleProvenance({ publishedAt, reviewedAt, reviewedBy }: Provenance) {
  const reviewed = Boolean(reviewedAt);

  return (
    <div
      className="mb-8 p-4 sm:p-5 rounded-xl"
      style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}
    >
      <div className="flex items-start gap-2.5">
        {reviewed ? (
          <UserCheck size={16} color="#6B8E6E" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
        ) : (
          <CircleAlert size={16} color="#9A8F83" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
        )}

        <div className="min-w-0">
          <p className="text-sm" style={{ color: '#4A4035', lineHeight: 1.6, margin: 0 }}>
            <strong style={{ color: '#1C1208' }}>
              Drafted by EasyTax&apos;s automated research pipeline
            </strong>{' '}
            from HMRC guidance and UK legislation, published by Finance Panda Limited on{' '}
            {formatDate(publishedAt)}.
          </p>

          <p className="text-sm mt-1.5" style={{ color: '#4A4035', lineHeight: 1.6, margin: '0.375rem 0 0' }}>
            {reviewed ? (
              <>
                Checked before publication by {reviewedBy?.trim() || 'the EasyTax editorial team'} on{' '}
                {formatDate(reviewedAt as string)}.
              </>
            ) : (
              <>
                This article predates our editorial review gate and has{' '}
                <strong style={{ color: '#1C1208' }}>not been individually checked by a person</strong>.
                We are working back through the archive. Treat the figures and dates here as a
                starting point and verify anything you are about to act on.
              </>
            )}
          </p>

          <Link
            href="/editorial-standards"
            className="inline-flex items-center gap-1.5 text-xs mt-2.5 font-medium"
            style={{ color: '#C4622D', textDecoration: 'none', minHeight: 32 }}
          >
            <BookOpen size={13} /> How we write and check these articles
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Renders the grounding references a reviewed article was written against.
 *  Nothing is shown when the article carries none, which is every article
 *  written before the generator started recording them. */
export function ArticleSources({ sources }: { sources: unknown }) {
  const list = Array.isArray(sources)
    ? sources.filter((s): s is { label: string; url?: string } =>
        !!s && typeof s === 'object' && typeof (s as { label?: unknown }).label === 'string')
    : [];

  if (list.length === 0) return null;

  return (
    <section className="mt-12 pt-8" style={{ borderTop: '1px solid #E8E2DA' }}>
      <h2
        className="mb-3"
        style={{
          fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
          fontSize: '1.15rem',
          fontWeight: 700,
          color: '#1C1208',
        }}
      >
        Sources
      </h2>
      <ul className="list-none p-0 m-0 space-y-2">
        {list.map((s, i) => (
          <li key={i} className="text-sm" style={{ color: '#4A4035', lineHeight: 1.6 }}>
            {s.url ? (
              <a
                href={s.url}
                rel="nofollow noopener"
                target="_blank"
                style={{ color: '#C4622D', textDecoration: 'none' }}
              >
                {s.label}
              </a>
            ) : (
              s.label
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

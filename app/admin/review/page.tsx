import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, Clock, FileText } from 'lucide-react';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { hasSupabaseEnv } from '@/app/tax-tips/_lib/articles';
import { readQueue, type DraftRow } from '@/lib/review-queue';
import { gradeArticle, normaliseSources, STANDARD } from '@/lib/article-quality';
import ReviewActions from '@/components/ReviewActions';

// The editorial review queue — the missing half of the 2026-09-06 review gate.
//
// The gate stopped the daily cron publishing model-drafted tax guidance
// straight to the public archive, which was right. But the release action
// existed only as a POST to /api/admin/article-review, i.e. only as a curl
// command carrying a secret, so in practice nobody ever released anything: the
// archive last gained a page on 2026-09-07 and was still frozen five days
// later with drafts stacking up behind it. A control nobody can operate is an
// outage with good intentions.
//
// This is deliberately a plain page. Read the draft, see where it falls short
// of STANDARD, publish or reject. Nothing else.
//
// Access is the same AGENT_METRICS_KEY that guards /api/admin/*, passed as
// ?key=. That is weaker than a session and it is a considered choice: the
// alternative is wiring an owner role through auth.ts, which is under active
// HMRC review and must not be touched for an internal tool. The mitigations
// are that the key is checked server-side before any content renders, the page
// is noindex, and /admin is disallowed in robots.txt.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Editorial review queue',
  robots: { index: false, follow: false },
};

const INK = '#1C1208';
const BODY = '#4A4035';
const MUTED = '#9A8F83';
const LINE = '#E8E2DA';
const CREAM = '#FDFCF8';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F3EC' }}>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">{children}</main>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="p-5 sm:p-7 rounded-2xl mb-5"
      style={{ backgroundColor: CREAM, border: `1.5px solid ${LINE}` }}
    >
      {children}
    </div>
  );
}

/** How long a draft has been waiting, in words rather than a timestamp — the
 *  only thing the reviewer needs from it is whether it is going stale. */
function waited(hours: number): string {
  if (hours < 1) return 'just now';
  if (hours < 48) return `${Math.round(hours)} hours ago`;
  return `${Math.round(hours / 24)} days ago`;
}

/** The quality report, as a row of pass/fail chips. The cron already grades
 *  every draft against STANDARD before it inserts it; showing the same grade
 *  here is what turns a twenty-minute read into a thirty-second decision. */
function Grade({ draft }: { draft: DraftRow }) {
  const report = gradeArticle({
    title:   draft.title,
    excerpt: draft.excerpt,
    content: draft.content ?? '',
    sources: normaliseSources(draft.sources),
  });

  const chips: { label: string; ok: boolean }[] = [
    { label: `${report.words} words`,            ok: report.words >= STANDARD.minWords && report.words <= STANDARD.maxWords },
    { label: `${report.headings} headings`,      ok: report.headings >= STANDARD.minHeadings },
    { label: `${report.primarySources} gov.uk sources`, ok: report.primarySources >= STANDARD.minSources },
    { label: `${report.moneyFigures} figures`,   ok: report.moneyFigures >= STANDARD.minMoneyFigures },
    { label: report.hasTable ? 'has table' : 'no table', ok: report.hasTable },
    { label: `excerpt ${draft.excerpt?.length ?? 0} chars`, ok: (draft.excerpt?.length ?? 0) <= STANDARD.maxExcerptChars },
  ];

  return (
    <div className="mb-4">
      <ul className="list-none p-0 m-0 flex flex-wrap gap-1.5">
        {chips.map(c => (
          <li
            key={c.label}
            className="text-xs px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: c.ok ? '#6B8E6E1A' : '#B3261E14',
              color: c.ok ? '#4A6B4D' : '#B3261E',
              border: `1px solid ${c.ok ? '#6B8E6E40' : '#B3261E40'}`,
            }}
          >
            {c.label}
          </li>
        ))}
      </ul>
      {report.failures.length > 0 && (
        <ul className="list-disc pl-5 mt-3 mb-0 text-sm" style={{ color: '#B3261E' }}>
          {report.failures.map(f => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; slug?: string; reviewer?: string }>;
}) {
  const { key = '', slug, reviewer: reviewerParam } = await searchParams;
  const expected = process.env.AGENT_METRICS_KEY;

  if (!expected) {
    return (
      <Shell>
        <Card>
          <h1 style={{ color: INK, fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
            Not configured
          </h1>
          <p className="text-sm mt-2 mb-0" style={{ color: BODY }}>
            <code>AGENT_METRICS_KEY</code> is not set in this environment, so there is nothing to
            check the key against.
          </p>
        </Card>
      </Shell>
    );
  }

  // Checked before a single draft is read, let alone rendered.
  if (key !== expected) {
    return (
      <Shell>
        <Card>
          <h1 style={{ color: INK, fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
            Editorial review queue
          </h1>
          <p className="text-sm mt-2" style={{ color: BODY }}>
            Append the admin key to the URL to open the queue:
          </p>
          <p className="text-sm m-0" style={{ color: MUTED }}>
            <code>/admin/review?key=…</code> — the same key as{' '}
            <code>/api/admin/daily-metrics</code>.
          </p>
        </Card>
      </Shell>
    );
  }

  const reviewer = reviewerParam?.trim()?.slice(0, 120) || 'Lin Li';

  // One draft, in full, for actually reading before publishing.
  if (slug) {
    if (!hasSupabaseEnv()) {
      return (
        <Shell>
          <Card>
            <p className="m-0 text-sm" style={{ color: BODY }}>
              No Supabase credentials in this environment.
            </p>
          </Card>
        </Shell>
      );
    }

    const { data, error } = await supabase
      .from('tax_articles')
      .select('title, slug, excerpt, content, sources, published_at, review_status')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return (
        <Shell>
          <Card>
            <p className="m-0 text-sm" style={{ color: '#B3261E' }}>
              {error?.message ?? 'No article with that slug.'}
            </p>
            <p className="mt-3 mb-0 text-sm">
              <Link href={`/admin/review?key=${encodeURIComponent(key)}`} style={{ color: '#C4622D' }}>
                Back to the queue
              </Link>
            </p>
          </Card>
        </Shell>
      );
    }

    const article = data as unknown as DraftRow & { review_status: string };
    const sources = normaliseSources(article.sources) ?? [];

    return (
      <Shell>
        <p className="text-sm mb-5">
          <Link href={`/admin/review?key=${encodeURIComponent(key)}`} style={{ color: '#C4622D' }}>
            ← Back to the queue
          </Link>
        </p>

        <Card>
          <p className="text-xs uppercase tracking-wide m-0 mb-2" style={{ color: MUTED }}>
            {article.review_status}
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
              fontSize: 'clamp(1.4rem, 3.5vw, 2rem)',
              fontWeight: 700,
              color: INK,
              lineHeight: 1.25,
              margin: '0 0 0.75rem',
            }}
          >
            {article.title}
          </h1>
          <p className="text-sm mb-4" style={{ color: BODY, lineHeight: 1.6 }}>
            {article.excerpt}
          </p>

          <Grade draft={article} />

          {sources.length > 0 && (
            <div className="mb-5">
              <p className="text-xs uppercase tracking-wide m-0 mb-2" style={{ color: MUTED }}>
                Sources
              </p>
              <ul className="list-disc pl-5 m-0 text-sm" style={{ color: BODY }}>
                {sources.map(s => (
                  <li key={s.label}>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: '#C4622D' }}>
                        {s.label}
                      </a>
                    ) : (
                      s.label
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {article.review_status === 'draft' && (
            <ReviewActions slug={article.slug} adminKey={key} reviewer={reviewer} kind="draft" />
          )}
        </Card>

        <Card>
          {/* The body as the reader would see it. It is already run through
              sanitiseArticleHtml by the cron before insert, which is the
              boundary that makes this safe to render. */}
          <div
            className="article-body"
            style={{ color: BODY, lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: article.content ?? '' }}
          />
        </Card>
      </Shell>
    );
  }

  const queue = await readQueue();

  return (
    <Shell>
      <h1
        style={{
          fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
          fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
          fontWeight: 700,
          color: INK,
          margin: '0 0 0.5rem',
        }}
      >
        Editorial review queue
      </h1>
      <p className="text-sm mb-6" style={{ color: MUTED }}>
        Publishing as <strong style={{ color: BODY }}>{reviewer}</strong>. Add{' '}
        <code>&amp;reviewer=Name</code> to change who is stamped on the article.
      </p>

      {queue.note && (
        <div
          className="p-4 rounded-xl mb-5 flex items-start gap-2.5"
          style={{ backgroundColor: '#B3261E0F', border: '1px solid #B3261E40' }}
        >
          <AlertTriangle size={16} color="#B3261E" className="flex-shrink-0 mt-0.5" />
          <p className="m-0 text-sm" style={{ color: '#B3261E' }}>{queue.note}</p>
        </div>
      )}

      {/* The freeze indicator. This is the number whose absence let the archive
          sit still for five days, so it is the first thing on the page. */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide m-0 mb-1" style={{ color: MUTED }}>
              Days since last publish
            </p>
            <p
              className="m-0"
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: (queue.daysSinceLastPublish ?? 0) >= 2 ? '#B3261E' : INK,
              }}
            >
              {queue.daysSinceLastPublish ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide m-0 mb-1" style={{ color: MUTED }}>
              Drafts waiting
            </p>
            <p className="m-0" style={{ fontSize: '1.75rem', fontWeight: 700, color: INK }}>
              {queue.drafts?.length ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide m-0 mb-1" style={{ color: MUTED }}>
              Published articles
            </p>
            <p className="m-0" style={{ fontSize: '1.75rem', fontWeight: 700, color: INK }}>
              {queue.publishedCount ?? '—'}
            </p>
          </div>
        </div>
      </Card>

      <h2 style={{ color: INK, fontSize: '1.1rem', fontWeight: 700, margin: '1.5rem 0 0.75rem' }}>
        Drafts
      </h2>

      {queue.drafts && queue.drafts.length === 0 && (
        <Card>
          <p className="m-0 text-sm" style={{ color: BODY }}>
            Nothing waiting. The cron writes one draft a morning at 08:00 UTC.
          </p>
        </Card>
      )}

      {(queue.drafts ?? []).map(d => (
        <Card key={d.slug}>
          <p
            className="text-xs flex items-center gap-1.5 m-0 mb-2"
            style={{ color: MUTED }}
          >
            <Clock size={13} /> written {waited(
              Math.max(0, (Date.now() - new Date(d.published_at).getTime()) / 3_600_000),
            )}
          </p>
          <h3 style={{ color: INK, fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', lineHeight: 1.35 }}>
            {d.title}
          </h3>
          <p className="text-sm mb-4" style={{ color: BODY, lineHeight: 1.6 }}>
            {d.excerpt}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Link
              href={`/admin/review?key=${encodeURIComponent(key)}&slug=${encodeURIComponent(d.slug)}&reviewer=${encodeURIComponent(reviewer)}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: '#C4622D', minHeight: 44, textDecoration: 'none' }}
            >
              <FileText size={15} /> Read it first
            </Link>
            <ReviewActions slug={d.slug} adminKey={key} reviewer={reviewer} kind="draft" />
          </div>
        </Card>
      ))}

      {queue.upgrades && queue.upgrades.length > 0 && (
        <>
          <h2 style={{ color: INK, fontSize: '1.1rem', fontWeight: 700, margin: '2rem 0 0.75rem' }}>
            Staged rewrites
          </h2>
          <p className="text-sm mb-4" style={{ color: MUTED }}>
            These replace an article that is already live. The page keeps serving the old text
            until the rewrite is promoted, and the URL never changes.
          </p>
          {queue.upgrades.map(u => (
            <Card key={u.slug}>
              <h3 style={{ color: INK, fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.35rem', lineHeight: 1.35 }}>
                {u.pending_title ?? u.title}
              </h3>
              <p className="text-sm m-0 mb-4" style={{ color: MUTED }}>
                replaces <code>{u.slug}</code>
              </p>
              <ReviewActions slug={u.slug} adminKey={key} reviewer={reviewer} kind="upgrade" />
            </Card>
          ))}
        </>
      )}
    </Shell>
  );
}

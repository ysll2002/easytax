import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getMtdStatus } from '@/lib/mtd-status';
import { track, EVENTS } from '@/lib/analytics';

// The widget other people put on their own pages.
//
// Deliberately tiny, deliberately dated, and deliberately carrying one link.
// It answers "when is my next quarterly update due?" from lib/mtd-dates, so it
// is right on the day it is pasted and still right four quarters later — which
// is the reason an accountant would use it instead of typing the date into
// their own copy.

export const runtime = 'nodejs';
// Rendered per request, for two reasons: the day count must be right on the
// day it is read, and the host that framed us is only knowable per request.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Next MTD quarterly update deadline',
  // Not indexable: this is the deadline checker's answer with the page around
  // it removed. Letting it into the index would put a near-duplicate of
  // /mtd-deadline-checker into competition with the page we actually want to
  // rank, which is the classic way a widget costs its owner the ranking it was
  // supposed to earn.
  robots: { index: false, follow: false },
};

/** The site doing the embedding, from the framing document's `Referer`. The
 *  default referrer policy sends the origin cross-site, which is exactly the
 *  granularity we want: which site, never which page of someone's CMS. */
function embeddingHost(referer: string | null): string | null {
  if (!referer) return null;
  try {
    const { hostname } = new URL(referer);
    // Our own pages framing the widget — the preview on /tools/embed — are not
    // backlinks and must not be counted as ones.
    if (hostname === 'easytax.vip' || hostname.endsWith('.easytax.vip')) return null;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return null;
    return hostname.slice(0, 120);
  } catch {
    return null;
  }
}

export default async function MtdDeadlineEmbed() {
  const status = getMtdStatus();
  const h = await headers();
  const host = embeddingHost(h.get('referer'));

  // Fire-and-forget: an analytics failure must never blank a widget sitting in
  // someone else's article. `host` is the whole point — it is a backlink,
  // observed directly, rather than one waited for from Search Console.
  void track({
    name: EVENTS.embedServed,
    path: '/embed/mtd-deadline',
    referrer: h.get('referer'),
    props: { widget: 'mtd_deadline', host: host ?? 'unknown' },
  }).catch(() => {});

  const q = status.dueQuarter;
  const days = status.daysUntilDue;

  return (
    <div
      style={{
        fontFamily: 'var(--font-body), system-ui, sans-serif',
        backgroundColor: '#FDFCF8',
        color: '#1C1208',
        padding: '20px 22px',
        // Fills whatever box the host gave us rather than assuming one.
        minHeight: '100%',
        boxSizing: 'border-box',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 12,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          fontWeight: 600,
          color: '#C4622D',
        }}
      >
        {status.isLive ? 'Making Tax Digital is live' : 'Making Tax Digital for Income Tax'}
      </p>

      {q && days !== null ? (
        <>
          <p style={{ margin: '10px 0 0', fontSize: 'clamp(19px, 5vw, 24px)', fontWeight: 700, lineHeight: 1.25 }}>
            {q.taxYear} {q.key} quarterly update due {q.deadlineLabel}
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 15, color: '#8A7F73' }}>
            Covers {q.periodLabel} ·{' '}
            <strong style={{ color: '#1C1208' }}>
              {days === 0 ? 'due today' : days === 1 ? '1 day left' : `${days} days left`}
            </strong>
          </p>
        </>
      ) : (
        <p style={{ margin: '10px 0 0', fontSize: 'clamp(19px, 5vw, 24px)', fontWeight: 700, lineHeight: 1.25 }}>
          Quarterly updates begin for qualifying income over {status.thresholdLabel}
        </p>
      )}

      {/* The attribution link, and the reason this widget exists. `target`
          escapes the frame — a visitor who clicks should land on a full page,
          not navigate the host's iframe to our site. */}
      <p style={{ margin: '16px 0 0', fontSize: 13, color: '#8A7F73' }}>
        <a
          href="https://easytax.vip/mtd-deadline-checker?utm_source=embed&utm_medium=widget&utm_campaign=mtd_deadline"
          target="_blank"
          rel="noopener"
          style={{ color: '#C4622D', fontWeight: 600, textDecoration: 'none' }}
        >
          Check your own MTD deadlines
        </a>{' '}
        · free, from EasyTax
      </p>
    </div>
  );
}

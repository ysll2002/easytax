import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import EmbedSnippet from '@/components/EmbedSnippet';
import { DEADLINE_EMBED_PATH, DEADLINE_EMBED_HEIGHT, deadlineEmbedSnippet } from '@/lib/embed';
import { getMtdStatus } from '@/lib/mtd-status';

// The page that gets the widget adopted.
//
// Addressed to a different reader from every other page on this site: not
// somebody who owes tax, but somebody who publishes for people who do —
// accountants, bookkeepers, membership bodies, co-working spaces. The offer to
// them is maintenance they no longer have to do. The offer to us is the
// attribution link, which is the only kind of inbound link this repository can
// actually manufacture.

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Free MTD deadline widget for your website — embed the next quarterly update date',
  description:
    'A free, always-current Making Tax Digital deadline widget for accountants, bookkeepers and advisers. One line of HTML shows your readers the next MTD quarterly update deadline and the days remaining, updated automatically every quarter.',
  keywords: [
    'MTD deadline widget',
    'tax deadline widget for website',
    'embed HMRC deadlines',
    'making tax digital widget',
    'accountant website tools',
    'free tax widget UK',
  ],
  alternates: { canonical: 'https://easytax.vip/tools/embed' },
  openGraph: {
    type: 'website',
    url: 'https://easytax.vip/tools/embed',
    title: 'Free MTD deadline widget for your website',
    description:
      'One line of HTML. Your readers always see the next Making Tax Digital quarterly deadline, without you editing the date four times a year.',
  },
};

export default function EmbedPage() {
  const status = getMtdStatus();
  const snippet = deadlineEmbedSnippet('https://easytax.vip');

  return (
    <div style={{ backgroundColor: '#F7F3EC', minHeight: '100vh' }}>
      <SiteHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#C4622D' }}>
          For accountants and advisers
        </p>
        <h1
          className="font-bold mb-4"
          style={{ fontSize: 'clamp(1.9rem, 6vw, 3rem)', lineHeight: 1.1, color: '#1C1208' }}
        >
          Put the next MTD deadline on your own site
        </h1>
        <p className="text-base sm:text-lg mb-8" style={{ color: '#5C5147', lineHeight: 1.6 }}>
          A dated sentence about Making Tax Digital goes out of date four times a
          year. This one does not: it reads the deadline from the same table our
          own calculators use, so it is correct the day you paste it and still
          correct four quarters later. Free, no account, no tracking script on
          your page.
        </p>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#1C1208' }}>
            What your readers see
          </h2>
          {/* The live widget, framed exactly as a host would frame it — so what
              is previewed here is the artefact itself, not a mock-up of it that
              can drift away from the real thing. */}
          <iframe
            src={DEADLINE_EMBED_PATH}
            title="Preview: next Making Tax Digital quarterly update deadline"
            width="100%"
            height={DEADLINE_EMBED_HEIGHT}
            loading="lazy"
            style={{ border: '1px solid #DDD5C8', borderRadius: 16, maxWidth: 560, backgroundColor: '#FDFCF8' }}
          />
          <p className="text-xs mt-3" style={{ color: '#8A7F73' }}>
            Live preview. Right now it reads:{' '}
            {status.dueQuarter && status.daysUntilDue !== null
              ? `${status.dueQuarter.taxYear} ${status.dueQuarter.key}, due ${status.dueQuarter.deadlineLabel}, ${status.daysUntilDue} days left.`
              : 'the mandate has not commenced yet.'}
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#1C1208' }}>
            The code
          </h2>
          <EmbedSnippet snippet={snippet} />
        </section>

        <section
          className="rounded-2xl p-5 sm:p-6 mb-10"
          style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' }}
        >
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#1C1208' }}>
            Terms, in full
          </h2>
          <ul className="text-sm space-y-2" style={{ color: '#5C5147', lineHeight: 1.6 }}>
            <li>
              <strong style={{ color: '#1C1208' }}>Free, for any site.</strong> Commercial,
              personal, a client newsletter — no permission needed and nothing to sign.
            </li>
            <li>
              <strong style={{ color: '#1C1208' }}>Keep the link.</strong> The
              &ldquo;Check your own MTD deadlines&rdquo; line is the price. Please do not
              remove or hide it.
            </li>
            <li>
              <strong style={{ color: '#1C1208' }}>No script on your page.</strong> It is an
              iframe. It cannot read your page, and it sets no cookies on your visitors.
            </li>
            <li>
              <strong style={{ color: '#1C1208' }}>What we log.</strong> That your domain
              loaded the widget, and nothing about the person reading it — no cookie, no
              identifier, no page path.
            </li>
            <li>
              <strong style={{ color: '#1C1208' }}>Guidance, not advice.</strong> Dates come
              from HMRC&rsquo;s published deadlines. See our{' '}
              <Link href="/editorial-standards" style={{ color: '#C4622D' }}>
                editorial standards
              </Link>
              .
            </li>
          </ul>
        </section>

        <p className="text-sm" style={{ color: '#5C5147' }}>
          Want something else on the page — a penalty calculator, a full deadline
          timetable?{' '}
          <Link href="/tools" style={{ color: '#C4622D', fontWeight: 600 }}>
            See all the free tools
          </Link>
          , or tell us what you need and we will build it.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}

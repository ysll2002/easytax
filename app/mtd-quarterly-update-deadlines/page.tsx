import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, CalendarClock, CheckCircle2, ExternalLink, Info } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import NotifyMeForm from '@/components/NotifyMeForm';
import TrackedCta from '@/components/TrackedCta';
import CalendarSubscribe from '@/components/CalendarSubscribe';
import TrackEvent from '@/components/TrackEvent';
import FaqSection, { faqPageJsonLd, type Faq } from '@/components/FaqSection';
import ShortAnswer from '@/components/ShortAnswer';
import { getMtdStatus } from '@/lib/mtd-status';
import { quartersForTaxYear, finalDeclarationFor } from '@/lib/mtd-dates';
import {
  currentPenaltyRegime,
  penaltyRegimeFor,
  missedUpdateAnswer,
  latePaymentSentence,
  FULL_REGIME_TAX_YEAR,
} from '@/lib/mtd-penalties';

// "I missed my MTD quarterly update deadline — what happens?"
//
// Four of the priority-1 queries in lib/search-queries.ts land here, and on
// 2026-09-13 the coverage check said none of them was answered by any of the
// 113 published articles:
//
//   - i missed my mtd quarterly update deadline what happens   (mtd-penalties)
//   - making tax digital penalty points how do they work       (mtd-penalties)
//   - making tax digital income tax deadlines 2026 27          (mtd-live)
//   - what do i put in an mtd quarterly update                 (mtd-mechanics)
//
// Why this page is worth building rather than queueing as article 116. The
// widely-published answer to the first query is currently wrong. Search it and
// you are told about penalty points and a £200 charge, because that is what the
// regime says on paper — but HMRC is running a first-year soft landing and is
// not charging late submission penalties for quarterly updates in 2026/27. The
// person searching it has just missed the 7 August or is about to miss the
// 7 November, and four other sites have told them they owe something they do
// not. Being the page that says so plainly, with the distinctions intact, is
// the entire opportunity: it is timely, it is a correction rather than a
// restatement, and it is the kind of thing an answer engine quotes.
//
// Everything dated or numbered is computed — the quarters from lib/mtd-dates,
// the penalty rules from lib/mtd-penalties keyed by tax year. The soft landing
// switches itself off on 6 April 2027 rather than leaving this page asserting
// "there is no penalty" into a year when there is. That failure mode is not
// hypothetical here: it is exactly what a hand-typed "no penalties this year"
// would do, and the homepage's hardcoded "5 Aug 2026" already did it once.

export const revalidate = 3600;

const CANONICAL = 'https://easytax.vip/mtd-quarterly-update-deadlines';

export const metadata: Metadata = {
  title: 'MTD quarterly update deadlines 2026/27 — and what happens if you miss one',
  description:
    'The four Making Tax Digital for Income Tax quarterly update deadlines, what goes in an update, and what HMRC actually charges for a late one. There are no late submission penalties for missed quarterly updates in 2026/27 — but paying late is charged separately.',
  keywords: [
    'MTD quarterly update deadlines',
    'making tax digital income tax deadlines 2026 27',
    'i missed my mtd quarterly update deadline',
    'making tax digital penalty points',
    'MTD late submission penalty',
    'what do i put in an mtd quarterly update',
    'MTD ITSA quarterly update',
    'MTD penalties 2026',
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: 'article',
    url: CANONICAL,
    title: 'Missed an MTD quarterly update? Here is what actually happens',
    description:
      'The 2026/27 deadlines, what goes in an update, and why the £200 penalty everyone quotes does not apply to a late quarterly update this year.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Missed an MTD quarterly update? Here is what actually happens',
    description: 'The 2026/27 deadlines and what HMRC really charges for a late one.',
  },
};

const INK = '#1C1208';
const BODY = '#4A4035';
const MUTED = '#9A8F83';
const LINE = '#E8E2DA';

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mt-12 mb-3"
      style={{
        fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
        fontSize: '1.5rem',
        fontWeight: 700,
        color: INK,
      }}
    >
      {children}
    </h2>
  );
}

export default function MtdQuarterlyUpdateDeadlinesPage() {
  const status = getMtdStatus();
  const regime = currentPenaltyRegime();
  const nextRegime = penaltyRegimeFor(FULL_REGIME_TAX_YEAR);
  const quarters = quartersForTaxYear(status.taxYearStart);
  const finalDec = finalDeclarationFor(status.taxYearStart);
  const due = status.dueQuarter;
  const answer = missedUpdateAnswer(regime);

  const faqs: Faq[] = [
    {
      q: 'I missed an MTD quarterly update deadline. What happens?',
      a: answer,
    },
    {
      q: 'How do Making Tax Digital penalty points work?',
      a:
        `Each submission deadline you miss earns one penalty point. At ${regime.lateSubmission.pointsThreshold} points ` +
        `HMRC charges £${regime.lateSubmission.chargeAtThresholdGbp}, and a further ` +
        `£${regime.lateSubmission.chargeAtThresholdGbp} for every deadline you miss after that. ` +
        'If you run more than one business and several updates are due on the same date, missing all of them ' +
        'still costs you one point, not one per business. Points are not permanent — they expire after a period ' +
        'of compliance, and once you are at the threshold you have to file everything outstanding and stay on ' +
        'time for a run of deadlines before they clear.',
    },
    {
      q: `So there is really no penalty for a late quarterly update in ${regime.taxYear}?`,
      a:
        regime.lateSubmission.quarterlyUpdatesEarnPoints
          ? `No — that concession applied to earlier years. In ${regime.taxYear} a late quarterly update earns a penalty point like any other missed deadline.`
          : `Not for the quarterly update itself, no. Two things that concession does not cover, and both catch people out. ` +
            `A late tax return for ${regime.taxYear} still earns a penalty point in the normal way — the soft landing is ` +
            `about the quarterly updates only. And paying late is a separate charge that applies from the start. ` +
            `From ${nextRegime.taxYear} the points regime covers quarterly updates too.`,
    },
    {
      q: 'What do I actually put in a quarterly update?',
      a:
        'Totals, not a tax calculation. For each business you report the income and expenses for the three-month period, ' +
        'in the standard HMRC categories, from the digital records you are required to keep. There are no adjustments, ' +
        'no reliefs and no allowances at this stage — those come at the final declaration after the year ends. ' +
        'It is a running summary rather than a mini tax return, which is why an update can be corrected later: if the ' +
        'figures change, the next update carries the revised year-to-date position.',
    },
    {
      q: 'Do I still have to send an update if the business had no income that quarter?',
      a:
        'Yes. A quarter with nothing in it is still a quarter you report, and a nil update is what you send. ' +
        'You cannot make your final declaration until every quarterly update for the year is in, so a skipped ' +
        'quarter blocks the end of the year rather than quietly disappearing.',
    },
    {
      q: 'Does a quarterly update replace my Self Assessment tax return?',
      a:
        'No. The updates run during the year and the final declaration replaces the return after it, so you do both. ' +
        `The final declaration for ${status.taxYear} is due ${finalDec.deadlineLabel}, which is the same 31 January ` +
        'date Self Assessment always had.',
    },
    {
      q: 'What if I pay my tax late rather than filing late?',
      a: latePaymentSentence(regime),
    },
  ];

  // One graph rather than two script tags: the FAQPage and the page's own
  // WebPage node describe the same URL, and `@graph` is how that is said.
  const faqNode = faqPageJsonLd(faqs, CANONICAL);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': CANONICAL,
        url: CANONICAL,
        name: 'MTD quarterly update deadlines 2026/27 and late submission penalties',
        inLanguage: 'en-GB',
        isPartOf: { '@type': 'WebSite', '@id': 'https://easytax.vip#website' },
        about: { '@type': 'Thing', name: 'Making Tax Digital for Income Tax' },
        publisher: { '@type': 'Organization', name: 'EasyTax', url: 'https://easytax.vip' },
      },
      ...(faqNode ? [faqNode] : []),
    ],
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F3EC' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TrackEvent name="topic_hub_viewed" props={{ topic: 'mtd_quarterly_deadlines' }} />
      <SiteHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <article>
          <p className="text-xs uppercase tracking-wider mb-3" style={{ color: MUTED, letterSpacing: '0.1em' }}>
            Making Tax Digital · {status.taxYear}
          </p>

          <h1
            style={{
              fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
              color: INK,
              fontSize: 'clamp(1.75rem, 5vw, 2.6rem)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              marginBottom: '1.25rem',
            }}
          >
            MTD quarterly update deadlines — and what happens if you miss one
          </h1>

          {/* The direct answer, first, in its own block. This is the
              featured-snippet candidate and the thing an answer engine lifts:
              a page that buries the answer under three paragraphs of context
              gets quoted for the context. */}
          <ShortAnswer>{answer}</ShortAnswer>

          <p className="text-base sm:text-lg" style={{ color: BODY, lineHeight: 1.7 }}>
            Making Tax Digital for Income Tax replaced one annual return with four updates during
            the year plus a final declaration after it. The updates are due on the 7th of the month
            following each quarter.
            {due && (
              <>
                {' '}The next one covers <strong>{due.periodLabel}</strong> and is due{' '}
                <strong>{due.deadlineLabel}</strong>
                {status.daysUntilDue !== null && status.daysUntilDue >= 0 && (
                  <> — {status.daysUntilDue === 0 ? 'today' : `${status.daysUntilDue} days away`}</>
                )}
                .
              </>
            )}
          </p>

          {/* ── The deadlines ── */}
          <H2>The {status.taxYear} deadlines</H2>
          <p className="text-sm mb-5" style={{ color: MUTED, lineHeight: 1.6 }}>
            Each update covers a three-month period and is due on the 7th of the following month.
            The final declaration replaces the Self Assessment return for the year.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse', minWidth: '480px' }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid #DDD5C8` }}>
                  <th className="text-left py-2.5 pr-4 font-semibold" style={{ color: MUTED }}>Update</th>
                  <th className="text-left py-2.5 pr-4 font-semibold" style={{ color: MUTED }}>Period covered</th>
                  <th className="text-left py-2.5 font-semibold" style={{ color: MUTED }}>Due</th>
                </tr>
              </thead>
              <tbody>
                {quarters.map(q => {
                  const passed = q.deadline.getTime() < Date.now();
                  const isNext = due?.key === q.key && due?.taxYear === q.taxYear;
                  return (
                    <tr key={q.key} style={{ borderBottom: `1px solid ${LINE}`, opacity: passed ? 0.5 : 1 }}>
                      <td className="py-3 pr-4 font-medium" style={{ color: INK }}>
                        {q.key}
                        {isNext && (
                          <span
                            className="ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-semibold align-middle"
                            style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}
                          >
                            Next
                          </span>
                        )}
                        {passed && <span className="ml-2 text-xs font-normal" style={{ color: MUTED }}>Passed</span>}
                      </td>
                      <td className="py-3 pr-4" style={{ color: BODY }}>{q.periodLabel}</td>
                      <td className="py-3" style={{ color: BODY }}>{q.deadlineLabel}</td>
                    </tr>
                  );
                })}
                <tr style={{ borderBottom: `1px solid ${LINE}` }}>
                  <td className="py-3 pr-4 font-medium" style={{ color: INK }}>Final declaration</td>
                  <td className="py-3 pr-4" style={{ color: BODY }}>Whole {status.taxYear} year</td>
                  <td className="py-3" style={{ color: BODY }}>{finalDec.deadlineLabel}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <CalendarSubscribe placement="quarterly_deadlines" />
          </div>

          {/* ── The two things the soft landing does not cover ── */}
          <H2>The two things the {regime.taxYear} concession does not cover</H2>

          <div className="flex flex-col gap-4">
            <div className="p-5 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: `1.5px solid ${LINE}` }}>
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} color="#C4622D" strokeWidth={2} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1.5" style={{ color: INK }}>Your tax return is not covered</p>
                  <p className="text-sm" style={{ color: BODY, lineHeight: 1.7 }}>
                    The concession is about quarterly updates. A late final declaration for {status.taxYear}
                    {' '}earns a penalty point in the ordinary way, and the ordinary way ends at
                    {' '}£{regime.lateSubmission.chargeAtThresholdGbp}. This is the distinction most write-ups
                    drop, and it is the expensive half.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: `1.5px solid ${LINE}` }}>
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} color="#C9963D" strokeWidth={2} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1.5" style={{ color: INK }}>Paying late is charged separately</p>
                  <p className="text-sm" style={{ color: BODY, lineHeight: 1.7 }}>
                    {latePaymentSentence(regime)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
              <div className="flex items-start gap-3">
                <Info size={20} color="#6B8E6E" strokeWidth={2} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1.5" style={{ color: INK }}>And it expires</p>
                  <p className="text-sm" style={{ color: BODY, lineHeight: 1.7 }}>
                    From 6 April {FULL_REGIME_TAX_YEAR} the points regime applies to quarterly updates too, and
                    the late payment percentages step up to {nextRegime.latePayment.firstPenaltyPct}% and
                    {' '}{nextRegime.latePayment.secondPenaltyPct}%. This page recalculates from the tax year
                    you are reading it in, so it will stop saying any of this on the day it stops being true.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── The one action ── */}
          <div
            className="mt-10 p-5 sm:p-6 rounded-2xl"
            style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}
          >
            <div className="flex items-start gap-3">
              <CalendarClock size={20} color="#C4622D" strokeWidth={2} className="flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold mb-1.5" style={{ color: INK }}>
                  Work out which deadlines are actually yours
                </p>
                <p className="text-sm mb-4" style={{ color: BODY, lineHeight: 1.6 }}>
                  Whether you are in the regime at all depends on gross income rather than profit, and
                  which year you joined decides which deadlines you are working to. The checker does it
                  from your figures — no account, no email, nothing to pay.
                </p>
                <TrackedCta
                  href="/mtd-deadline-checker"
                  placement="quarterly_deadlines_primary"
                  className="inline-block px-6 py-3 rounded-full font-medium text-sm"
                  style={{ backgroundColor: INK, color: '#FDFCF8', textDecoration: 'none', minHeight: '44px' }}
                >
                  Check my MTD deadlines →
                </TrackedCta>
              </div>
            </div>
          </div>

          <FaqSection
            faqs={faqs}
            pageUrl={CANONICAL}
            schema={false}
            heading="Questions people ask about quarterly updates"
            intro="The questions behind the searches this page was written for."
          />

          <p className="mt-8 text-sm flex items-start gap-1.5" style={{ color: MUTED }}>
            <ExternalLink size={14} strokeWidth={2} className="flex-shrink-0 mt-1" />
            <span>
              HMRC&apos;s own guidance:{' '}
              <a
                href="https://www.gov.uk/guidance/penalties-for-making-tax-digital-for-income-tax"
                target="_blank"
                rel="noopener noreferrer nofollow"
                style={{ color: '#C4622D' }}
              >
                Penalties for Making Tax Digital for Income Tax
              </a>
              {' · '}
              <a
                href="https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax/send-quarterly-updates"
                target="_blank"
                rel="noopener noreferrer nofollow"
                style={{ color: '#C4622D' }}
              >
                Send quarterly updates
              </a>
            </span>
          </p>

          {/* ── What we can and cannot do today ── */}
          <div className="mt-12 pt-8" style={{ borderTop: `1px solid ${LINE}` }}>
            <H2>Where EasyTax fits — honestly</H2>
            <ul className="flex flex-col gap-3 mb-6">
              {[
                { ok: true, text: 'Working today, free, no account: the deadline checker, the penalty calculator and the subscribable deadline calendar above.' },
                { ok: false, text: 'Not yet: sending your quarterly updates to HMRC. Our production access is still with HMRC for approval, and we will not pretend otherwise.' },
              ].map(({ ok, text }) => (
                <li key={text} className="flex items-start gap-2.5 text-sm" style={{ color: BODY, lineHeight: 1.6 }}>
                  {ok
                    ? <CheckCircle2 size={17} color="#6B8E6E" strokeWidth={2} className="flex-shrink-0 mt-0.5" />
                    : <AlertTriangle size={17} color="#C9963D" strokeWidth={2} className="flex-shrink-0 mt-0.5" />}
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <NotifyMeForm
              source="quarterly_deadlines"
              heading="Tell me when filing opens"
              blurb={`We cannot send your quarterly updates yet. Leave your email and we will tell you the day HMRC approves us — nothing else, unsubscribe in one click.${due ? ` If that is after ${due.deadlineLabel}, file that update elsewhere and do not wait for us.` : ''}`}
            />

            <p className="mt-5 text-sm" style={{ color: MUTED, lineHeight: 1.6 }}>
              Related:{' '}
              <Link href="/hmrc-signed-me-up-for-mtd" style={{ color: '#C4622D' }}>HMRC signed me up for MTD — what now?</Link>
              {' · '}
              <Link href="/self-assessment-penalty-calculator" style={{ color: '#C4622D' }}>what a late Self Assessment return costs</Link>
              {' · '}
              <Link href="/timetable" style={{ color: '#C4622D' }}>the full MTD timetable</Link>
            </p>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}

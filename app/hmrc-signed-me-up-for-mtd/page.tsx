import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, CalendarClock, CheckCircle2, ExternalLink, HelpCircle } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import NotifyMeForm from '@/components/NotifyMeForm';
import TrackedCta from '@/components/TrackedCta';
import CalendarSubscribe from '@/components/CalendarSubscribe';
import TrackEvent from '@/components/TrackEvent';
import { getMtdStatus } from '@/lib/mtd-status';
import { quartersForTaxYear, finalDeclarationFor } from '@/lib/mtd-dates';

// "HMRC has signed me up for Making Tax Digital" — the question of the month.
//
// From September 2026, HMRC began automatically signing up people whose
// 2024/25 return showed qualifying income over £50,000 and who had not signed
// up themselves (lib/mtd-status.ts, AUTO_SIGNUP_START, sourced from GOV.UK).
// Those people did not choose this, most of them did not expect it, and the
// letter does not explain what to actually do next. That is a demand spike
// with a short life: it is happening this month, to a cohort of roughly the
// size the £50,000 threshold implies, and it stops being a question once
// everyone affected has worked out the answer.
//
// Why a route and not another /tax-tips article: the archive is 113 articles
// and earned ten page views in the nine days to 2026-09-11. A first-class page
// gets a sitemap entry at landing-page priority, a generated OG card, internal
// links from the tools and the homepage, and a canonical of its own. Article
// 114 would have got none of that, and the 2026-09-09 round's whole finding
// was to stop scaling the archive.
//
// Every date and threshold on this page is computed from lib/mtd-dates via
// getMtdStatus. Nothing here is typed by hand, so it cannot go stale on the
// 7th of November the way the homepage's hardcoded "5 Aug 2026" did.

export const revalidate = 3600;

const CANONICAL = 'https://easytax.vip/hmrc-signed-me-up-for-mtd';

export const metadata: Metadata = {
  title: 'HMRC signed me up for Making Tax Digital — what do I do now?',
  description:
    'HMRC is automatically signing up sole traders and landlords who earned over £50,000 in 2024/25. What the letter means, whether you can opt out, your quarterly update deadlines, and what you have to do before the next one.',
  keywords: [
    'HMRC signed me up for Making Tax Digital',
    'HMRC letter making tax digital',
    'automatically signed up MTD',
    'MTD for income tax letter',
    'do I have to do Making Tax Digital',
    'opt out of Making Tax Digital',
    'MTD ITSA quarterly update deadline',
    'HMRC enrolled me MTD income tax',
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: 'article',
    url: CANONICAL,
    title: 'HMRC signed me up for Making Tax Digital — what now?',
    description:
      'What the letter means, whether you can opt out, and the deadline you are now working to.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HMRC signed me up for Making Tax Digital — what now?',
    description: 'What the letter means, whether you can opt out, and what is due when.',
  },
};

export default function HmrcSignedMeUpPage() {
  const status = getMtdStatus();
  const quarters = quartersForTaxYear(status.taxYearStart);
  const finalDec = finalDeclarationFor(status.taxYearStart);
  const due = status.dueQuarter;

  const faqs: { q: string; a: string }[] = [
    {
      q: 'Why has HMRC signed me up for Making Tax Digital without asking?',
      a:
        `Making Tax Digital for Income Tax has been mandatory since 6 April 2026 for sole traders and landlords with qualifying income over ${status.thresholdLabel}. ` +
        'It is a legal requirement rather than a service you opt into, so HMRC does not need your agreement to enrol you. ' +
        'From September 2026 HMRC began signing up people whose 2024/25 Self Assessment return showed qualifying income above that threshold and who had not signed themselves up.',
    },
    {
      q: 'Can I opt out?',
      a:
        'Not if you are over the threshold and none of the exemptions apply. There are exemptions — for example where it is not reasonably practicable for you to use digital tools because of age, disability, location or religious belief — and they are applied for through HMRC, not through your software. ' +
        'If you believe you are under the threshold or have stopped trading, that is a different conversation with HMRC, and worth having quickly rather than ignoring the letter.',
    },
    {
      q: 'What is "qualifying income"? Is it my profit?',
      a:
        'No — and this is the single most common misunderstanding. Qualifying income is your gross turnover from self-employment plus your gross rental income, before expenses. ' +
        'Someone with £58,000 of turnover and £20,000 of costs has £38,000 of profit and £58,000 of qualifying income, and is in the regime.',
    },
    {
      q: 'Does this replace my Self Assessment return?',
      a:
        `Not for the year you have just filed. Your ${status.taxYearStart - 1}/${String(status.taxYearStart).slice(-2)} return is unaffected and is still due by 31 January ${status.taxYearStart + 1}. ` +
        `From ${status.taxYear} onwards you send four quarterly updates during the year and then a final declaration, which replaces the old return for that year.`,
    },
    {
      q: 'What happens if I ignore it?',
      a:
        'Late quarterly updates attract penalty points under HMRC\'s points-based system, and a financial penalty once you reach the threshold for your filing frequency. ' +
        'The practical risk is bigger than the first penalty though: quarterly updates need digital records kept as you go, so the cost of starting late is reconstructing several months of bookkeeping under time pressure.',
    },
    {
      q: 'Do I need to buy software?',
      a:
        'You need software that can send quarterly updates to HMRC — spreadsheets alone cannot, though bridging software can carry a spreadsheet into the API. ' +
        'Our free deadline checker will tell you what you are working to before you pay anyone anything, including us.',
    },
  ];

  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: '#FDFCF8', color: '#1C1208', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
      <TrackEvent name="topic_hub_viewed" props={{ topic: 'hmrc_auto_signup' }} />

      <SiteHeader />

      <main className="flex-grow">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">

          {/* ── Answer first ──
              The reader has a letter in their hand and one question. Putting
              the reassurance and the deadline above everything else is also
              what makes the page eligible for a featured snippet, which is the
              only realistic way a domain with our authority outranks GOV.UK
              for a long-tail query like this one. */}
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#C4622D' }}>
            Making Tax Digital for Income Tax
          </p>

          <h1
            style={{
              fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
              fontSize: 'clamp(1.75rem, 5vw, 2.6rem)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              marginBottom: '1.25rem',
            }}
          >
            HMRC has signed me up for Making Tax Digital. What now?
          </h1>

          <p className="text-base sm:text-lg" style={{ color: '#4A4035', lineHeight: 1.7 }}>
            The letter is real, it is not a mistake, and you are not being singled out.
            Making Tax Digital for Income Tax has been mandatory since <strong>6 April 2026</strong> for
            sole traders and landlords with qualifying income over {status.thresholdLabel}, and
            from September 2026 HMRC started enrolling people who met that test on their
            2024/25 return and had not signed up themselves.
          </p>

          <p className="text-base sm:text-lg mt-4" style={{ color: '#4A4035', lineHeight: 1.7 }}>
            In practice it means one thing: from the {status.taxYear} tax year you send HMRC
            four short updates during the year instead of one return after it.
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

          {/* ── The one action ── */}
          <div
            className="mt-8 p-5 sm:p-6 rounded-2xl"
            style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}
          >
            <div className="flex items-start gap-3">
              <CalendarClock size={20} color="#C4622D" strokeWidth={2} className="flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold mb-1.5" style={{ color: '#1C1208' }}>
                  Start by confirming what actually applies to you
                </p>
                <p className="text-sm mb-4" style={{ color: '#4A4035', lineHeight: 1.6 }}>
                  The threshold test is on gross income, not profit, and the year you come into
                  the regime depends on which return HMRC assessed. Our checker works it out
                  from your figures — no account, no email, nothing to pay.
                </p>
                <TrackedCta
                  href="/mtd-deadline-checker"
                  placement="auto_signup_primary"
                  className="inline-block px-6 py-3 rounded-full font-medium text-sm"
                  style={{ backgroundColor: '#1C1208', color: '#FDFCF8', textDecoration: 'none', minHeight: '44px' }}
                >
                  Check my MTD deadlines →
                </TrackedCta>
              </div>
            </div>
          </div>

          {/* ── The deadlines themselves ── */}
          <h2
            className="mt-12 mb-2"
            style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700 }}
          >
            Your {status.taxYear} deadlines
          </h2>
          <p className="text-sm mb-5" style={{ color: '#9A8F83', lineHeight: 1.6 }}>
            Each quarterly update covers a three-month period and is due on the 7th of the
            following month. The final declaration replaces the Self Assessment return for
            this year.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse', minWidth: '480px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #DDD5C8' }}>
                  <th className="text-left py-2.5 pr-4 font-semibold" style={{ color: '#9A8F83' }}>Update</th>
                  <th className="text-left py-2.5 pr-4 font-semibold" style={{ color: '#9A8F83' }}>Period covered</th>
                  <th className="text-left py-2.5 font-semibold" style={{ color: '#9A8F83' }}>Due</th>
                </tr>
              </thead>
              <tbody>
                {quarters.map(q => {
                  const passed = q.deadline.getTime() < Date.now();
                  const isNext = due?.key === q.key && due?.taxYear === q.taxYear;
                  return (
                    <tr key={q.key} style={{ borderBottom: '1px solid #E8E2DA', opacity: passed ? 0.5 : 1 }}>
                      <td className="py-3 pr-4 font-medium" style={{ color: '#1C1208' }}>
                        {q.key}
                        {isNext && (
                          <span
                            className="ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-semibold align-middle"
                            style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}
                          >
                            Next
                          </span>
                        )}
                        {passed && (
                          <span className="ml-2 text-xs font-normal" style={{ color: '#9A8F83' }}>Passed</span>
                        )}
                      </td>
                      <td className="py-3 pr-4" style={{ color: '#4A4035' }}>{q.periodLabel}</td>
                      <td className="py-3" style={{ color: '#4A4035' }}>{q.deadlineLabel}</td>
                    </tr>
                  );
                })}
                <tr style={{ borderBottom: '1px solid #E8E2DA' }}>
                  <td className="py-3 pr-4 font-medium" style={{ color: '#1C1208' }}>Final declaration</td>
                  <td className="py-3 pr-4" style={{ color: '#4A4035' }}>Whole {status.taxYear} year</td>
                  <td className="py-3" style={{ color: '#4A4035' }}>{finalDec.deadlineLabel}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <CalendarSubscribe placement="auto_signup" />
          </div>

          {/* ── The mistake that costs the most ── */}
          <div
            className="mt-12 p-5 sm:p-6 rounded-2xl"
            style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E8E2DA' }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} color="#C4622D" strokeWidth={2} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1.5" style={{ color: '#1C1208' }}>
                  The expensive misunderstanding: qualifying income is not profit
                </p>
                <p className="text-sm" style={{ color: '#4A4035', lineHeight: 1.7 }}>
                  Qualifying income is gross self-employment turnover plus gross rental income,
                  <em> before</em> expenses. A landlord with two properties bringing in £30,000
                  each has £60,000 of qualifying income whatever the mortgage interest and
                  agent fees come to. Plenty of people reading the {status.thresholdLabel} figure
                  as profit have concluded the rules do not apply to them, and the letter is
                  HMRC disagreeing.
                </p>
              </div>
            </div>
          </div>

          {/* ── FAQ ── */}
          <h2
            className="mt-12 mb-6"
            style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700 }}
          >
            Questions people are asking this month
          </h2>

          <div className="flex flex-col gap-5">
            {faqs.map(({ q, a }) => (
              <div key={q}>
                <p className="font-semibold mb-1.5 flex items-start gap-2" style={{ color: '#1C1208' }}>
                  <HelpCircle size={16} color="#6B8E6E" strokeWidth={2} className="flex-shrink-0 mt-1" />
                  <span>{q}</span>
                </p>
                <p className="text-sm" style={{ color: '#4A4035', lineHeight: 1.7, paddingLeft: '1.5rem' }}>{a}</p>
              </div>
            ))}
          </div>

          {/* Send people to the source. A page about an HMRC letter that does
              not link HMRC is asking to be trusted for no reason, and the
              outbound link costs us nothing we were going to keep. */}
          <p className="mt-8 text-sm flex items-center gap-1.5" style={{ color: '#9A8F83' }}>
            <ExternalLink size={14} strokeWidth={2} className="flex-shrink-0" />
            <span>
              HMRC&apos;s own guidance:{' '}
              <a
                href="https://www.gov.uk/guidance/find-out-if-and-when-you-need-to-use-making-tax-digital-for-income-tax"
                target="_blank"
                rel="noopener noreferrer nofollow"
                style={{ color: '#C4622D' }}
              >
                Find out if and when you need to use Making Tax Digital for Income Tax
              </a>
            </span>
          </p>

          {/* ── What we can and cannot do today ──
              Trust goal. Saying plainly that our filing is not switched on yet
              is worth more than a claim we would have to walk back, and the
              /trust page exists for exactly this reason. */}
          <div className="mt-12 pt-8" style={{ borderTop: '1px solid #E8E2DA' }}>
            <h2
              className="mb-4"
              style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700 }}
            >
              Where EasyTax fits — honestly
            </h2>
            <ul className="flex flex-col gap-3 mb-6">
              {[
                { ok: true,  text: 'Working today, free, no account: the deadline checker, the penalty calculator and the subscribable deadline calendar above.' },
                { ok: false, text: 'Not yet: sending your quarterly updates to HMRC. Our production access is still with HMRC for approval, and we will not pretend otherwise.' },
              ].map(({ ok, text }) => (
                <li key={text} className="flex items-start gap-2.5 text-sm" style={{ color: '#4A4035', lineHeight: 1.6 }}>
                  {ok
                    ? <CheckCircle2 size={17} color="#6B8E6E" strokeWidth={2} className="flex-shrink-0 mt-0.5" />
                    : <AlertTriangle size={17} color="#C9963D" strokeWidth={2} className="flex-shrink-0 mt-0.5" />}
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <NotifyMeForm
              source="hmrc_auto_signup"
              heading="Tell me when filing opens"
              blurb={`You are in the regime now and we cannot file for you yet. Leave your email and we will tell you the day HMRC approves us — nothing else, unsubscribe in one click.${due ? ` If that is after ${due.deadlineLabel}, file that update elsewhere and do not wait for us.` : ''}`}
            />

            <p className="mt-5 text-sm" style={{ color: '#9A8F83', lineHeight: 1.6 }}>
              More on what we do and do not claim:{' '}
              <Link href="/trust" style={{ color: '#C4622D' }}>how we handle your data and your HMRC connection</Link>
              {' · '}
              <Link href="/timetable" style={{ color: '#C4622D' }}>the full MTD timetable</Link>
              {' · '}
              <Link href="/mtd-software" style={{ color: '#C4622D' }}>what MTD-compatible software has to do</Link>
            </p>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}

import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import CalendarSubscribe from '@/components/CalendarSubscribe';

export const metadata: Metadata = {
  title: 'MTD Deadlines 2026–2028 — Making Tax Digital Timetable',
  description: 'Key Making Tax Digital (MTD ITSA) deadlines for 2026, 2027 and 2028. Quarterly update dates, Self Assessment deadlines and payment dates for UK sole traders and freelancers.',
  alternates: { canonical: 'https://easytax.vip/timetable' },
  openGraph: {
    title: 'MTD Deadlines 2026–2028 — Making Tax Digital Timetable',
    description: 'Key Making Tax Digital deadlines for UK freelancers and sole traders.',
    url: 'https://easytax.vip/timetable',
  },
};

// Each entry carries the machine-readable date alongside the display one, so
// the page can say which deadlines have already gone by. Without it this page
// presented a nine-item list in which the first three were in the past and
// nothing on the page said so — a timetable that does not know what day it is.
const deadlines = [
  {
    iso: '2026-04-06',
    date: '6 April 2026',
    title: 'Start keeping digital records',
    desc: 'Begin using compatible software to keep digital records of your income and expenses.',
    highlight: false,
    isStart: true,
  },
  {
    iso: '2026-08-07',
    date: '7 August 2026',
    title: '1st Quarterly Update deadline',
    desc: 'Send your Quarterly Update for the period 6 April to 5 July 2026.',
    highlight: false,
  },
  {
    iso: '2026-11-07',
    date: '7 November 2026',
    title: '2nd Quarterly Update deadline',
    desc: 'Send your Quarterly Update for the period 6 April to 5 October 2026.',
    highlight: false,
  },
  {
    iso: '2027-01-31',
    date: '31 January 2027',
    title: 'Self-Assessment Tax Return (2025/26)',
    desc: 'Deadline to submit a Self-Assessment Tax Return in the usual way for the previous 2025/26 tax year.',
    highlight: true,
  },
  {
    iso: '2027-02-07',
    date: '7 February 2027',
    title: '3rd Quarterly Update deadline',
    desc: 'Send your Quarterly Update for the period 6 April 2026 to 5 January 2027.',
    highlight: false,
  },
  {
    iso: '2027-05-07',
    date: '7 May 2027',
    title: '4th Quarterly Update deadline',
    desc: 'Send your Quarterly Update for the period 6 April 2026 to 5 April 2027.',
    highlight: false,
  },
  {
    iso: '2027-08-07',
    date: '7 August 2027',
    title: '1st Quarterly Update deadline (2027/28)',
    desc: 'Send your Quarterly Update for the period 6 April to 5 July 2027. Eligible people with gross income £30,000+ begin using MTD.',
    highlight: false,
    note: 'Income £30,000+ threshold begins',
  },
  {
    iso: '2027-11-07',
    date: '7 November 2027',
    title: '2nd Quarterly Update deadline (2027/28)',
    desc: 'Send your Quarterly Update for the period 6 April to 5 October 2027.',
    highlight: false,
  },
  {
    iso: '2028-01-31',
    date: '31 January 2028',
    title: 'MTD Tax Return & payment deadline (2026/27)',
    desc: 'Deadline to submit your MTD Tax Return and pay your income tax for 2026/27.',
    highlight: false,
    isFinal: true,
  },
];

// Hourly, rather than at build time: "which of these has passed" is the whole
// point of the markers below, and a statically baked answer is wrong from the
// first deadline after the deploy onwards.
export const revalidate = 3600;

export default function TimetablePage() {
  const now = Date.now();
  // End of the deadline day: a submission on the day itself is on time, so a
  // deadline is only "passed" once its day is over.
  const hasPassed = (iso: string) => new Date(`${iso}T23:59:59.999Z`).getTime() < now;
  const nextIndex = deadlines.findIndex(d => !hasPassed(d.iso));

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FDFCF8', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}>
      <SiteHeader />

      <main className="flex-grow max-w-3xl mx-auto px-6 py-16 w-full">

        {/* Cross-link to the interactive tool: this page lists every date, the
            checker narrows them to the ones that apply to the reader. */}
        <div className="mb-10 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4" style={{ backgroundColor: '#F0EBE1', border: '1px solid #C4622D30' }}>
          <p className="text-sm m-0 flex-1" style={{ color: '#4A4035' }}>
            Not sure which of these apply to you? The deadline checker works it out from your income.
          </p>
          <Link href="/mtd-deadline-checker" className="inline-flex items-center justify-center px-5 rounded-full text-sm font-semibold whitespace-nowrap" style={{ minHeight: 44, backgroundColor: '#C4622D', color: '#FDFCF8', textDecoration: 'none' }}>
            Check my deadlines →
          </Link>
        </div>

        {/* What is MTD section */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4" style={{ backgroundColor: '#F0EBE1', color: '#C4622D', border: '1px solid #C4622D30' }}>
            Making Tax Digital
          </div>
          <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2.5rem', fontWeight: 700, color: '#1C1208', lineHeight: 1.1, marginBottom: '1.25rem' }}>
            What is Making Tax Digital?
          </h1>
          <p style={{ color: '#4A4035', lineHeight: 1.8, fontSize: '1rem', maxWidth: '600px', marginBottom: '1.25rem' }}>
            If you&apos;re a sole trader or landlord with a gross income of more than <strong>£50,000</strong> from self-employment and/or property, you no longer file just one Self Assessment return a year.
          </p>
          <p style={{ color: '#4A4035', lineHeight: 1.8, fontSize: '1rem', maxWidth: '600px', marginBottom: '1.25rem' }}>
            Since <strong>6 April 2026</strong> you have had to keep digital records and send updates to HMRC every three months — plus a final year-end Tax Return. This is live now, not upcoming: the first quarterly update was due on 7 August 2026.
          </p>
          <div className="p-5 rounded-2xl mb-6" style={{ backgroundColor: '#F0EBE1', border: '1px solid #C4622D20', maxWidth: '600px' }}>
            <p style={{ color: '#1C1208', fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>5 submissions a year instead of 1</p>
            <p style={{ color: '#4A4035', fontSize: '0.9rem', lineHeight: 1.7 }}>
              Four quarterly updates plus a final year-end Tax Return, using software that&apos;s compatible with HMRC systems.
            </p>
          </div>
          <p style={{ color: '#4A4035', lineHeight: 1.8, fontSize: '1rem', maxWidth: '600px' }}>
            This is part of the Government&apos;s &apos;Making Tax Digital&apos; (MTD) scheme. While it&apos;s designed to spread the workload, it also brings new admin, new deadlines — and ultimately penalties if you miss them.
          </p>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #E8E2DA', marginBottom: '3.5rem' }} />

        {/* Deadlines header */}
        <div className="mb-10">
          <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#1C1208', marginBottom: '1rem' }}>
            What are the deadlines for Making Tax Digital?
          </h2>
          <p style={{ color: '#4A4035', lineHeight: 1.8, fontSize: '1rem', maxWidth: '600px' }}>
            With MTD updates being more frequent than with Self-Assessment — and the penalties if you miss these — it&apos;s a good idea to set reminders for each Quarterly Update deadline, as well as for your Tax Return and tax payment.
          </p>
          <p className="mt-4" style={{ color: '#4A4035', lineHeight: 1.8, fontSize: '1rem', maxWidth: '600px' }}>
            Here are the key MTD deadlines for the tax year starting 6 April 2026. In places they overlap with the Self-Assessment deadline for the previous 2025/26 tax year{' '}
            <span style={{ color: '#DC2626', fontWeight: 600 }}>(highlighted in red)</span>:
          </p>
        </div>

        {/* Legend */}
        <div className="flex gap-6 mb-10 text-sm">
          <div className="flex items-center gap-2">
            <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#C4622D', flexShrink: 0 }} />
            <span style={{ color: '#4A4035' }}>MTD deadline</span>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#DC2626', flexShrink: 0 }} />
            <span style={{ color: '#4A4035' }}>Overlapping SA deadline</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div style={{ position: 'absolute', left: 19, top: 12, bottom: 12, width: 2, backgroundColor: '#E8E2DA' }} />

          <div className="space-y-0">
            {deadlines.map((d, i) => {
              const passed = hasPassed(d.iso);
              const isNext = i === nextIndex;
              return (
              <div key={i} className="flex gap-6 pb-8 relative" style={{ opacity: passed ? 0.55 : 1 }}>
                {/* Dot */}
                <div style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: passed ? '#9A8F83' : d.highlight ? '#DC2626' : d.isStart ? '#6B8E6E' : d.isFinal ? '#1C1208' : '#C4622D',
                    border: '3px solid #FDFCF8',
                    boxShadow: '0 0 0 2px ' + (passed ? '#9A8F8340' : d.highlight ? '#DC262640' : d.isStart ? '#6B8E6E40' : '#C4622D40'),
                  }}>
                    <span style={{ color: '#FDFCF8', fontSize: '0.65rem', fontWeight: 800 }}>
                      {passed ? '✓' : d.isStart ? '▶' : d.isFinal ? '★' : d.highlight ? '!' : '◆'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pt-1.5">
                  <p className="text-xs font-bold mb-1 flex flex-wrap items-center gap-2" style={{ color: d.highlight && !passed ? '#DC2626' : '#9A8F83', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {d.date}
                    {passed && <span style={{ color: '#9A8F83', fontWeight: 700 }}>· Passed</span>}
                    {isNext && (
                      <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: '#C4622D', color: '#FDFCF8', fontWeight: 700, letterSpacing: '0.04em' }}>
                        Next up
                      </span>
                    )}
                  </p>
                  <div className="p-4 rounded-xl" style={{
                    backgroundColor: d.highlight ? '#FEF2F2' : d.isStart ? '#F0F5F0' : d.isFinal ? '#F5EDDC' : '#FFFFFF',
                    border: `1.5px solid ${d.highlight ? '#FCA5A5' : d.isStart ? '#6B8E6E30' : d.isFinal ? '#C4622D30' : '#E8E2DA'}`,
                  }}>
                    <p className="font-bold text-sm mb-1" style={{ color: d.highlight ? '#DC2626' : '#1C1208' }}>{d.title}</p>
                    <p className="text-sm" style={{ color: '#4A4035', lineHeight: 1.6 }}>{d.desc}</p>
                    {d.note && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#C4622D', flexShrink: 0 }} />
                        <p className="text-xs font-semibold" style={{ color: '#C4622D' }}>{d.note}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        {/* The one thing a visitor can take away today. Placed directly after
            the timeline, where someone has just read nine dates and is
            wondering how to remember them. */}
        <div className="mt-4 mb-8">
          <CalendarSubscribe placement="timetable" />
        </div>

        {/* CTA */}
        <div className="mt-8 p-6 rounded-2xl" style={{ backgroundColor: '#1C1208' }}>
          <p style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#FDFCF8', marginBottom: '0.5rem' }}>
            Ready to get started?
          </p>
          <p className="text-sm mb-4" style={{ color: '#9A8F83' }}>
            EasyTax handles your MTD quarterly updates and Self Assessment filing — all in one place.
          </p>
          <Link href="/register"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{ backgroundColor: '#C4622D', color: '#FDFCF8', textDecoration: 'none' }}>
            Get Started →
          </Link>
        </div>

      </main>

      <SiteFooter />
    </div>
  );
}

import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Link from 'next/link';
import { MTD_DEADLINES, formatDeadlineDate, nextDeadline } from '@/lib/mtd-deadlines';

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


// Statically rendered, so without a revalidate the "next up" marker would be
// frozen at whatever the next deadline was on the day of the build.
export const revalidate = 3600;

export default function TimetablePage() {
  const upcoming = nextDeadline();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FDFCF8', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}>
      <SiteHeader />

      <main className="flex-grow max-w-3xl mx-auto px-6 py-16 w-full">

        {/* What is MTD section */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4" style={{ backgroundColor: '#F0EBE1', color: '#C4622D', border: '1px solid #C4622D30' }}>
            Making Tax Digital
          </div>
          <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2.5rem', fontWeight: 700, color: '#1C1208', lineHeight: 1.1, marginBottom: '1.25rem' }}>
            What is Making Tax Digital?
          </h1>
          <p style={{ color: '#4A4035', lineHeight: 1.8, fontSize: '1rem', maxWidth: '600px', marginBottom: '1.25rem' }}>
            If you&apos;re a sole trader or landlord with a gross income of more than <strong>£50,000</strong> from self-employment and/or property, you&apos;ll no longer file just one Self Assessment return a year.
          </p>
          <p style={{ color: '#4A4035', lineHeight: 1.8, fontSize: '1rem', maxWidth: '600px', marginBottom: '1.25rem' }}>
            Instead, from April 2026, you&apos;ll need to keep digital records and send updates to HMRC every three months — plus a final year-end Tax Return.
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
            {MTD_DEADLINES.map((d, i) => (
              <div key={i} className="flex gap-6 pb-8 relative">
                {/* Dot */}
                <div style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: d.highlight ? '#DC2626' : d.isStart ? '#6B8E6E' : d.isFinal ? '#1C1208' : '#C4622D',
                    border: '3px solid #FDFCF8',
                    boxShadow: '0 0 0 2px ' + (d.highlight ? '#DC262640' : d.isStart ? '#6B8E6E40' : '#C4622D40'),
                  }}>
                    <span style={{ color: '#FDFCF8', fontSize: '0.65rem', fontWeight: 800 }}>
                      {d.isStart ? '▶' : d.isFinal ? '★' : d.highlight ? '!' : '◆'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pt-1.5">
                  <p className="text-xs font-bold mb-1" style={{ color: d.highlight ? '#DC2626' : '#9A8F83', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {formatDeadlineDate(d.date)}
                    {d.date === upcoming?.date && (
                      <span style={{ color: '#C4622D', marginLeft: '0.6rem' }}>· next up</span>
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
            ))}
          </div>
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

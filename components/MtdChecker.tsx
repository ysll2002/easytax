'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, CalendarDays, Info } from 'lucide-react';
import { track } from '@/lib/track';

// "Does MTD ITSA apply to me?" — a two-question checker.
//
// Rules (gov.uk, as at September 2026):
//   Qualifying income = gross (pre-expense) income from self-employment + property.
//   > £50,000  → mandated from 6 April 2026
//   > £30,000  → mandated from 6 April 2027
//   > £20,000  → mandated from 6 April 2028
//   ≤ £20,000  → not yet mandated (government has said it will look at this group later)
// Mandation is assessed on the tax return filed two years earlier (e.g. the
// 2024/25 return decides April 2026), and re-checked every year.

type IncomeType = 'sole_trader' | 'landlord' | 'both' | 'none';
type Band = 'under20' | '20to30' | '30to50' | 'over50';

type Verdict =
  | { kind: 'mandated'; from: 2026 | 2027 | 2028 }
  | { kind: 'not_yet' }
  | { kind: 'not_applicable' };

const display = 'var(--font-display), Playfair Display, Georgia, serif';

const incomeTypes: { value: IncomeType; label: string; hint: string }[] = [
  { value: 'sole_trader', label: 'Self-employed / sole trader',       hint: 'Freelancer, contractor, tradesperson, side business' },
  { value: 'landlord',    label: 'Landlord',                          hint: 'UK or overseas rental property, including a single flat' },
  { value: 'both',        label: 'Both self-employed and a landlord', hint: 'Income from a business and from property' },
  { value: 'none',        label: 'Neither',                           hint: 'Only employment (PAYE), pension, or limited-company salary & dividends' },
];

const bands: { value: Band; label: string; hint: string }[] = [
  { value: 'over50',  label: 'Over £50,000',       hint: 'Mandated from April 2026' },
  { value: '30to50',  label: '£30,001 – £50,000',  hint: 'Mandated from April 2027' },
  { value: '20to30',  label: '£20,001 – £30,000',  hint: 'Mandated from April 2028' },
  { value: 'under20', label: '£20,000 or less',    hint: 'Not yet mandated' },
];

function decide(type: IncomeType, band: Band): Verdict {
  if (type === 'none') return { kind: 'not_applicable' };
  switch (band) {
    case 'over50':  return { kind: 'mandated', from: 2026 };
    case '30to50':  return { kind: 'mandated', from: 2027 };
    case '20to30':  return { kind: 'mandated', from: 2028 };
    default:        return { kind: 'not_yet' };
  }
}

// Quarterly deadlines for a given tax year starting 6 April `year`.
function quartersFor(year: number) {
  return [
    { q: 'Q1', period: `6 Apr – 5 Jul ${year}`,       due: `7 Aug ${year}` },
    { q: 'Q2', period: `6 Jul – 5 Oct ${year}`,       due: `7 Nov ${year}` },
    { q: 'Q3', period: `6 Oct ${year} – 5 Jan ${year + 1}`, due: `7 Feb ${year + 1}` },
    { q: 'Q4', period: `6 Jan – 5 Apr ${year + 1}`,   due: `7 May ${year + 1}` },
  ];
}

const optionStyle = (active: boolean) => ({
  display: 'block', width: '100%', textAlign: 'left' as const, cursor: 'pointer',
  padding: '1rem 1.125rem', borderRadius: '1rem',
  border: `1.5px solid ${active ? '#C4622D' : '#DDD5C8'}`,
  backgroundColor: active ? '#FBF1EA' : '#FFFFFF',
  transition: 'all 0.15s',
});

export default function MtdChecker() {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [type, setType] = useState<IncomeType | null>(null);
  const [band, setBand] = useState<Band | null>(null);

  const verdict = useMemo(() => (type && band ? decide(type, band) : null), [type, band]);

  function chooseType(v: IncomeType) {
    if (type === null) track('mtd_check_started');
    setType(v);
    if (v === 'none') {
      setBand('under20');
      track('mtd_check_completed', { income_type: v, band: 'n/a', verdict: 'not_applicable' });
      setStep(2);
    } else {
      setStep(1);
    }
  }

  function chooseBand(v: Band) {
    setBand(v);
    const d = decide(type!, v);
    track('mtd_check_completed', { income_type: type, band: v, verdict: d.kind === 'mandated' ? `mandated_${d.from}` : d.kind });
    setStep(2);
  }

  function reset() {
    setStep(0); setType(null); setBand(null);
  }

  const today = new Date();

  return (
    <div className="rounded-3xl overflow-hidden" style={{ border: '1.5px solid #DDD5C8', backgroundColor: '#FDFCF8', boxShadow: '0 20px 60px rgba(28,18,8,0.08)' }}>
      {/* progress */}
      <div className="flex items-center gap-2 px-5 sm:px-8 pt-5">
        {[0, 1, 2].map(i => (
          <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, backgroundColor: i <= step ? '#C4622D' : '#E8E2DA', transition: 'background-color 0.2s' }} />
        ))}
      </div>

      <div className="px-5 sm:px-8 py-6 sm:py-8">
        {step === 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9A8F83' }}>Question 1 of 2</p>
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.35rem, 3vw, 1.75rem)', fontWeight: 700, color: '#1C1208', marginBottom: '1.25rem', lineHeight: 1.2 }}>
              Which of these describes your income?
            </h2>
            <div className="space-y-3">
              {incomeTypes.map(o => (
                <button key={o.value} type="button" onClick={() => chooseType(o.value)} style={optionStyle(type === o.value)}>
                  <span className="block font-semibold text-sm sm:text-base" style={{ color: '#1C1208' }}>{o.label}</span>
                  <span className="block text-xs mt-0.5" style={{ color: '#9A8F83' }}>{o.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9A8F83' }}>Question 2 of 2</p>
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.35rem, 3vw, 1.75rem)', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem', lineHeight: 1.2 }}>
              What was your gross income from {type === 'landlord' ? 'property' : type === 'both' ? 'self-employment and property combined' : 'self-employment'} in 2024/25?
            </h2>
            <p className="text-sm mb-5" style={{ color: '#4A4035', lineHeight: 1.6 }}>
              Gross means <strong>before</strong> expenses — your turnover or total rent, not your profit. If your income has grown since, pick the band you&apos;re in now: HMRC re-checks every year.
            </p>
            <div className="space-y-3">
              {bands.map(o => (
                <button key={o.value} type="button" onClick={() => chooseBand(o.value)} style={optionStyle(band === o.value)}>
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-sm sm:text-base" style={{ color: '#1C1208' }}>{o.label}</span>
                    <span className="text-xs whitespace-nowrap" style={{ color: '#9A8F83' }}>{o.hint}</span>
                  </span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setStep(0)} className="inline-flex items-center gap-1 text-sm mt-5 py-2" style={{ color: '#9A8F83', background: 'none', border: 'none', cursor: 'pointer' }}>
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        )}

        {step === 2 && verdict && (
          <Result verdict={verdict} type={type!} today={today} onReset={reset} />
        )}
      </div>
    </div>
  );
}

function Result({ verdict, type, today, onReset }: { verdict: Verdict; type: IncomeType; today: Date; onReset: () => void }) {
  const ctaHref = '/register?ref=mtd-checker';
  const onCta = () => track('mtd_check_cta_click', { verdict: verdict.kind === 'mandated' ? `mandated_${verdict.from}` : verdict.kind });

  if (verdict.kind === 'not_applicable') {
    return (
      <div>
        <Badge color="#6B8E6E" icon={<CheckCircle2 size={14} />} text="MTD ITSA does not apply to you" />
        <h2 style={{ fontFamily: display, fontSize: 'clamp(1.35rem, 3vw, 1.75rem)', fontWeight: 700, color: '#1C1208', margin: '0.75rem 0 0.75rem', lineHeight: 1.2 }}>
          You don&apos;t need to send quarterly updates.
        </h2>
        <p className="text-sm mb-4" style={{ color: '#4A4035', lineHeight: 1.7 }}>
          Making Tax Digital for Income Tax only covers income from <strong>self-employment</strong> and <strong>property</strong>. Employment (PAYE), pensions, and salary or dividends from your own limited company are not in scope — your company&apos;s Corporation Tax and VAT are handled separately.
        </p>
        <p className="text-sm mb-6" style={{ color: '#4A4035', lineHeight: 1.7 }}>
          If you run a limited company, EasyTax files your VAT returns and CT600 directly to HMRC for £24 per submission. If you pick up freelance or rental income later, run this check again.
        </p>
        <Actions ctaHref={ctaHref} ctaLabel="See what EasyTax files for companies" onCta={onCta} onReset={onReset} />
      </div>
    );
  }

  if (verdict.kind === 'not_yet') {
    return (
      <div>
        <Badge color="#6B8E6E" icon={<CheckCircle2 size={14} />} text="Not mandated yet" />
        <h2 style={{ fontFamily: display, fontSize: 'clamp(1.35rem, 3vw, 1.75rem)', fontWeight: 700, color: '#1C1208', margin: '0.75rem 0 0.75rem', lineHeight: 1.2 }}>
          Below £20,000 you don&apos;t have to use MTD — for now.
        </h2>
        <p className="text-sm mb-4" style={{ color: '#4A4035', lineHeight: 1.7 }}>
          The mandation thresholds are £50,000 (April 2026), £30,000 (April 2027) and £20,000 (April 2028). The government has said it will decide later how and when people under £20,000 join. You keep filing a normal Self Assessment return by 31 January.
        </p>
        <p className="text-sm mb-6" style={{ color: '#4A4035', lineHeight: 1.7 }}>
          <strong>Watch your income:</strong> the moment your gross {type === 'landlord' ? 'rent' : 'turnover'} crosses a threshold on a tax return, you&apos;re mandated from the April two years later. You can also join MTD voluntarily to spread the work across the year.
        </p>
        <Actions ctaHref={ctaHref} ctaLabel="File Self Assessment for £24" onCta={onCta} onReset={onReset} />
      </div>
    );
  }

  // mandated
  const from = verdict.from;
  const alreadyLive = today.getTime() >= Date.UTC(from, 3, 6);
  const quarters = quartersFor(from);
  const firstYearDeadlines = quarters;
  const passed = (due: string) => new Date(`${due} 23:59:59 UTC`).getTime() < today.getTime();
  const missed = alreadyLive ? firstYearDeadlines.filter(q => passed(q.due)) : [];
  const nextUp = firstYearDeadlines.find(q => !passed(q.due));

  return (
    <div>
      <Badge color={alreadyLive ? '#C4622D' : '#C9963D'} icon={<AlertTriangle size={14} />} text={alreadyLive ? 'MTD ITSA applies to you now' : `MTD ITSA applies to you from 6 April ${from}`} />
      <h2 style={{ fontFamily: display, fontSize: 'clamp(1.35rem, 3vw, 1.75rem)', fontWeight: 700, color: '#1C1208', margin: '0.75rem 0 0.75rem', lineHeight: 1.2 }}>
        {alreadyLive
          ? 'You must keep digital records and send quarterly updates to HMRC.'
          : `From ${from} you'll send HMRC four quarterly updates a year, plus a final return.`}
      </h2>
      <p className="text-sm mb-5" style={{ color: '#4A4035', lineHeight: 1.7 }}>
        {alreadyLive
          ? `Your gross income is over £${from === 2026 ? '50,000' : from === 2027 ? '30,000' : '20,000'}, so you were brought into Making Tax Digital on 6 April ${from}. Each quarter you send HMRC a cumulative summary of income and expenses from digital records, then confirm the year with a final declaration by 31 January.`
          : `Your gross income puts you in the ${from} wave. Nothing changes until then — but from 6 April ${from} you'll need MTD-compatible software and digital records from day one of the tax year.`}
      </p>

      {missed.length > 0 && (
        <div className="p-4 rounded-2xl mb-5 flex gap-3" style={{ backgroundColor: '#FBF1EA', border: '1px solid #E8C9B4' }}>
          <AlertTriangle size={18} color="#C4622D" className="flex-shrink-0 mt-0.5" />
          <p className="text-sm" style={{ color: '#1C1208', lineHeight: 1.6 }}>
            <strong>{missed.length === 1 ? `The ${missed[0].q} deadline (${missed[0].due}) has already passed.` : `${missed.length} deadlines have already passed this year.`}</strong>{' '}
            If you haven&apos;t sent {missed.length === 1 ? 'it' : 'them'} yet, send now — each late quarterly update earns a penalty point, and four points triggers a £200 fine.
          </p>
        </div>
      )}

      <div className="rounded-2xl p-4 sm:p-5 mb-6" style={{ backgroundColor: '#F8F5F0', border: '1px solid #E8E2DA' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: '#9A8F83' }}>
          <CalendarDays size={13} /> Your quarterly deadlines · {from}/{String(from + 1).slice(-2)}
        </p>
        <ul className="space-y-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {firstYearDeadlines.map(q => {
            const isNext = nextUp?.q === q.q;
            const done = alreadyLive && passed(q.due);
            return (
              <li key={q.q} className="flex items-center justify-between gap-3 text-sm py-1.5" style={{ borderBottom: '1px solid #EEE7DC', opacity: done ? 0.55 : 1 }}>
                <span style={{ color: '#4A4035' }}>
                  <strong style={{ color: '#1C1208' }}>{q.q}</strong> · {q.period}
                </span>
                <span className="font-semibold whitespace-nowrap" style={{ color: isNext ? '#C4622D' : '#1C1208' }}>
                  {isNext ? 'Next: ' : ''}{q.due}
                </span>
              </li>
            );
          })}
          <li className="flex items-center justify-between gap-3 text-sm py-1.5">
            <span style={{ color: '#4A4035' }}><strong style={{ color: '#1C1208' }}>Final declaration</strong> · whole year</span>
            <span className="font-semibold whitespace-nowrap" style={{ color: '#1C1208' }}>31 Jan {from + 2}</span>
          </li>
        </ul>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9A8F83' }}>What to do now</p>
      <ol className="space-y-2 mb-6 text-sm" style={{ color: '#4A4035', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
        <li>Pick MTD-compatible software and connect your business bank account so records are digital from day one.</li>
        <li>Sign up to MTD for Income Tax with HMRC (or your software will guide you) before your first quarter ends.</li>
        <li>Send each quarterly update by the 7th of the month after the quarter ends — a summary, not a full return.</li>
      </ol>

      <Actions ctaHref={ctaHref} ctaLabel={alreadyLive ? 'Send my quarterly update — £24' : 'Get MTD-ready with EasyTax'} onCta={onCta} onReset={onReset} />

      <p className="text-xs mt-5 flex gap-1.5 items-start" style={{ color: '#9A8F83', lineHeight: 1.6 }}>
        <Info size={13} className="flex-shrink-0 mt-0.5" />
        <span>Guidance only, based on gov.uk rules as at September 2026. Exemptions exist (e.g. digitally excluded, some trusts and estates). Confirm your position at <a href="https://www.gov.uk/guidance/check-if-youre-eligible-for-making-tax-digital-for-income-tax" target="_blank" rel="noopener noreferrer" style={{ color: '#C4622D' }}>gov.uk</a>.</span>
      </p>
    </div>
  );
}

function Badge({ color, icon, text }: { color: string; icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: color, color: '#FDFCF8' }}>
      {icon} {text}
    </span>
  );
}

function Actions({ ctaHref, ctaLabel, onCta, onReset }: { ctaHref: string; ctaLabel: string; onCta: () => void; onReset: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
      <Link href={ctaHref} onClick={onCta} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm" style={{ backgroundColor: '#C4622D', color: '#FDFCF8', textDecoration: 'none' }}>
        {ctaLabel} <ArrowRight size={16} />
      </Link>
      <Link href="/timetable" className="inline-flex items-center justify-center px-6 py-3.5 rounded-full font-medium text-sm" style={{ border: '1px solid #DDD5C8', color: '#1C1208', textDecoration: 'none' }}>
        Full MTD timetable
      </Link>
      <button type="button" onClick={onReset} className="text-sm py-2 sm:ml-auto" style={{ color: '#9A8F83', background: 'none', border: 'none', cursor: 'pointer' }}>
        Start again
      </button>
    </div>
  );
}

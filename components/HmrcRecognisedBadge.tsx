import { HMRC_LISTING_URL } from '@/lib/brand';

// "HMRC recognised" trust badge, in MTD Buddy's own design.
//
// HMRC's Developer Hub terms of use: vendors "must not use HMRC logos or other
// crown copyright material and branding" on their website, and may describe
// software as "HMRC recognised" (never "approved", "accredited" or
// "certified") once it has completed HMRC's recognition process. So this is
// our wording and our colours, not HMRC's artwork, and it links to our GOV.UK
// listing as the proof.
export default function HmrcRecognisedBadge({
  title,
  subtitle,
  newTabLabel,
}: {
  title: string;
  subtitle: string;
  newTabLabel: string;
}) {
  return (
    <a
      href={HMRC_LISTING_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-stretch rounded-xl overflow-hidden transition-shadow hover:shadow-md"
      style={{ border: '2px solid #4B6A4E', backgroundColor: '#FDFCF8', textDecoration: 'none' }}
    >
      <span
        className="flex items-center justify-center px-3 sm:px-4"
        style={{ backgroundColor: '#4B6A4E' }}
        aria-hidden
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" fill="#FDFCF8" />
          <path d="M7 12.5l3.2 3.2L17.5 8.5" stroke="#A04E1C" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="flex flex-col justify-center px-3 sm:px-4 py-2">
        <span className="font-bold" style={{ color: '#1C1208', fontSize: '1.05rem', lineHeight: 1.2 }}>
          {title}
        </span>
        <span className="text-xs" style={{ color: '#4A4035', lineHeight: 1.4 }}>
          {subtitle}
        </span>
        <span className="sr-only"> ({newTabLabel})</span>
      </span>
    </a>
  );
}

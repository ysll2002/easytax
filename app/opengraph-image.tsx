import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og';
import { getMtdStatus } from '@/lib/mtd-status';

export const alt = 'EasyTax — MTD ITSA software for UK sole traders and landlords';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// The site-wide card. Inherited by every route that does not define its own,
// which is most of them.
//
// Regenerated hourly rather than frozen at deploy time, for the same reason
// /timetable is: the card states which quarterly update is due next and how
// long is left. A card baked at build time would keep saying "60 days" until
// the next deploy, and would eventually count down past a deadline that has
// already passed — on a preview image we have no way to see.
export const revalidate = 3600;

export default async function Image() {
  const status = getMtdStatus();

  const subtitle =
    status.isLive && status.dueQuarter && status.daysUntilDue !== null
      ? `${status.dueQuarter.taxYear} ${status.dueQuarter.key} quarterly update due ${status.dueQuarter.deadlineLabel}. £24 per submission, no subscription.`
      : 'Quarterly updates, Self Assessment, VAT and CT600 — £24 per submission, no subscription.';

  return renderOgCard({
    eyebrow: status.isLive ? 'Making Tax Digital is live' : 'Making Tax Digital for Income Tax',
    title: 'File with HMRC without a monthly subscription',
    subtitle,
    figure:
      status.isLive && status.daysUntilDue !== null
        ? { value: String(status.daysUntilDue), caption: 'days to the next update' }
        : undefined,
  });
}

// The free calculators, described once.
//
// The list previously lived inside app/tools/page.tsx, so the hub was the only
// page that knew the set existed. Lifting it here lets the individual tool
// pages link each other and lets the homepage surface the set — which is the
// point: in 30 days the hub was viewed 0 times and the three tools took 2 page
// views between them, because nothing but the nav ever pointed at them.

export type ToolKey = 'mtd_deadline' | 'sa_penalty' | 'payments_on_account';

export interface Tool {
  /** Matches the `tool` prop on tool_started / tool_completed events, so the
   *  metrics endpoint and this list cannot drift apart. */
  key: ToolKey;
  href: string;
  name: string;
  /** The search-shaped question the tool answers. */
  question: string;
  blurb: string;
  /** Who it is for — shown as a chip. */
  for: string;
  /** One short line for the homepage strip, where there is no room for blurb. */
  short: string;
}

export const TOOLS: Tool[] = [
  {
    key: 'mtd_deadline',
    href: '/mtd-deadline-checker',
    name: 'MTD deadline checker',
    question: 'Am I in Making Tax Digital, and when are my deadlines?',
    blurb:
      'Enter your income and get the tax year you come into MTD for Income Tax, all four quarterly update deadlines and your final declaration date.',
    for: 'Sole traders and landlords',
    short: 'Find out if MTD applies to you, and when your quarterly updates are due.',
  },
  {
    key: 'sa_penalty',
    href: '/self-assessment-penalty-calculator',
    name: 'Late filing penalty calculator',
    question: 'What will HMRC charge me for a late tax return?',
    blurb:
      'The £100 fixed penalty, £10 daily charges, the 6 and 12 month penalties and the 5% late payment charges — itemised, with the date each one starts.',
    for: 'Anyone who has missed 31 January',
    short: 'Itemise what a late return costs, with the date each charge starts.',
  },
  {
    key: 'payments_on_account',
    href: '/payments-on-account-calculator',
    name: 'Payments on account calculator',
    question: 'What will actually leave my account in January?',
    blurb:
      'Your balancing payment plus the two advance instalments HMRC adds towards next year, on the dates they are actually taken.',
    for: 'First-time Self Assessment filers',
    short: 'See the balancing payment plus the advance instalments HMRC adds on top.',
  },
];

/** The other tools, for the cross-link block at the foot of a tool page. */
export function otherTools(current: ToolKey): Tool[] {
  return TOOLS.filter(t => t.key !== current);
}

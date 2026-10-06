// The nine comparison pages, as data, so something can list them.
//
// Why this exists. On 2026-09-17 all nine `/*-alternative` pages had zero page
// views over both the last 7 and the last 30 days. They are not thin and they
// are not duplicates — they run 1,800 to 2,700 words each, with their own
// feature tables and their own pricing arithmetic. They are the highest
// commercial intent pages on the site: somebody searching "Xero alternative UK"
// is shopping, not reading.
//
// What they had was nowhere to sit. Every one of them was reachable from
// exactly one place — a row of nine bare product names in the site footer — and
// from the sitemap. `/mtd-software`, the 2,900-word page that is the obvious
// topical parent of "which MTD software should I use", linked to none of them.
// So the nine pages that answer a buying question had no internal path from any
// page that ranks, on a site where the only page search surfaces at all is the
// homepage.
//
// **The duplication here is deliberate and has a cost worth naming.** The price
// lines below also appear, in more detail and with the arithmetic worked
// through, on each competitor's own page. They are restated rather than
// imported because those pages hold theirs as prose inside JSX — extracting
// them would mean rewriting nine hand-written pages to serve a tenth, which is
// a much larger and riskier change than this one is worth. The cost is that a
// competitor changing their prices needs an edit in two places. The mitigation
// is that this file states ranges and framing rather than the worked totals, so
// the hub can only ever be less specific than the page it links to, never in
// contradiction with it. Same trade, and the same reasoning, as
// LANDING_PAGE_TITLES in lib/queue-reconcile.ts.

export type Competitor = {
  /** Product name as its own customers would write it. */
  name: string;
  /** Path of its comparison page. */
  href: string;
  /** Headline price, as that page leads with it. A range, never a total. */
  price: string;
  /** Who the product is aimed at — the honest version, not a dismissal. A
   *  comparison page that pretends the alternative is bad is not persuasive to
   *  somebody who is currently paying for it. */
  who: string;
  /** The one reason a reader of this site specifically might switch. */
  switchReason: string;
};

// Every figure below was read off the comparison page it links to, not
// recalled. An earlier draft of this file had QuickBooks at £10/mo and
// TaxScouts at £169 from memory; the pages say £14 and £119–169. Publishing a
// competitor's price wrongly on a tax product's own site is the cheapest
// possible way to lose a reader who knows what they currently pay.
export const COMPETITORS: readonly Competitor[] = [
  {
    name: 'QuickBooks',
    href: '/quickbooks-alternative',
    price: 'From £14/mo + VAT',
    who: 'Full double-entry bookkeeping for growing businesses.',
    switchReason: 'You want to file to HMRC, not to run a general ledger.',
  },
  {
    name: 'Xero',
    href: '/xero-alternative',
    price: 'From £16/mo + VAT',
    who: 'Accounting software built around an accountant relationship.',
    switchReason: 'Starter caps bank transactions; most sole traders end up on £33/mo.',
  },
  {
    name: 'FreeAgent',
    href: '/freeagent-alternative',
    price: '£228+/year',
    who: 'Freelancers and contractors who also want invoicing and time tracking.',
    switchReason: 'You pay for the year whether you file four times or once.',
  },
  {
    name: 'Sage',
    href: '/sage-alternative',
    price: 'Up to £336+/year',
    who: 'Established small businesses, often working with a bookkeeper.',
    switchReason: 'Priced for a company with staff, not for one person filing.',
  },
  {
    name: 'Crunch',
    href: '/crunch-alternative',
    price: '£35–£110 + VAT/mo',
    who: 'People who want an accountant included, not just software.',
    switchReason: 'You already know your numbers and only need the submission.',
  },
  {
    name: 'Coconut',
    href: '/coconut-alternative',
    price: '£99.99–£159.99/year',
    who: 'Sole traders and landlords wanting a simple mobile-first ledger.',
    switchReason: 'Billed whether you file or not.',
  },
  {
    name: 'KashFlow',
    href: '/kashflow-alternative',
    price: '£10–£27 + VAT/mo',
    who: 'Small businesses handling VAT and payroll in one place.',
    switchReason: 'Built around VAT; MTD ITSA is not what it was designed for.',
  },
  {
    name: 'Bokio',
    href: '/bokio-alternative',
    price: '£299.40/year (£24.95/mo)',
    who: 'Bokio closed its UK service on 7 July 2026.',
    switchReason: 'If you have not moved yet, you need somewhere to file from.',
  },
  {
    name: 'TaxScouts',
    href: '/taxscouts-alternative',
    price: '£119–£169+ per year',
    who: 'People who want a human accountant to prepare the return.',
    switchReason: 'One return costs more than a year of filings here.',
  },
];

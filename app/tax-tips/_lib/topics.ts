// Topic clusters over the Tax Tips archive — the taxonomy itself.
//
// Why this exists: the archive is the only part of easytax.vip that earns
// organic search traffic at all — the entries in the analytics table arrive on
// article URLs from Google and Bing, never on the commercial landing pages.
// But 110 articles sitting in a flat, reverse-chronological list have no
// topical structure: nothing tells a search engine that a dozen of them are
// about VAT and another dozen about Making Tax Digital, and nothing lets a
// reader who arrived on one VAT article find the other eleven.
//
// Grouping them fixes both. Each hub is a real page targeting a broader head
// term than any single article can, and it gives every article in the cluster
// an extra inbound internal link from a topically related page — which is the
// signal that flat pagination cannot provide.
//
// The articles table has no tags column, so membership is derived from the
// title. That is deliberate: it is deterministic, needs no migration and no
// backfill, and a mis-filed article is fixed by editing the keyword list here
// rather than by touching 110 rows. Keywords are matched case-insensitively
// as substrings of the title.
//
// This file is kept free of imports on purpose, so the taxonomy can be
// exercised against the real corpus without standing up Supabase. The queries
// that use it live in ./topic-articles.

export interface Topic {
  slug: string;
  /** Short label, used in nav and chips. */
  label: string;
  /** Page <h1> and title tag. */
  heading: string;
  /** Meta description and intro paragraph. Written per topic — a hub with
   *  boilerplate copy is a thin page. */
  intro: string;
  keywords: string[];
}

/** A hub with fewer than this many articles is not published: a page listing
 *  one or two links is thin, and thin pages drag on the whole archive. */
export const MIN_ARTICLES_PER_TOPIC = 3;

export const TOPICS: Topic[] = [
  {
    slug: 'making-tax-digital',
    label: 'Making Tax Digital',
    heading: 'Making Tax Digital for Income Tax',
    intro:
      'MTD for Income Tax replaces the annual Self Assessment return with four quarterly updates and a final declaration. These guides cover who is mandated and when, what each quarterly update must contain, how to keep records that satisfy the rules, and the mistakes that turn a routine submission into a rejected one.',
    keywords: ['mtd', 'making tax digital', 'quarterly reporting', 'quarterly updates', 'quarterly payments', 'quarterly tax payments'],
  },
  {
    slug: 'home-office-expenses',
    label: 'Home office',
    heading: 'Home office and working from home expenses',
    intro:
      'Claiming for a home you also work in is the most common source of both under-claiming and HMRC scrutiny. These guides compare the flat rate against actual costs, set out what a defensible apportionment looks like, and explain when equipment should be capitalised rather than expensed.',
    keywords: ['home office', 'home working', 'working from home', 'home office deduction', 'home office equipment'],
  },
  {
    slug: 'vat',
    label: 'VAT',
    heading: 'VAT for small UK businesses',
    intro:
      'Registration thresholds, the Flat Rate Scheme, partial exemption, the reverse charge and pre-registration recovery — plus what to do when a return is late. These guides deal with the VAT decisions that actually change what a small business pays.',
    keywords: ['vat'],
  },
  {
    slug: 'capital-allowances',
    label: 'Capital allowances',
    heading: 'Capital allowances and business assets',
    intro:
      'The Annual Investment Allowance, full expensing, first year allowances and the fixtures rules decide how quickly an asset turns into tax relief. These guides cover which allowance applies to what, the timing traps around your year-end, and when a purchase is an expense rather than an asset at all.',
    keywords: ['capital allowance', 'annual investment allowance', 'plant & machinery', 'plant and machinery', 'fixtures', 'full expensing', 'capitalise or expense', 'expense or capital asset'],
  },
  {
    slug: 'travel-and-vehicles',
    label: 'Travel & vehicles',
    heading: 'Travel, mileage and vehicle costs',
    intro:
      'Mileage rates against actual running costs, private use apportionment, overnight accommodation, subsistence and the line between a business meal and entertainment. These guides cover what a sole trader or director can genuinely claim for getting about and staying away.',
    keywords: ['mileage', 'travel', 'vehicle', 'car expenses', 'subsistence', 'overnight', 'meals and entertainment', 'accommodation'],
  },
  {
    slug: 'allowances-and-reliefs',
    label: 'Allowances & reliefs',
    heading: 'Tax-free allowances and reliefs',
    intro:
      'The £1,000 trading allowance, the property allowance, the personal allowance and marriage allowance are worth real money and are routinely left unclaimed. These guides work through when an allowance beats claiming actual expenses, and when it quietly costs you more.',
    keywords: ['trading allowance', 'tax-free allowance', 'tax-free rental allowance', 'personal & marriage allowance', 'tax-free allowances', 'simplified expenses'],
  },
  {
    slug: 'limited-companies',
    label: 'Limited companies',
    heading: 'Limited company and Corporation Tax',
    intro:
      'Director-specific decisions: dividend timing, spouse salaries, goodwill on acquisitions, intercompany loans, transfer pricing documentation, amending a CT600 and the interest that accrues when Corporation Tax is paid late. These guides are for people running a company, not a sole trade.',
    keywords: ['limited company', 'limited companies', 'corporation tax', 'corp tax', 'ct600', 'director', 'dividend', 'goodwill', 'transfer pricing', 'intercompany', 'related party', 'diverted profits', 'spouse salary', 'interest relief', 'work in progress', 'dissolution', 'uk companies', 'corporate gift'],
  },
  {
    slug: 'losses-and-closing-down',
    label: 'Losses & closing down',
    heading: 'Trading losses, reliefs and winding down',
    intro:
      'A loss is only worth what you can do with it. These guides cover carry-back against carry-forward, overlap relief on a change of basis period, pre-trading expenditure, abandonment losses on failed investments, and how to time a cessation so the final year does not cost more than it should.',
    keywords: ['losses', 'loss relief', 'carry-back', 'carried forward', 'overlap relief', 'pre-trading', 'abandonment', 'cessation', 'dissolution relief'],
  },
  {
    slug: 'landlords-and-property',
    label: 'Landlords & property',
    heading: 'Landlord and property tax',
    intro:
      'Mixed-use premises, apportioning costs between personal and business space, the property allowance, and interest relief on bridging and refinancing. These guides cover the tax questions that come with owning property you also let or work from.',
    keywords: ['property', 'landlord', 'mixed-use', 'mixed use', 'rental', 'bridging loan'],
  },
  {
    slug: 'penalties-and-corrections',
    label: 'Penalties & corrections',
    heading: 'HMRC penalties, appeals and correcting returns',
    intro:
      'What HMRC charges when a return or a payment is late, what counts as a reasonable excuse, how to appeal a penalty, and how to correct a return you have already filed — before HMRC opens an enquiry into it.',
    keywords: ['penalt', 'reasonable excuse', 'appeal', 'correct past', 'correct old', 'amend your ct600', 'surcharge', 'late tax return', 'underpayment'],
  },
  {
    slug: 'self-assessment-basics',
    label: 'Self Assessment',
    heading: 'Self Assessment basics and basis periods',
    intro:
      "Why your first tax bill covers a period you do not recognise, how the cash basis differs from accruals, what SA302 adjustment income means, and why HMRC's figures sometimes differ from your own. These guides cover the mechanics of the return itself.",
    keywords: ['self assessment', 'basis period', 'sa302', 'cash basis', 'accruals', 'accounting year', 'first tax bill'],
  },
  {
    slug: 'contractors-and-ir35',
    label: 'Contractors & IR35',
    heading: 'IR35, CIS and contractor status',
    intro:
      'Employment status is the most expensive thing to get wrong as a contractor. These guides cover the IR35 and PSC rules, CIS deductions and how subcontractors reclaim them, and what it actually costs when HMRC decides a contractor was an employee.',
    keywords: ['ir35', 'psc rules', 'cis ', 'contractor', 'subcontractor'],
  },
  {
    slug: 'pensions-and-national-insurance',
    label: 'Pensions & NI',
    heading: 'Pensions and National Insurance',
    intro:
      'Pension contributions are the largest remaining tax relief available to most self-employed people, and the Class 2 / Class 4 National Insurance split decides what you pay on top of income tax. These guides cover both.',
    keywords: ['pension', 'national insurance', 'class 2', 'class 4'],
  },
];

export function topicBySlug(slug: string): Topic | undefined {
  return TOPICS.find(t => t.slug === slug);
}

export function titleMatchesTopic(topic: Topic, title: string): boolean {
  const t = title.toLowerCase();
  return topic.keywords.some(k => t.includes(k));
}

/** Every topic an article belongs to. An article can sit in more than one — a
 *  piece on MTD home office claims genuinely belongs in both hubs. */
export function topicsForTitle(title: string): Topic[] {
  return TOPICS.filter(t => titleMatchesTopic(t, title));
}

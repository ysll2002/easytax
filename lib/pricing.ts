// What EasyTax costs, in one place.
//
// Why this file exists. The price has now changed direction twice:
//
//   2026-08-25  free → £20 + VAT (£24 inc. VAT) per HMRC submission  (3bc11dc)
//   2026-10-14  back to free                                          (this change)
//
// The first flip touched sixteen files and still missed six of the seven
// locales, which carried "free" copy for a day until 58542a4 caught up. It also
// left `lib/site-entity.ts` asserting `price: '0'` against a £24 Offer on the
// homepage — two contradicting Offer nodes for the same product, which is the
// kind of thing that reads as a bait-and-switch to anybody who checks. That was
// fixed later, by hand, because nothing tied the two together.
//
// So: every place where the price appears as a *discrete repeated value* — the
// chip on each landing page, the EasyTax row of a comparison table, the
// typical-annual-cost figure, the schema.org Offer — reads it from here. The
// next flip is this file plus the prose.
//
// Prose is deliberately NOT templated. Thirteen landing pages work the
// arithmetic through in their own voice ("Paying £228/year for FreeAgent?
// EasyTax files the same returns for £24 each"), and a sentence that survives
// having its price substituted by string interpolation is a sentence nobody
// wanted to read. Those are hand-written and hand-changed. What this file buys
// is that the machine-readable claims and the repeated UI atoms cannot drift
// apart from each other, which is the failure that actually happened.

/**
 * Is there a charge at all? Kept as a flag rather than inferred from
 * `PRICE === 0`, because several call sites need to drop a whole block (a VAT
 * line, a refunds clause, a founder-price note) rather than print a different
 * number.
 */
export const IS_FREE = true;

/** Price in GBP, inclusive of VAT, as a number. */
export const PRICE_INC_VAT = 0;

/** The price as a bare figure. Goes in the big number on /pricing. */
export const PRICE_DISPLAY = '£0';

/**
 * The chip that sits under the hero on every landing page. Short enough for a
 * pill, complete enough to stand alone next to a competitor's monthly fee.
 */
export const PRICE_CHIP = 'Free — no subscription';

/** The EasyTax cell in a feature-comparison table. Two words at most. */
export const PRICE_TABLE_CELL = 'Free';

/**
 * The EasyTax row of a cost-comparison table, where every other row reads
 * "£19–£29 / month subscription". Describes the model, not a number.
 */
export const PRICE_MODEL = 'Free — no subscription, no per-filing fee';

/** What a year of filing costs, against competitors' £120–£1,080. */
export const TYPICAL_ANNUAL_COST = '£0';

/**
 * One clause, for dropping mid-sentence after an em dash: "...file to HMRC in
 * minutes — free, no subscription."
 */
export const PRICE_CLAUSE = 'free, no subscription';

/**
 * One sentence, for meta descriptions and the ends of paragraphs. Says both
 * halves — no recurring fee and no per-use fee — because "free" on its own
 * reads as a trial to anyone who has shopped for accounting software.
 */
export const PRICE_SENTENCE =
  'EasyTax is free to use — no subscription and no per-filing fee.';

/**
 * The schema.org Offer, shared by the SoftwareApplication node in
 * `lib/site-entity.ts` and the Product node on `/pricing`. These two were
 * allowed to contradict each other once; now they cannot.
 *
 * `price: '0'` with a currency is the correct encoding for free software —
 * omitting `offers` entirely means "no price stated", which is a different
 * claim and loses the rich result.
 *
 * No `availability` here deliberately: it differs by what the node describes.
 * The app and the free tools are usable today; HMRC filing is still waiting on
 * production approval, so `/pricing` spreads this and adds `PreOrder`.
 */
export const OFFER_JSONLD = {
  '@type': 'Offer' as const,
  price: '0',
  priceCurrency: 'GBP',
  description: 'Free to use — no subscription, no per-filing fee, no card to sign up',
} as const;

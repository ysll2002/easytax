// Business records — the customer's digital record for MTD quarterly updates.
//
// Shared by the records API, the quarterly totals endpoint, the company
// reports and the Records page. No secrets or server-only imports here.
//
// Records are entered by hand or imported from a CSV bank statement the
// customer downloads themselves. MTD Buddy has no AISP permission, so it does
// not connect to bank accounts.

export type RecordCategory = 'unreviewed' | 'business_income' | 'business_expense' | 'personal';

export const RECORD_CATEGORIES: RecordCategory[] = ['unreviewed', 'business_income', 'business_expense', 'personal'];

export type ExpenseBucket =
  | 'costOfGoods' | 'staffCosts' | 'travelCosts' | 'premisesRunningCosts'
  | 'adminCosts' | 'advertisingCosts' | 'professionalFees' | 'otherExpenses';

// HMRC self-employment period summary expense categories (Self Employment
// Business API). Labels follow the SA103 box names.
export const EXPENSE_BUCKETS: { key: ExpenseBucket; label: string }[] = [
  { key: 'costOfGoods',          label: 'Cost of goods bought for resale' },
  { key: 'staffCosts',           label: 'Staff costs' },
  { key: 'travelCosts',          label: 'Car, van and travel' },
  { key: 'premisesRunningCosts', label: 'Rent, rates, power and insurance' },
  { key: 'adminCosts',           label: 'Phone, stationery and office costs' },
  { key: 'advertisingCosts',     label: 'Advertising and entertainment' },
  { key: 'professionalFees',     label: 'Accountancy, legal and professional fees' },
  { key: 'otherExpenses',        label: 'Other business expenses' },
];

export const EXPENSE_BUCKET_KEYS = EXPENSE_BUCKETS.map(b => b.key);

// Suggested bucket from the description. The customer can override it per
// record; the override is stored in expense_bucket.
const EXPENSE_RULES: { bucket: ExpenseBucket; keywords: string[] }[] = [
  { bucket: 'travelCosts',          keywords: ['uber', 'taxi', 'train', 'rail', 'tfl', 'bus', 'fuel', 'petrol', 'parking', 'hotel', 'airbnb', 'flight', 'easyjet', 'ryanair', 'ba.com', 'heathrow'] },
  { bucket: 'adminCosts',           keywords: ['amazon', 'apple', 'microsoft', 'google', 'adobe', 'github', 'netlify', 'vercel', 'aws', 'digitalocean', 'cloudflare', 'software', 'saas', 'hosting', 'domain', 'openai', 'anthropic', 'slack', 'notion', 'figma', 'zapier', 'subscription', 'stationery', 'postage', 'printer', 'phone', 'vodafone', 'o2 ', 'three ', 'bt ', 'virgin media', 'broadband'] },
  { bucket: 'professionalFees',     keywords: ['solicitor', 'accountant', 'legal', 'barrister', 'consulting', 'advisor', 'bookkeep'] },
  { bucket: 'premisesRunningCosts', keywords: ['rent', 'office', 'utilities', 'electricity', 'gas ', 'water', 'insurance'] },
  { bucket: 'advertisingCosts',     keywords: ['facebook', 'instagram', 'meta ', 'linkedin', 'twitter', 'google ads', 'advertising', 'marketing', 'mailchimp', 'klaviyo', 'branding'] },
  { bucket: 'staffCosts',           keywords: ['salary', 'wages', 'payroll', 'subcontract'] },
  { bucket: 'costOfGoods',          keywords: ['stock', 'wholesale', 'materials', 'supplier'] },
];

export function suggestBucket(description: string): ExpenseBucket {
  const lower = description.toLowerCase();
  for (const rule of EXPENSE_RULES) {
    if (rule.keywords.some(k => lower.includes(k))) return rule.bucket;
  }
  return 'otherExpenses';
}

// Which income source a record belongs to. Self-employment records make up
// the self-employment quarterly update; property records the UK or foreign
// property one (Property Business API).
export type IncomeSource = 'self-employment' | 'uk-property' | 'foreign-property';
export const INCOME_SOURCES: { key: IncomeSource; label: string }[] = [
  { key: 'self-employment',  label: 'Self-employment' },
  { key: 'uk-property',      label: 'UK property' },
  { key: 'foreign-property', label: 'Foreign property' },
];
export const INCOME_SOURCE_KEYS = INCOME_SOURCES.map(s => s.key);

// HMRC Property Business categories (cumulative period summary). Income ones
// apply to business_income records, expense ones to business_expense records.
export type PropertyBucket =
  | 'rent' | 'premiumsOfLeaseGrant' | 'reversePremiums' | 'otherIncome' | 'rentARoom'
  | 'premisesRunningCosts' | 'repairsAndMaintenance' | 'financialCosts' | 'professionalFees'
  | 'costOfServices' | 'travelCosts' | 'residentialFinancialCost' | 'other';

export const PROPERTY_INCOME_BUCKETS: { key: PropertyBucket; label: string; ukOnly?: boolean }[] = [
  { key: 'rent',                 label: 'Rent received' },
  { key: 'premiumsOfLeaseGrant', label: 'Premiums for the grant of a lease' },
  { key: 'reversePremiums',      label: 'Reverse premiums and inducements', ukOnly: true },
  { key: 'otherIncome',          label: 'Other property income' },
  { key: 'rentARoom',            label: 'Rent a Room rents', ukOnly: true },
];
export const PROPERTY_EXPENSE_BUCKETS: { key: PropertyBucket; label: string }[] = [
  { key: 'premisesRunningCosts',     label: 'Rent, rates, insurance and ground rents' },
  { key: 'repairsAndMaintenance',    label: 'Property repairs and maintenance' },
  { key: 'financialCosts',           label: 'Non-residential finance costs' },
  { key: 'professionalFees',         label: 'Legal, management and professional fees' },
  { key: 'costOfServices',           label: 'Costs of services provided, including wages' },
  { key: 'travelCosts',              label: 'Travel costs' },
  { key: 'residentialFinancialCost', label: 'Residential finance costs (mortgage interest)' },
  { key: 'other',                    label: 'Other allowable property expenses' },
];
export const PROPERTY_BUCKET_KEYS = [...PROPERTY_INCOME_BUCKETS, ...PROPERTY_EXPENSE_BUCKETS].map(b => b.key);

export type BusinessRecord = {
  id: string;
  txn_date: string;          // YYYY-MM-DD
  description: string;
  amount: number;            // + money in, - money out
  category: RecordCategory;
  expense_bucket: ExpenseBucket | null;
  source: 'manual' | 'csv';
  income_source?: IncomeSource;          // default self-employment
  property_bucket?: PropertyBucket | null;
  property_id?: string | null;
  ai_categorised?: boolean;  // sorted by AI and not yet changed by the customer
  locked?: boolean;          // in a quarter already filed with HMRC: cannot change
};

export function bucketOf(r: Pick<BusinessRecord, 'description' | 'expense_bucket'>): ExpenseBucket {
  return r.expense_bucket ?? suggestBucket(r.description);
}

export type QuarterExpenses = Record<ExpenseBucket, number>;

export function emptyExpenses(): QuarterExpenses {
  return Object.fromEntries(EXPENSE_BUCKET_KEYS.map(k => [k, 0])) as QuarterExpenses;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// Totals for a period. Only records the customer has marked as business
// income or expense count; unreviewed and personal records are left out and
// the unreviewed count is reported so the UI can say so.
//
// Self-employment only: property records belong to the property update.
export function summarise(records: (Pick<BusinessRecord, 'description' | 'amount' | 'category' | 'expense_bucket'> & { income_source?: IncomeSource | null })[]) {
  let turnover = 0;
  const expenses = emptyExpenses();
  let unreviewed = 0;
  for (const r of records) {
    if ((r.income_source ?? 'self-employment') !== 'self-employment') continue;
    const amount = Number(r.amount);
    if (r.category === 'business_income') turnover += amount;
    else if (r.category === 'business_expense') expenses[bucketOf(r)] += -amount;
    else if (r.category === 'unreviewed') unreviewed += 1;
  }
  return {
    turnover: round2(turnover),
    expenses: Object.fromEntries(Object.entries(expenses).map(([k, v]) => [k, round2(v)])) as QuarterExpenses,
    unreviewed,
  };
}

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Property bucket for a record: the one chosen, or the default for its category. */
export function propertyBucketOf(r: Pick<BusinessRecord, 'category' | 'property_bucket'>): PropertyBucket {
  if (r.property_bucket) return r.property_bucket;
  return r.category === 'business_income' ? 'rent' : 'other';
}

export type PropertyTotals = {
  income:   Partial<Record<PropertyBucket, number>>;
  expenses: Partial<Record<PropertyBucket, number>>;
  unreviewed: number;
  count: number;
};

/** Totals per HMRC property category for one property income source (and, for foreign property, one property). */
export function summariseProperty(
  records: (Pick<BusinessRecord, 'amount' | 'category' | 'property_bucket'> & { income_source?: IncomeSource | null; property_id?: string | null })[],
  source: 'uk-property' | 'foreign-property',
  propertyId?: string,
): PropertyTotals {
  const income: Partial<Record<PropertyBucket, number>> = {};
  const expenses: Partial<Record<PropertyBucket, number>> = {};
  let unreviewed = 0, count = 0;
  const incomeKeys = new Set(PROPERTY_INCOME_BUCKETS.map(b => b.key));
  for (const r of records) {
    if (r.income_source !== source) continue;
    if (propertyId !== undefined && (r.property_id ?? '') !== propertyId) continue;
    if (r.category === 'unreviewed') { unreviewed += 1; continue; }
    if (r.category !== 'business_income' && r.category !== 'business_expense') continue;
    const b = propertyBucketOf(r);
    const amount = Number(r.amount);
    count += 1;
    if (r.category === 'business_income') {
      const key = incomeKeys.has(b) ? b : 'otherIncome';
      income[key] = round2((income[key] ?? 0) + amount);
    } else {
      const key = incomeKeys.has(b) ? 'other' : b;
      expenses[key] = round2((expenses[key] ?? 0) - amount);
    }
  }
  return { income, expenses, unreviewed, count };
}

// Business records — the customer's digital record for MTD quarterly updates.
//
// Shared by the records API, the quarterly totals endpoint, the company
// reports and the Records page. No secrets or server-only imports here.
//
// Records are entered by hand or imported from a CSV bank statement the
// customer downloads themselves. EasyTax has no AISP permission, so it does
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

export type BusinessRecord = {
  id: string;
  txn_date: string;          // YYYY-MM-DD
  description: string;
  amount: number;            // + money in, - money out
  category: RecordCategory;
  expense_bucket: ExpenseBucket | null;
  source: 'manual' | 'csv';
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
export function summarise(records: Pick<BusinessRecord, 'description' | 'amount' | 'category' | 'expense_bucket'>[]) {
  let turnover = 0;
  const expenses = emptyExpenses();
  let unreviewed = 0;
  for (const r of records) {
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

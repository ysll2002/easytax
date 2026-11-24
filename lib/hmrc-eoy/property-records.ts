// Property Business (MTD) submissions built from the customer's digital
// records. HMRC's MTD rules (In-Year #6, and the production checklist: "the
// quarterly submission data is populated from the customer's digital record
// and no manual keying is permitted in the submission itself") apply to
// property income the same as self-employment, so these endpoints never take
// figures from the browser: the server adds up the records for the period and
// sends that. Corrections are made in the records.

import { propertyBucketOf, PROPERTY_INCOME_BUCKETS, type PropertyBucket, type IncomeSource, type RecordCategory } from '@/lib/records';

export type PropertyRecord = {
  id: string;
  amount: number;
  category: RecordCategory;
  property_bucket: PropertyBucket | null;
  property_id: string | null;
  income_source: IncomeSource;
};

/** How each records-built endpoint wants the figures laid out. */
export type RecordsShape =
  | 'uk-cumulative' | 'foreign-cumulative'
  | 'uk-period' | 'foreign-period'
  | 'historic-fhl' | 'historic-non-fhl';

// Endpoint (by HMRC path and method) → shape, income source, and whether the
// body carries fromDate/toDate (create) or not (amend).
export const RECORDS_ENDPOINTS: { method: string; path: string; shape: RecordsShape; source: 'uk-property' | 'foreign-property'; dates: boolean; files: boolean }[] = [
  { method: 'PUT',  path: '/individuals/business/property/uk/{nino}/{businessId}/cumulative/{taxYear}',                     shape: 'uk-cumulative',      source: 'uk-property',      dates: true,  files: true },
  { method: 'PUT',  path: '/individuals/business/property/foreign/{nino}/{businessId}/cumulative/{taxYear}',                shape: 'foreign-cumulative', source: 'foreign-property', dates: true,  files: true },
  { method: 'POST', path: '/individuals/business/property/uk/{nino}/{businessId}/period/{taxYear}',                         shape: 'uk-period',          source: 'uk-property',      dates: true,  files: true },
  { method: 'PUT',  path: '/individuals/business/property/uk/{nino}/{businessId}/period/{taxYear}/{submissionId}',          shape: 'uk-period',          source: 'uk-property',      dates: false, files: false },
  { method: 'POST', path: '/individuals/business/property/foreign/{nino}/{businessId}/period/{taxYear}',                    shape: 'foreign-period',     source: 'foreign-property', dates: true,  files: true },
  { method: 'PUT',  path: '/individuals/business/property/foreign/{nino}/{businessId}/period/{taxYear}/{submissionId}',     shape: 'foreign-period',     source: 'foreign-property', dates: false, files: false },
  { method: 'POST', path: '/individuals/business/property/uk/period/furnished-holiday-lettings/{nino}',                     shape: 'historic-fhl',       source: 'uk-property',      dates: true,  files: true },
  { method: 'PUT',  path: '/individuals/business/property/uk/period/furnished-holiday-lettings/{nino}/{periodId}',          shape: 'historic-fhl',       source: 'uk-property',      dates: false, files: false },
  { method: 'POST', path: '/individuals/business/property/uk/period/non-furnished-holiday-lettings/{nino}',                 shape: 'historic-non-fhl',   source: 'uk-property',      dates: true,  files: true },
  { method: 'PUT',  path: '/individuals/business/property/uk/period/non-furnished-holiday-lettings/{nino}/{periodId}',      shape: 'historic-non-fhl',   source: 'uk-property',      dates: true,  files: false },
];

export function recordsEndpoint(method: string, path: string) {
  return RECORDS_ENDPOINTS.find(r => r.method === method && r.path === path);
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const INCOME_KEYS = new Set(PROPERTY_INCOME_BUCKETS.map(b => b.key));

type Totals = { income: Partial<Record<PropertyBucket, number>>; expenses: Partial<Record<PropertyBucket, number>> };

function totals(records: PropertyRecord[]): Totals {
  const t: Totals = { income: {}, expenses: {} };
  for (const r of records) {
    if (r.category !== 'business_income' && r.category !== 'business_expense') continue;
    const b = propertyBucketOf(r);
    const amount = Number(r.amount);
    if (r.category === 'business_income') {
      const k = INCOME_KEYS.has(b) ? b : 'otherIncome';
      t.income[k] = round2((t.income[k] ?? 0) + amount);
    } else {
      const k = INCOME_KEYS.has(b) ? 'other' : b;
      t.expenses[k] = round2((t.expenses[k] ?? 0) - amount);
    }
  }
  return t;
}

/** Drop zero figures and empty objects: HMRC rejects an empty object in a body. */
function prune(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(prune).filter(x => x !== undefined);
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) {
      const p = prune(x);
      if (p !== undefined) out[k] = p;
    }
    return Object.keys(out).length ? out : undefined;
  }
  if (typeof v === 'number') return v === 0 ? undefined : v;
  return v;
}

// HMRC field names per shape. Income first, then expenses.
function ukIncome(t: Totals, withRentARoom = true) {
  return {
    periodAmount:         t.income.rent,
    premiumsOfLeaseGrant: t.income.premiumsOfLeaseGrant,
    reversePremiums:      t.income.reversePremiums,
    otherIncome:          t.income.otherIncome,
    ...(withRentARoom ? { rentARoom: { rentsReceived: t.income.rentARoom } } : {}),
  };
}
function ukExpenses(t: Totals, residential = true, premisesKey = 'premisesRunningCosts') {
  return {
    [premisesKey]:            t.expenses.premisesRunningCosts,
    repairsAndMaintenance:    t.expenses.repairsAndMaintenance,
    financialCosts:           t.expenses.financialCosts,
    professionalFees:         t.expenses.professionalFees,
    costOfServices:           t.expenses.costOfServices,
    travelCosts:              t.expenses.travelCosts,
    other:                    t.expenses.other,
    ...(residential ? { residentialFinancialCost: t.expenses.residentialFinancialCost } : {}),
  };
}
function fhlIncome(t: Totals) {
  // Furnished holiday lettings have rent (and Rent a Room) only.
  return { periodAmount: round2((t.income.rent ?? 0) + (t.income.otherIncome ?? 0) + (t.income.premiumsOfLeaseGrant ?? 0) + (t.income.reversePremiums ?? 0)), rentARoom: { rentsReceived: t.income.rentARoom } };
}
function foreignIncome(t: Totals) {
  return {
    rentIncome:           { rentAmount: round2((t.income.rent ?? 0) + (t.income.rentARoom ?? 0) + (t.income.reversePremiums ?? 0)) },
    premiumsOfLeaseGrant: t.income.premiumsOfLeaseGrant,
    otherPropertyIncome:  t.income.otherIncome,
    foreignTaxCreditRelief: false,
  };
}
function foreignExpenses(t: Totals, residential = true) {
  return {
    premisesRunningCosts:  t.expenses.premisesRunningCosts,
    repairsAndMaintenance: t.expenses.repairsAndMaintenance,
    financialCosts:        t.expenses.financialCosts,
    professionalFees:      t.expenses.professionalFees,
    travelCosts:           t.expenses.travelCosts,
    costOfServices:        t.expenses.costOfServices,
    other:                 t.expenses.other,
    ...(residential ? { residentialFinancialCost: t.expenses.residentialFinancialCost } : {}),
  };
}

/** Records grouped by the foreign property they belong to (propertyId from 2026-27, country code before). */
function byProperty(records: PropertyRecord[]): { key: string; records: PropertyRecord[] }[] {
  const m = new Map<string, PropertyRecord[]>();
  for (const r of records) {
    const k = r.property_id ?? '';
    m.set(k, [...(m.get(k) ?? []), r]);
  }
  return [...m.entries()].map(([key, records]) => ({ key, records }));
}

export type BuiltBody = { body: Record<string, unknown>; recordIds: string[]; problems: string[] };

/**
 * The request body for a records-built endpoint.
 *
 * `fhl` applies to UK and foreign period summaries before 2025-26, when
 * furnished holiday lettings were reported separately: the customer says the
 * records for this submission are furnished holiday lettings.
 */
export function buildFromRecords(
  shape: RecordsShape,
  records: PropertyRecord[],
  opts: { taxYear?: string; fromDate?: string; toDate?: string; dates: boolean; fhl?: boolean },
): BuiltBody {
  const counted = records.filter(r => r.category === 'business_income' || r.category === 'business_expense');
  const problems: string[] = [];
  if (counted.length === 0) problems.push('There are no property income or expense records for this period.');
  const dates = opts.dates ? { fromDate: opts.fromDate, toDate: opts.toDate } : {};
  const t = totals(counted);
  let body: unknown;

  switch (shape) {
    case 'uk-cumulative':
      body = { ...dates, ukProperty: { income: ukIncome(t), expenses: ukExpenses(t) } };
      break;
    case 'uk-period':
      body = opts.fhl
        ? { ...dates, ukFhlProperty: { income: fhlIncome(t), expenses: ukExpenses(t, false) } }
        : { ...dates, ukNonFhlProperty: { income: ukIncome(t), expenses: ukExpenses(t) } };
      break;
    case 'historic-fhl':
      body = { ...dates, income: fhlIncome(t), expenses: ukExpenses(t, false, opts.dates ? 'premisesRunningCosts' : 'premiseRunningCosts') };
      break;
    case 'historic-non-fhl':
      body = { ...dates, income: ukIncome(t), expenses: ukExpenses(t) };
      break;
    case 'foreign-cumulative': {
      // From 2026-27 each property is identified by the propertyId HMRC
      // issued for it; for 2025-26 by its country (ISO 3166 alpha-3).
      const usesPropertyId = (opts.taxYear ?? '') >= '2026-27';
      const groups = byProperty(counted);
      for (const g of groups) {
        const ok = usesPropertyId ? /^[0-9a-f-]{36}$/i.test(g.key) : /^[A-Z]{3}$/.test(g.key);
        if (!ok) problems.push(usesPropertyId
          ? `${g.records.length} foreign property record${g.records.length === 1 ? ' has' : 's have'} no HMRC property ID. Add the property in Foreign property details, then put its ID on the records.`
          : `${g.records.length} foreign property record${g.records.length === 1 ? ' has' : 's have'} no country code (for example FRA). Put the country code on the records.`);
      }
      body = {
        ...dates,
        foreignProperty: groups.map(g => {
          const gt = totals(g.records);
          return { [usesPropertyId ? 'propertyId' : 'countryCode']: g.key, income: foreignIncome(gt), expenses: foreignExpenses(gt) };
        }),
      };
      break;
    }
    case 'foreign-period': {
      if (opts.fhl) {
        body = { ...dates, foreignFhlEea: { income: { rentAmount: round2(Object.values(t.income).reduce((a, b) => a + (b ?? 0), 0)) }, expenses: foreignExpenses(t, false) } };
      } else {
        const groups = byProperty(counted);
        for (const g of groups) {
          if (!/^[A-Z]{3}$/.test(g.key)) problems.push(`${g.records.length} foreign property record${g.records.length === 1 ? ' has' : 's have'} no country code (for example FRA). Put the country code on the records.`);
        }
        body = {
          ...dates,
          foreignNonFhlProperty: groups.map(g => {
            const gt = totals(g.records);
            return { countryCode: g.key, income: foreignIncome(gt), expenses: foreignExpenses(gt) };
          }),
        };
      }
      break;
    }
  }

  const pruned = (prune(body) ?? {}) as Record<string, unknown>;
  // foreignTaxCreditRelief=false is required alongside rentIncome; prune
  // keeps booleans, so it survives.
  return { body: pruned, recordIds: counted.map(r => r.id), problems };
}

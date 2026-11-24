// Every endpoint of the HMRC APIs used for the end-of-year journey, property
// income and non-business income, generated from HMRC's own API specs by
// scripts/hmrc/build-eoy-catalog.py. No secrets or server-only imports here:
// the year-end workspace renders its forms from the same data.
//
// HMRC's testing requirements: for the APIs in the minimum functionality
// standards (Business Details, BSAS, Individual Calculations, Individual
// Losses, Individuals Tax Liability Adjustments, Obligations, Property
// Business, Self-Employment Business) every endpoint in the documentation has
// to be tested; for the others, the endpoints for the data the software
// supports. EasyTax supports all of them, so all of them are here.

import raw from './catalog.json';

export type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: (string | number | boolean)[];
  title?: string;
  description?: string;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  format?: string;
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
  minItems?: number;
  maxItems?: number;
  minLength?: number;
  maxLength?: number;
  multipleOf?: number;
  example?: unknown;
};

export type EndpointBody = { title: string; schema: JsonSchema; example: unknown };

export type Endpoint = {
  id: string;
  apiKey: string;
  api: string;
  version: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  scenarios: { value: string; desc: string }[];
  query: { name: string; required: boolean; enum: string[] | null; description: string }[];
  bodies: EndpointBody[];
};

export const ENDPOINTS = raw as Endpoint[];

const BY_ID = new Map(ENDPOINTS.map(e => [e.id, e]));
export function getEndpoint(id: string): Endpoint | undefined {
  return BY_ID.get(id);
}

/** Path parameters in a template, in order: "/a/{nino}/{taxYear}" → ["nino", "taxYear"]. */
export function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([A-Za-z]+)\}/g)].map(m => m[1]);
}

// What each path parameter may look like. Anything else is refused before it
// reaches HMRC, so a value typed into the workspace cannot change the path.
export const PARAM_PATTERNS: Record<string, RegExp> = {
  nino:            /^[A-Z]{2}\d{6}[A-D]$/,
  taxYear:         /^\d{4}-\d{2}$/,
  businessId:      /^[A-Z0-9]{15}$/i,
  calculationId:   /^[0-9a-f-]{8,36}$/i,
  calculationType: /^(in-year|intent-to-finalise|intent-to-amend|final-declaration|confirm-amendment)$/,
  employmentId:    /^[0-9a-f-]{8,36}$/i,
  benefitId:       /^[0-9a-f-]{8,36}$/i,
  submissionId:    /^[0-9a-f-]{8,36}$/i,
  periodId:        /^\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}$/,
  propId:          /^[0-9a-f-]{8,36}$/i,
  typeOfBusiness:  /^(self-employment|uk-property|foreign-property)$/,
};

export function buildPath(e: Endpoint, params: Record<string, string>): { path: string } | { error: string } {
  let path = e.path;
  for (const name of pathParams(e.path)) {
    const v = (params[name] ?? '').trim();
    const re = PARAM_PATTERNS[name];
    if (!v) return { error: `${name} is required.` };
    if (re ? !re.test(v) : !/^[A-Za-z0-9_-]{1,60}$/.test(v)) return { error: `${name} is not valid.` };
    path = path.replace(`{${name}}`, encodeURIComponent(v));
  }
  return { path };
}

/** "?a=1&b=2" from the endpoint's declared query parameters; anything else is dropped. */
export function buildQuery(e: Endpoint, query: Record<string, string> | undefined): { qs: string } | { error: string } {
  const parts: string[] = [];
  for (const q of e.query) {
    const v = (query?.[q.name] ?? '').trim();
    if (!v) {
      if (q.required) return { error: `${q.name} is required.` };
      continue;
    }
    if (q.enum ? !q.enum.includes(v) : !/^[A-Za-z0-9_-]{1,60}$/.test(v)) return { error: `${q.name} is not valid.` };
    parts.push(`${encodeURIComponent(q.name)}=${encodeURIComponent(v)}`);
  }
  return { qs: parts.length ? `?${parts.join('&')}` : '' };
}

/** The endpoint an outgoing call is, for the HMRC call log. */
export function matchEndpoint(method: string, maskedPath: string): Endpoint | undefined {
  const p = maskedPath.split('?')[0];
  // Longest template first, so ".../{id}/ignore" wins over ".../{id}".
  const candidates = ENDPOINTS.filter(e => e.method === method).sort((a, b) => b.path.length - a.path.length);
  for (const e of candidates) {
    const re = new RegExp('^' + e.path.replace(/\{nino\}/g, '\\{nino\\}').replace(/\{(?!nino\})[A-Za-z]+\}/g, '[^/]+') + '$');
    if (re.test(p)) return e;
  }
  return undefined;
}

// How the workspace groups the endpoints, in the order a customer works
// through the year end.
export type Section = { key: string; title: string; intro: string; match: (e: Endpoint) => boolean };

const isHistoricFhl = (e: Endpoint) => /furnished-holiday-lettings/.test(e.path);

export const SECTIONS: Section[] = [
  { key: 'business',  title: 'Business details',
    intro: 'Your businesses as HMRC holds them: quarterly period type, accounting type, periods of account and the late accounting date rule.',
    match: e => e.apiKey === 'business-details-api' },
  { key: 'uk-property', title: 'UK property',
    intro: 'UK property income: quarterly (cumulative) summaries, period summaries and the annual submission of allowances and adjustments.',
    match: e => e.apiKey === 'property-business-api' && /\/property\/uk\//.test(e.path) && !isHistoricFhl(e) },
  { key: 'foreign-property', title: 'Foreign property',
    intro: 'Foreign property income: property details, quarterly (cumulative) summaries, period summaries and the annual submission.',
    match: e => e.apiKey === 'property-business-api' && (/\/property\/foreign\//.test(e.path) || /\/property\/\{nino\}/.test(e.path)) },
  { key: 'historic-fhl', title: 'UK property before 2025-26',
    intro: 'Furnished holiday lettings and other UK property for tax years up to 2024-25, when they were reported separately.',
    match: e => e.apiKey === 'property-business-api' && isHistoricFhl(e) },
  { key: 'bsas', title: 'Accounting adjustments (BSAS)',
    intro: 'Trigger a summary of each business for the accounting period, check it and make accounting adjustments.',
    match: e => e.apiKey === 'self-assessment-bsas-api' },
  { key: 'biss', title: 'Business income summary (BISS)',
    intro: 'The year\'s totals HMRC holds for one business.',
    match: e => e.apiKey === 'self-assessment-biss-api' },
  { key: 'losses', title: 'Losses and claims',
    intro: 'Losses brought forward from earlier years and how this year\'s losses are used: carried back, sideways or forward.',
    match: e => e.apiKey === 'individual-losses-api' },
  { key: 'employment', title: 'Employment income',
    intro: 'Employments HMRC knows about from PAYE, employments you add, their pay and tax, non-PAYE income and other employment income.',
    match: e => e.apiKey === 'individuals-employments-income-api' },
  { key: 'expenses', title: 'Employment and other expenses',
    intro: 'Expenses you claim against employment income, and other expenses such as payments to trade unions.',
    match: e => e.apiKey === 'individuals-expenses-api' },
  { key: 'pensions', title: 'Pension income',
    intro: 'Foreign pensions and overseas pension contributions.',
    match: e => e.apiKey === 'individuals-pensions-income-api' },
  { key: 'benefits', title: 'State benefits',
    intro: 'Taxable state benefits HMRC holds for you, and ones you add.',
    match: e => e.apiKey === 'individuals-state-benefits-api' },
  { key: 'charges', title: 'Charges',
    intro: 'Pension charges, the High Income Child Benefit Charge and the Winter Fuel Payment charge.',
    match: e => e.apiKey === 'individuals-charges-api' },
  { key: 'liability', title: 'Tax liability adjustments',
    intro: 'Adjustments to the year\'s tax liability, for example from carrying back this year\'s losses. Submit carry-back losses before the final declaration.',
    match: e => e.apiKey === 'individuals-tax-liability-adjustments-api' },
  { key: 'calculations', title: 'Tax calculations',
    intro: 'List, trigger and retrieve tax calculations. The final declaration and amendments are made from the guided steps.',
    match: e => e.apiKey === 'individual-calculations-api' },
];

/** Section per endpoint. Every endpoint belongs to exactly one section. */
export function sectionOf(e: Endpoint): Section | undefined {
  return SECTIONS.find(s => s.match(e));
}

// The two calculation types that file something with HMRC. They are only
// sent from the guided declaration, after the declaration has been agreed.
export const FILING_CALCULATION_TYPES = ['final-declaration', 'confirm-amendment'] as const;

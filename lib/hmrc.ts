import { cookies, headers } from 'next/headers';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { auth } from '@/auth';

import { HMRC_API_BASE as BASE } from '@/lib/hmrc-env';

// Cache server outbound IP for 10 minutes to avoid fetching on every request
let cachedVendorIp = { ip: '', expiresAt: 0 };
async function getVendorPublicIp(): Promise<string> {
  if (process.env.SERVER_PUBLIC_IP) return process.env.SERVER_PUBLIC_IP;
  if (Date.now() < cachedVendorIp.expiresAt) return cachedVendorIp.ip;
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2000) });
    const { ip } = await res.json();
    cachedVendorIp = { ip: ip ?? '', expiresAt: Date.now() + 10 * 60 * 1000 };
    return cachedVendorIp.ip;
  } catch {
    return '';
  }
}

// ─── Token management ────────────────────────────────────────────────────────

async function refreshToken(userId: string, refreshToken: string) {
  const res = await fetch(`${BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     process.env.HMRC_CLIENT_ID!,
      client_secret: process.env.HMRC_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error('HMRC token refresh failed');
  const data = await res.json();
  const expires = new Date(Date.now() + data.expires_in * 1000).toISOString();
  await supabase.from('hmrc_connections').update({
    access_token:     data.access_token,
    refresh_token:    data.refresh_token ?? refreshToken,
    token_expires_at: expires,
  }).eq('user_id', userId);
  return data.access_token as string;
}

export async function getValidToken(userId: string): Promise<string> {
  const { data } = await supabase
    .from('hmrc_connections')
    .select('access_token, refresh_token, token_expires_at')
    .eq('user_id', userId)
    .single();

  if (!data) throw new Error('No HMRC connection found');

  const expiresAt = data.token_expires_at ? new Date(data.token_expires_at) : null;
  const needsRefresh = !expiresAt || expiresAt.getTime() - Date.now() < 5 * 60 * 1000;

  if (needsRefresh && data.refresh_token) {
    return refreshToken(userId, data.refresh_token);
  }
  return data.access_token;
}

// ─── Fraud prevention headers ────────────────────────────────────────────────

export async function fraudHeaders(): Promise<Record<string, string>> {
  let deviceData: Record<string, string> = {};

  // Primary source: X-EasyTax-Device-Data request header set by the browser's
  // hmrcFetch wrapper. This avoids the earlier cookie-write race — the client
  // awaits collection before firing the request, so the header is always in
  // sync with what the browser collected.
  try {
    const h = await headers();
    const headerRaw = h.get('x-easytax-device-data');
    if (headerRaw) deviceData = JSON.parse(decodeURIComponent(headerRaw));
  } catch { /* ignore */ }

  // Fallback: legacy hmrc_device cookie, still written by device-data-client as
  // a safety net for any server route hit without the header (e.g. direct curl).
  if (Object.keys(deviceData).length === 0) {
    try {
      const jar = await cookies();
      const raw = jar.get('hmrc_device')?.value;
      if (raw) deviceData = JSON.parse(decodeURIComponent(raw));
    } catch { /* ignore */ }
  }

  // userId comes from the authoritative server-side session — the client never
  // needs to pass it (and historically the cookie's userId was often empty
  // because next-auth hadn't hydrated yet when the collector ran).
  if (!deviceData.userId) {
    const session = await auth();
    if (session?.user?.profileId) deviceData.userId = session.user.profileId;
  }

  const vendorIp = await getVendorPublicIp();
  const clientIp = deviceData.ip ?? '';

  // Gov-Client-Multi-Factor is intentionally omitted. Per HMRC fraud-prevention
  // spec (Send fraud prevention data v3.3, getting-it-right#missing-header-data),
  // MFA is defined as authentication into *our software*. EasyTax has no in-app
  // MFA — the user's HMRC Government Gateway MFA happens during OAuth grant,
  // which HMRC explicitly places out of scope for this header. Sending a
  // placeholder type=OTHER trips the validator's POTENTIALLY_INVALID_HEADER
  // warning, so we omit the header entirely (HMRC ticket 2026-NQM717).
  //
  // Gov-Vendor-License-IDs is also intentionally omitted. EasyTax does not
  // issue per-user licences (free to all), so any value we send would be a
  // dummy/hash and HMRC's FPH review explicitly flagged that as prohibited.
  //
  // That parenthesis is load-bearing and it is what we told HMRC. The product
  // was charged at £20+VAT per submission between 2026-08-25 and 2026-10-14,
  // during which this comment was simply wrong; it is free again now, which is
  // what the FPH submission says. HMRC's reply asked to be told "as soon as
  // possible" if the licensing position changes, so if a charge is ever
  // reintroduced this header has to be revisited AND SDST notified — see
  // lib/pricing.ts, which is the source of truth for what the product costs.

  const raw: Record<string, string> = {
    'Gov-Client-Connection-Method':     'WEB_APP_VIA_SERVER',
    'Gov-Client-Browser-JS-User-Agent': deviceData.userAgent ?? '',
    'Gov-Client-Device-ID':             deviceData.deviceId  ?? '',
    'Gov-Client-Screens':               deviceData.screens   ?? '',
    'Gov-Client-Timezone':              deviceData.timezone  ?? '',
    'Gov-Client-Window-Size':           deviceData.window    ?? '',
    'Gov-Client-Public-IP':             clientIp,
    'Gov-Client-Public-IP-Timestamp':   deviceData.ipTs      ?? '',
    'Gov-Client-Public-Port':           deviceData.port      ?? '',
    'Gov-Client-User-IDs':              deviceData.userId ? `easytax=${deviceData.userId}` : '',
    'Gov-Vendor-Product-Name':          'EasyTax',
    'Gov-Vendor-Version':               'easytax=0.1.0',
    'Gov-Vendor-Public-IP':             vendorIp,
    'Gov-Vendor-Forwarded':             clientIp && vendorIp ? `by=${vendorIp}&for=${clientIp}` : '',
  };

  // HMRC's FPH review flagged empty-string headers as invalid — omit any
  // whose value we couldn't fill so the request just doesn't advertise them.
  return Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== ''));
}

async function hmrcFetch(path: string, token: string, opts: RequestInit = {}) {
  const fh = await fraudHeaders();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept:        'application/vnd.hmrc.2.0+json',
      'Content-Type': 'application/json',
      ...fh,
      ...(opts.headers as Record<string, string> ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    // HMRC's own code, passed through unchanged. This used to be re-labelled
    // `NINO_MISMATCH`, and the UI told the user their NINO and their
    // Government Gateway account belonged to different people — a specific
    // diagnosis HMRC never gave us.
    //
    // CLIENT_OR_AGENT_NOT_AUTHORISED means only "not authorised for this
    // record". A wrong NINO is one cause and not the common one. The usual
    // cause is that the taxpayer is not signed up for MTD for Income Tax at
    // all: an HMRC account and a National Insurance number are not the same
    // thing as an MTD enrolment, and the sandbox never showed this because its
    // test users are pre-enrolled. Others are a sign-up HMRC is still
    // processing (up to 72 hours) and an income source not registered for MTD.
    //
    // Asserting one of four causes sent the first real user who hit this to
    // re-enter a NINO that was correct all along. The UI now lists them.
    if (res.status === 403 && body.includes('CLIENT_OR_AGENT_NOT_AUTHORISED')) {
      throw new Error('CLIENT_OR_AGENT_NOT_AUTHORISED');
    }
    throw new Error(`HMRC ${res.status}: ${body}`);
  }
  // Most HMRC create/amend PUTs answer 204 No Content. `res.json()` throws on
  // an empty body, which turned a submission HMRC had accepted into a 502 for
  // the user — and, because the adjustments route submits sequentially, also
  // skipped every submission after it.
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─── Business Details ─────────────────────────────────────────────────────────

export async function getBusinessDetails(nino: string, token: string) {
  const data = await hmrcFetch(
    `/individuals/business/details/${nino}/list`,
    token,
    { headers: { Accept: 'application/vnd.hmrc.2.0+json' } },
  );
  return data.listOfBusinesses as {
    typeOfBusiness: string;
    businessId: string;
    tradingName?: string;
    accountingPeriods?: { start: string; end: string }[];
  }[];
}

// ─── Obligations ──────────────────────────────────────────────────────────────

export type Obligation = {
  periodKey:       string;
  periodStartDate: string;
  periodEndDate:   string;
  dueDate:         string;
  receivedDate?:   string;
  status:          'Open' | 'Fulfilled';
};

export async function getObligations(nino: string, token: string): Promise<Obligation[]> {
  const data = await hmrcFetch(
    `/obligations/details/${nino}/income-and-expenditure?typeOfBusiness=self-employment`,
    token,
    { headers: { Accept: 'application/vnd.hmrc.3.0+json' } },
  );
  const allObs = data.obligations?.flatMap(
    (o: { obligationDetails: Obligation[] }) => o.obligationDetails,
  ) ?? [];
  return allObs;
}

// ─── Quarterly Update ─────────────────────────────────────────────────────────

export type QuarterlyData = {
  periodStartDate: string;
  periodEndDate:   string;
  turnover:        number;
  other?:          number;
  expenses: {
    costOfGoods?:           number;
    staffCosts?:            number;
    travelCosts?:           number;
    premisesRunningCosts?:  number;
    adminCosts?:            number;
    advertisingCosts?:      number;
    professionalFees?:      number;
    otherExpenses?:         number;
  };
};

export async function submitQuarterlyUpdate(
  nino: string,
  businessId: string,
  data: QuarterlyData,
  token: string,
) {
  return hmrcFetch(
    `/individuals/business/self-employment/${nino}/${businessId}/period`,
    token,
    {
      method: 'POST',
      headers: { Accept: 'application/vnd.hmrc.5.0+json' },
      // Self-Employment Business (MTD) v5.0: expense values are plain numbers
      // (not { amount } objects), and field names differ from the older shape.
      body: JSON.stringify({
        periodDates: {
          periodStartDate: data.periodStartDate,
          periodEndDate:   data.periodEndDate,
        },
        periodIncome: {
          turnover: data.turnover,
          other:    data.other ?? 0,
        },
        periodExpenses: {
          costOfGoods:          data.expenses.costOfGoods          ?? 0,
          wagesAndStaffCosts:   data.expenses.staffCosts           ?? 0,
          carVanTravelExpenses: data.expenses.travelCosts          ?? 0,
          premisesRunningCosts: data.expenses.premisesRunningCosts ?? 0,
          adminCosts:           data.expenses.adminCosts           ?? 0,
          advertisingCosts:     data.expenses.advertisingCosts     ?? 0,
          professionalFees:     data.expenses.professionalFees     ?? 0,
          otherExpenses:        data.expenses.otherExpenses        ?? 0,
        },
      }),
    },
  );
}

// ─── Tax Calculation ──────────────────────────────────────────────────────────

export type CalculationType = 'in-year' | 'intent-to-finalise' | 'intent-to-amend';

export async function triggerCalculation(
  nino: string,
  taxYear: string,
  token: string,
  calculationType: CalculationType = 'in-year',
) {
  return hmrcFetch(
    `/individuals/calculations/${nino}/self-assessment/${taxYear}/trigger/${calculationType}`,
    token,
    { method: 'POST', headers: { Accept: 'application/vnd.hmrc.8.0+json' } },
  );
}

export async function getCalculation(
  nino: string,
  taxYear: string,
  calculationId: string,
  token: string,
) {
  return hmrcFetch(
    `/individuals/calculations/${nino}/self-assessment/${taxYear}/${calculationId}`,
    token,
    { headers: { Accept: 'application/vnd.hmrc.8.0+json' } },
  );
}

// ─── Final Declaration ────────────────────────────────────────────────────────

// In Individual Calculations API v8.0, the final declaration *is* a calculation
// triggered with calculationType=intent-to-finalise. There is no separate
// confirm endpoint — the trigger itself locks in the figures for the year.
export async function submitFinalDeclaration(nino: string, taxYear: string, token: string) {
  return triggerCalculation(nino, taxYear, token, 'intent-to-finalise');
}

// ─── Annual Adjustments ───────────────────────────────────────────────────────

export type AnnualAdjustments = {
  overlapReliefUsed?:        number;
  accountingAdjustment?:     number;
  outstandingBusinessIncome?: number;
  balancingCharge?:          number;
  goodsAndServicesOwnUse?:   number;
};

export async function submitAnnualAdjustments(
  nino: string,
  businessId: string,
  taxYear: string,
  data: AnnualAdjustments,
  token: string,
) {
  // Self-Employment Business (MTD) v5.0 expects adjustments nested under
  // an `adjustments` key, not flat at the top level.
  return hmrcFetch(
    `/individuals/business/self-employment/${nino}/${businessId}/annual/${taxYear}`,
    token,
    {
      method:  'PUT',
      headers: { Accept: 'application/vnd.hmrc.5.0+json' },
      body:    JSON.stringify({ adjustments: data }),
    },
  );
}

// ─── UK Savings Interest — Individuals Savings Income (MTD) v2.0 ─────────────
//
// This used to PUT a list of accounts to /individuals/income-received/savings/,
// the path of the old consolidated "Individuals Income Received" API that HMRC
// has since split up. It is not part of any API we are subscribed to. The
// current API is account-based: a UK savings account is registered once and
// gets an HMRC savingsAccountId, and interest is then submitted per account per
// tax year. The sandbox harness (app/api/hmrc/sandbox-test) exercised exactly
// these three endpoints, which is the testing HMRC approved us on.

const SAVINGS_ACCEPT = { Accept: 'application/vnd.hmrc.2.0+json' };

export type SavingsIncome = {
  accountName: string;
  // Interest paid gross, which is how UK banks have paid it since April 2016.
  untaxedInterest?: number;
  // Interest paid with tax already deducted (rare now; some older bonds).
  taxedInterest?: number;
};

async function listUkSavingsAccounts(nino: string, token: string) {
  try {
    const data = await hmrcFetch(`/individuals/savings-income/uk-accounts/${nino}`, token, { headers: SAVINGS_ACCEPT });
    return (data?.savingsAccounts ?? []) as { savingsAccountId: string; accountName: string }[];
  } catch (err) {
    // HMRC answers 404 when the customer has no UK savings accounts yet.
    if (err instanceof Error && err.message.startsWith('HMRC 404')) return [];
    throw err;
  }
}

// Reuse the account if one with this name is already registered: adding a
// second one with the same name is rejected, and registering a fresh account
// on every submission would litter the customer's HMRC record.
async function ensureUkSavingsAccount(nino: string, accountName: string, token: string) {
  const existing = (await listUkSavingsAccounts(nino, token))
    .find(a => a.accountName.trim().toLowerCase() === accountName.trim().toLowerCase());
  if (existing) return existing.savingsAccountId;

  const created = await hmrcFetch(`/individuals/savings-income/uk-accounts/${nino}`, token, {
    method:  'POST',
    headers: SAVINGS_ACCEPT,
    body:    JSON.stringify({ accountName }),
  });
  if (!created?.savingsAccountId) throw new Error('HMRC did not return a savingsAccountId');
  return created.savingsAccountId as string;
}

export async function submitSavingsIncome(nino: string, taxYear: string, accounts: SavingsIncome[], token: string) {
  const results = [];
  for (const acc of accounts) {
    const savingsAccountId = await ensureUkSavingsAccount(nino, acc.accountName, token);
    const body: Record<string, number> = {};
    if (acc.untaxedInterest !== undefined) body.untaxedUkInterest = acc.untaxedInterest;
    if (acc.taxedInterest   !== undefined) body.taxedUkInterest   = acc.taxedInterest;
    await hmrcFetch(`/individuals/savings-income/uk-accounts/${nino}/${taxYear}/${savingsAccountId}`, token, {
      method:  'PUT',
      headers: SAVINGS_ACCEPT,
      body:    JSON.stringify(body),
    });
    results.push({ accountName: acc.accountName, savingsAccountId });
  }
  return results;
}

export type ForeignDividendEntry = {
  countryCode:             string; // ISO 3166-1 alpha-3, e.g. "USA", "FRA"
  amountBeforeTax:         number;
  taxTakenOff?:            number;
  foreignTaxCreditRelief?: boolean;
  taxableAmount:           number;
};

export type DividendsIncomePayload = {
  foreignDividend?: ForeignDividendEntry[];
  stockDividend?:   { customerReference?: string; grossAmount: number };
};

export async function submitDividendsIncome(
  nino: string,
  taxYear: string,
  data: DividendsIncomePayload,
  token: string,
) {
  return hmrcFetch(
    `/individuals/dividends-income/${nino}/${taxYear}`,
    token,
    {
      method:  'PUT',
      headers: { Accept: 'application/vnd.hmrc.2.0+json' },
      body:    JSON.stringify(data),
    },
  );
}

export async function submitCharitableGiving(
  nino: string,
  taxYear: string,
  data: { giftAidPayments?: { totalAmount?: number; oneOffAmount?: number } },
  token: string,
) {
  // Individuals Reliefs (MTD) v3.0. This call used to send no Accept header and
  // so inherited hmrcFetch's v2.0 default — and Reliefs v2 retired on
  // 16 October 2026. (The `gifts.totalAmount` field the type used to allow is
  // not in HMRC's schema; `gifts` takes landAndBuildings / sharesOrSecurities /
  // nonUkCharities, none of which the UI collects.)
  return hmrcFetch(
    `/individuals/reliefs/charitable-giving/${nino}/${taxYear}`,
    token,
    {
      method:  'PUT',
      headers: { Accept: 'application/vnd.hmrc.3.0+json' },
      body:    JSON.stringify(data),
    },
  );
}

// ─── VAT MTD ──────────────────────────────────────────────────────────────────

export type VatObligation = {
  periodKey:   string;
  start:       string;
  end:         string;
  due:         string;
  received?:   string;
  status:      'O' | 'F';
};

export async function getVatObligations(vrn: string, token: string): Promise<VatObligation[]> {
  const from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const to   = new Date().toISOString().slice(0, 10);
  const data = await hmrcFetch(
    `/organisations/vat/${vrn}/obligations?from=${from}&to=${to}`,
    token,
    { headers: { Accept: 'application/vnd.hmrc.1.0+json' } },
  );
  return (data.obligations ?? []).map((o: {
    periodKey: string; start: string; end: string;
    due: string; received?: string; status: 'O' | 'F';
  }) => ({
    periodKey: o.periodKey,
    start:     o.start,
    end:       o.end,
    due:       o.due,
    received:  o.received,
    status:    o.status,
  }));
}

export type VatReturnPayload = {
  periodKey:                    string;
  vatDueSales:                  number;
  vatDueAcquisitions:           number;
  totalVatDue:                  number;
  vatReclaimedCurrPeriod:       number;
  netVatDue:                    number;
  totalValueSalesExVAT:         number;
  totalValuePurchasesExVAT:     number;
  totalValueGoodsSuppliedExVAT: number;
  totalAcquisitionsExVAT:       number;
  finalised:                    boolean;
};

export async function submitVatReturn(vrn: string, payload: VatReturnPayload, token: string) {
  return hmrcFetch(
    `/organisations/vat/${vrn}/returns`,
    token,
    {
      method:  'POST',
      body:    JSON.stringify(payload),
      headers: { Accept: 'application/vnd.hmrc.1.0+json' },
    },
  );
}

export async function getVatReturn(vrn: string, periodKey: string, token: string) {
  return hmrcFetch(
    `/organisations/vat/${vrn}/returns/${periodKey}`,
    token,
    { headers: { Accept: 'application/vnd.hmrc.1.0+json' } },
  );
}

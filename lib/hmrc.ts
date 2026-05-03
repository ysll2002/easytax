import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

const BASE = process.env.HMRC_ENV === 'production'
  ? 'https://api.service.hmrc.gov.uk'
  : 'https://test-api.service.hmrc.gov.uk';

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

async function fraudHeaders(): Promise<Record<string, string>> {
  const jar = await cookies();
  let deviceData: Record<string, string> = {};
  try {
    const raw = jar.get('hmrc_device')?.value;
    if (raw) deviceData = JSON.parse(raw);
  } catch { /* ignore */ }

  return {
    'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
    'Gov-Client-Browser-JS-User-Agent': deviceData.userAgent ?? '',
    'Gov-Client-Device-ID':            deviceData.deviceId  ?? '',
    'Gov-Client-Screens':              deviceData.screens   ?? '',
    'Gov-Client-Timezone':             deviceData.timezone  ?? 'UTC+00:00',
    'Gov-Client-Window-Size':          deviceData.window    ?? '',
    'Gov-Client-Public-IP':            deviceData.ip        ?? '',
    'Gov-Client-Public-IP-Timestamp':  deviceData.ipTs      ?? new Date().toISOString(),
    'Gov-Client-User-IDs':             deviceData.userId ? `easytax=${deviceData.userId}` : '',
    'Gov-Vendor-Product-Name':         'EasyTax',
    'Gov-Vendor-Version':              'easytax=0.1.0',
    'Gov-Vendor-Public-IP':            process.env.SERVER_PUBLIC_IP ?? '',
    'Gov-Vendor-License-IDs':          '',
  };
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
    throw new Error(`HMRC ${res.status}: ${body}`);
  }
  return res.json();
}

// ─── Business Details ─────────────────────────────────────────────────────────

export async function getBusinessDetails(nino: string, token: string) {
  const data = await hmrcFetch(
    `/individuals/business/details/${nino}/list`,
    token,
    { headers: { Accept: 'application/vnd.hmrc.3.0+json' } },
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
  taxYear: string,
  data: QuarterlyData,
  token: string,
) {
  return hmrcFetch(
    `/individuals/business/self-employment/${nino}/${businessId}/period-summaries?taxYear=${taxYear}`,
    token,
    {
      method: 'PUT',
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
          costOfGoods:           { amount: data.expenses.costOfGoods          ?? 0 },
          staffCosts:            { amount: data.expenses.staffCosts           ?? 0 },
          travelCosts:           { amount: data.expenses.travelCosts          ?? 0 },
          premisesRunningCosts:  { amount: data.expenses.premisesRunningCosts ?? 0 },
          adminCosts:            { amount: data.expenses.adminCosts           ?? 0 },
          advertisingCosts:      { amount: data.expenses.advertisingCosts     ?? 0 },
          professionalFees:      { amount: data.expenses.professionalFees     ?? 0 },
          other:                 { amount: data.expenses.otherExpenses        ?? 0 },
        },
      }),
    },
  );
}

// ─── Tax Calculation ──────────────────────────────────────────────────────────

export async function triggerCalculation(nino: string, taxYear: string, token: string) {
  return hmrcFetch(
    `/individuals/calculations/${nino}/self-assessment/${taxYear}`,
    token,
    { method: 'POST', body: JSON.stringify({ finalDeclaration: false }) },
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

export async function submitFinalDeclaration(nino: string, taxYear: string, token: string) {
  return hmrcFetch(
    `/individuals/self-assessment/${nino}/${taxYear}/final-declaration`,
    token,
    { method: 'POST', body: '{}' },
  );
}

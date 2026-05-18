import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getValidToken } from '@/lib/hmrc';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';

const SANDBOX = 'https://test-api.service.hmrc.gov.uk';

type ApiResult = {
  name: string;
  endpoint: string;
  method: string;
  status: number | null;
  ok: boolean;
  data?: unknown;
  error?: string;
};

async function getVendorIp(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2000) });
    const { ip } = await res.json();
    return ip ?? '';
  } catch { return ''; }
}

async function buildFphHeaders(deviceData: Record<string, string>, vendorIp: string): Promise<Record<string, string>> {
  const clientIp = deviceData.ip ?? '';
  return {
    'Gov-Client-Connection-Method':     'WEB_APP_VIA_SERVER',
    'Gov-Client-Browser-JS-User-Agent': deviceData.userAgent ?? '',
    'Gov-Client-Device-ID':             deviceData.deviceId  ?? '',
    'Gov-Client-Screens':               deviceData.screens   ?? '',
    'Gov-Client-Timezone':              deviceData.timezone  ?? 'UTC+00:00',
    'Gov-Client-Window-Size':           deviceData.window    ?? '',
    'Gov-Client-Public-IP':             clientIp,
    'Gov-Client-Public-IP-Timestamp':   deviceData.ipTs ?? new Date().toISOString(),
    'Gov-Client-Public-Port':           deviceData.port ?? '',
    'Gov-Client-User-IDs':              deviceData.userId ? `easytax=${deviceData.userId}` : '',
    'Gov-Vendor-Product-Name':          'EasyTax',
    'Gov-Vendor-Version':               'easytax=0.1.0',
    'Gov-Vendor-Public-IP':             vendorIp,
    'Gov-Vendor-Forwarded':             clientIp && vendorIp ? `by=${vendorIp}&for=${clientIp}` : '',
    'Gov-Vendor-License-IDs':           deviceData.userId
      ? `easytax=${createHash('sha256').update(deviceData.userId).digest('hex')}`
      : '',
  };
}

async function call(
  results: ApiResult[],
  name: string,
  endpoint: string,
  method: string,
  token: string,
  fph: Record<string, string>,
  opts: { accept?: string; body?: unknown } = {},
): Promise<unknown> {
  const entry: ApiResult = { name, endpoint, method, status: null, ok: false };
  results.push(entry);
  try {
    const res = await fetch(`${SANDBOX}${endpoint}`, {
      method,
      headers: {
        Authorization:  `Bearer ${token}`,
        Accept:         opts.accept ?? 'application/vnd.hmrc.2.0+json',
        'Content-Type': 'application/json',
        ...fph,
      },
      ...(opts.body != null ? { body: JSON.stringify(opts.body) } : {}),
    });
    entry.status = res.status;
    entry.ok     = res.ok || res.status === 204;
    try { entry.data = await res.json(); } catch { entry.data = null; }
    return entry.data;
  } catch (err) {
    entry.error = err instanceof Error ? err.message : String(err);
    return null;
  }
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = session.user.profileId;

  let token: string;
  try { token = await getValidToken(profileId); }
  catch (err) {
    return NextResponse.json({ error: 'No HMRC connection — connect your HMRC account first.' }, { status: 400 });
  }

  const { data: conn } = await supabase
    .from('hmrc_connections')
    .select('nino, vrn, business_id')
    .eq('user_id', profileId)
    .single();

  const nino       = conn?.nino       ?? 'GW460330D';
  const vrn        = conn?.vrn        ?? '999999999';
  const businessId = conn?.business_id ?? 'XAIS12345678910';
  const taxYear    = '2025-26';
  const PERIOD_START = '2025-04-06';
  const PERIOD_END   = '2025-07-05';

  const jar = await cookies();
  let deviceData: Record<string, string> = {};
  try {
    const raw = jar.get('hmrc_device')?.value;
    if (raw) deviceData = JSON.parse(decodeURIComponent(raw));
  } catch { /* ignore */ }

  const vendorIp = await getVendorIp();
  const fph = await buildFphHeaders(deviceData, vendorIp);

  const results: ApiResult[] = [];

  // ── 1. Hello World (user-restricted) ────────────────────────────────────────
  await call(results, 'Hello World', '/hello/user', 'GET', token, fph, { accept: 'application/vnd.hmrc.1.0+json' });

  // ── 2. Fraud Prevention Headers validation ───────────────────────────────────
  await call(results, 'FPH Validate', '/test/fraud-prevention-headers/validate', 'GET', token, fph, { accept: 'application/vnd.hmrc.1.0+json' });

  // ── 3. Business Details ──────────────────────────────────────────────────────
  const bizData = await call(results, 'Business Details – List', `/individuals/business/details/${nino}/list`, 'GET', token, fph, { accept: 'application/vnd.hmrc.2.0+json' });

  // Use businessId from API if available, otherwise fall back
  let resolvedBusinessId = businessId;
  try {
    const businesses = (bizData as { listOfBusinesses?: { typeOfBusiness: string; businessId: string }[] })?.listOfBusinesses ?? [];
    const se = businesses.find(b => b.typeOfBusiness === 'self-employment');
    if (se) resolvedBusinessId = se.businessId;
  } catch { /* keep fallback */ }

  // ── 4. Individuals Obligations ───────────────────────────────────────────────
  await call(results, 'Obligations – Income & Expenditure', `/obligations/details/${nino}/income-and-expenditure?typeOfBusiness=self-employment`, 'GET', token, fph, { accept: 'application/vnd.hmrc.3.0+json' });

  // ── 5. Period Summaries – Quarterly Update (PUT) ─────────────────────────────
  await call(
    results,
    'Period Summaries – Quarterly Update',
    `/individuals/business/self-employment/${nino}/${resolvedBusinessId}/period-summaries?taxYear=${taxYear}`,
    'PUT',
    token,
    fph,
    {
      accept: 'application/vnd.hmrc.5.0+json',
      body: {
        periodDates: { periodStartDate: PERIOD_START, periodEndDate: PERIOD_END },
        periodIncome: { turnover: 5000, other: 0 },
        periodExpenses: {
          costOfGoods:          { amount: 200 },
          staffCosts:           { amount: 100 },
          travelCosts:          { amount: 50 },
          premisesRunningCosts: { amount: 300 },
          adminCosts:           { amount: 80 },
          advertisingCosts:     { amount: 120 },
          professionalFees:     { amount: 250 },
          other:                { amount: 150 },
        },
      },
    },
  );

  // ── 6. Annual Adjustments (PUT) ──────────────────────────────────────────────
  await call(
    results,
    'Annual Adjustments',
    `/individuals/self-assessment/adjustments/${nino}/${resolvedBusinessId}/${taxYear}`,
    'PUT',
    token,
    fph,
    { body: { overlapReliefUsed: 100, accountingAdjustment: 50 } },
  );

  // ── 7. Tax Calculation – Trigger ─────────────────────────────────────────────
  const calcTrigger = await call(
    results,
    'Calculation – Trigger',
    `/individuals/calculations/${nino}/self-assessment/${taxYear}`,
    'POST',
    token,
    fph,
    { accept: 'application/vnd.hmrc.8.0+json', body: { finalDeclaration: false } },
  );

  // ── 8. Tax Calculation – Retrieve ────────────────────────────────────────────
  const calculationId = (calcTrigger as { calculationId?: string })?.calculationId;
  if (calculationId) {
    await call(
      results,
      'Calculation – Retrieve',
      `/individuals/calculations/${nino}/self-assessment/${taxYear}/${calculationId}`,
      'GET',
      token,
      fph,
      { accept: 'application/vnd.hmrc.8.0+json' },
    );
  } else {
    results.push({ name: 'Calculation – Retrieve', endpoint: '(skipped — no calculationId from trigger)', method: 'GET', status: null, ok: false, error: 'Skipped: no calculationId returned' });
  }

  // ── 9. Savings Income (PUT) ──────────────────────────────────────────────────
  await call(
    results,
    'Income Received – Savings',
    `/individuals/income-received/savings/${nino}/${taxYear}`,
    'PUT',
    token,
    fph,
    { body: { savingsAccounts: [{ accountName: 'Test Savings Account', grossInterest: 150 }] } },
  );

  // ── 10. Dividends Income (PUT) ───────────────────────────────────────────────
  await call(
    results,
    'Income Received – Dividends',
    `/individuals/income-received/dividends/${nino}/${taxYear}`,
    'PUT',
    token,
    fph,
    { body: { ukDividends: 300, otherUkDividends: 50 } },
  );

  // ── 11. Charitable Giving / Reliefs (PUT) ────────────────────────────────────
  await call(
    results,
    'Reliefs – Charitable Giving',
    `/individuals/reliefs/charitable-giving/${nino}/${taxYear}`,
    'PUT',
    token,
    fph,
    { body: { giftAidPayments: { totalAmount: 100 }, gifts: { totalAmount: 20 } } },
  );

  // ── 12. Individuals Charges (PUT) ────────────────────────────────────────────
  await call(
    results,
    'Individuals Charges – Pension Schemes',
    `/individuals/charges/pensions/${nino}/${taxYear}`,
    'PUT',
    token,
    fph,
    { body: { pensionSchemeTaxReference: ['00123456RA'], lumpSumBenefitTaken: { amount: 500 } } },
  );

  // ── 13. Business Source Adjustable Summary (GET) ─────────────────────────────
  await call(
    results,
    'Business Source Adjustable Summary',
    `/individuals/self-assessment/adjustable-summary/${nino}/${taxYear}?businessId=${resolvedBusinessId}`,
    'GET',
    token,
    fph,
    { accept: 'application/vnd.hmrc.7.0+json' },
  );

  // ── 14. VAT – Obligations ────────────────────────────────────────────────────
  const fromDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const toDate   = new Date().toISOString().slice(0, 10);
  const vatOblData = await call(
    results,
    'VAT – Obligations',
    `/organisations/vat/${vrn}/obligations?from=${fromDate}&to=${toDate}`,
    'GET',
    token,
    fph,
    { accept: 'application/vnd.hmrc.1.0+json' },
  );

  // Get an open VAT period key for submission
  let vatPeriodKey = '#001';
  try {
    const obs = (vatOblData as { obligations?: { periodKey: string; status: string }[] })?.obligations ?? [];
    const open = obs.find(o => o.status === 'O');
    if (open?.periodKey) vatPeriodKey = open.periodKey;
  } catch { /* keep default */ }

  // ── 15. VAT – Submit Return (POST) ───────────────────────────────────────────
  await call(
    results,
    'VAT – Submit Return',
    `/organisations/vat/${vrn}/returns`,
    'POST',
    token,
    fph,
    {
      accept: 'application/vnd.hmrc.1.0+json',
      body: {
        periodKey:                    vatPeriodKey,
        vatDueSales:                  105.50,
        vatDueAcquisitions:           0,
        totalVatDue:                  105.50,
        vatReclaimedCurrPeriod:       23.80,
        netVatDue:                    81.70,
        totalValueSalesExVAT:         527,
        totalValuePurchasesExVAT:     119,
        totalValueGoodsSuppliedExVAT: 0,
        totalAcquisitionsExVAT:       0,
        finalised:                    true,
      },
    },
  );

  // ── 16. VAT – Retrieve Return (GET) ──────────────────────────────────────────
  await call(
    results,
    'VAT – Retrieve Return',
    `/organisations/vat/${vrn}/returns/${encodeURIComponent(vatPeriodKey)}`,
    'GET',
    token,
    fph,
    { accept: 'application/vnd.hmrc.1.0+json' },
  );

  // ── 17. VAT – Liabilities (GET) ──────────────────────────────────────────────
  await call(
    results,
    'VAT – Liabilities',
    `/organisations/vat/${vrn}/liabilities?from=${fromDate}&to=${toDate}`,
    'GET',
    token,
    fph,
    { accept: 'application/vnd.hmrc.1.0+json' },
  );

  // ── 18. VAT – Payments (GET) ─────────────────────────────────────────────────
  await call(
    results,
    'VAT – Payments',
    `/organisations/vat/${vrn}/payments?from=${fromDate}&to=${toDate}`,
    'GET',
    token,
    fph,
    { accept: 'application/vnd.hmrc.1.0+json' },
  );

  const passed  = results.filter(r => r.ok).length;
  const failed  = results.filter(r => !r.ok).length;
  const summary = `${passed}/${results.length} calls succeeded`;

  return NextResponse.json({
    summary,
    passed,
    failed,
    total: results.length,
    context: { nino, vrn, businessId: resolvedBusinessId, taxYear },
    results,
  });
}

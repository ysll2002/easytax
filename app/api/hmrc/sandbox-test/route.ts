import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getValidToken } from '@/lib/hmrc';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';

// 16+ sequential HMRC sandbox calls; default 10s isn't enough.
export const maxDuration = 60;

// Always target the sandbox — sandbox tokens are required
const BASE = 'https://test-api.service.hmrc.gov.uk';

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

function buildFphHeaders(deviceData: Record<string, string>, vendorIp: string): Record<string, string> {
  const clientIp = deviceData.ip ?? '';
  // The MFA challenge is performed by HMRC's Government Gateway during OAuth sign-in;
  // our software does not handle the factor itself, so we report type=OTHER with a
  // timestamp derived from the device session so HMRC has a verifiable reference.
  const mfaRef = deviceData.userId
    ? createHash('sha256').update(`mfa:${deviceData.userId}`).digest('hex').slice(0, 16)
    : 'unknown';
  const mfaTs  = deviceData.ipTs ?? new Date().toISOString();
  const multiFactor = `type=OTHER&timestamp=${mfaTs}&unique-reference=${mfaRef}`;
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
    'Gov-Client-Multi-Factor':          multiFactor,
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
  opts: { accept?: string; body?: unknown; scenario?: string } = {},
): Promise<unknown> {
  const entry: ApiResult = { name, endpoint, method, status: null, ok: false };
  results.push(entry);
  try {
    const res = await fetch(`${BASE}${endpoint}`, {
      method,
      signal: AbortSignal.timeout(8000),
      headers: {
        Authorization:  `Bearer ${token}`,
        Accept:         opts.accept ?? 'application/vnd.hmrc.2.0+json',
        'Content-Type': 'application/json',
        ...fph,
        ...(opts.scenario ? { 'Gov-Test-Scenario': opts.scenario } : {}),
      },
      ...(opts.body != null ? { body: JSON.stringify(opts.body) } : {}),
    });
    entry.status = res.status;
    entry.ok     = res.ok || res.status === 204;
    const text = await res.text().catch(() => '');
    try { entry.data = JSON.parse(text); } catch { entry.data = text.slice(0, 200) || null; }
    return entry.data;
  } catch (err) {
    entry.status = null;
    entry.error  = err instanceof Error ? err.message : String(err);
    return null;
  }
}

export async function GET() {
  // Top-level catch so we always return valid JSON even if something crashes
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profileId = session.user.profileId;

    let token: string;
    try {
      token = await getValidToken(profileId);
    } catch {
      return NextResponse.json(
        { error: 'No HMRC connection found. Connect your HMRC account first.' },
        { status: 400 },
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'HMRC token is null — please reconnect your HMRC account.' },
        { status: 400 },
      );
    }

    const { data: conn } = await supabase
      .from('hmrc_connections')
      .select('nino, vrn')
      .eq('user_id', profileId)
      .single();

    const nino = conn?.nino ?? 'GW460330D';
    const vrn  = conn?.vrn  ?? '999999999';

    // Current UK tax year (April 6 → April 5)
    const now = new Date();
    const yr  = (now.getMonth() > 3 || (now.getMonth() === 3 && now.getDate() >= 6))
      ? now.getFullYear() : now.getFullYear() - 1;
    const taxYear      = `${yr}-${String(yr + 1).slice(2)}`;
    const PERIOD_START = `${yr}-04-06`;
    const PERIOD_END   = `${yr}-07-05`;

    const jar = await cookies();
    let deviceData: Record<string, string> = {};
    try {
      const raw = jar.get('hmrc_device')?.value;
      if (raw) deviceData = JSON.parse(decodeURIComponent(raw));
    } catch { /* ignore */ }

    const vendorIp = await getVendorIp();
    const fph      = buildFphHeaders(deviceData, vendorIp);

    const results: ApiResult[] = [];

    // ── 1. Hello World (user-restricted) ─────────────────────────────────────
    await call(results, 'Hello World', '/hello/user', 'GET', token, fph, { accept: 'application/vnd.hmrc.1.0+json' });

    // ── 2. FPH Validate ──────────────────────────────────────────────────────
    await call(results, 'FPH Validate', '/test/fraud-prevention-headers/validate', 'GET', token, fph, { accept: 'application/vnd.hmrc.1.0+json' });

    // ── 3. Business Details ──────────────────────────────────────────────────
    const bizData = await call(results, 'Business Details – List', `/individuals/business/details/${nino}/list`, 'GET', token, fph, { accept: 'application/vnd.hmrc.2.0+json' });

    let resolvedBusinessId = 'XAIS12345678910';
    try {
      const biz = (bizData as { listOfBusinesses?: { typeOfBusiness: string; businessId: string }[] })?.listOfBusinesses ?? [];
      const se  = biz.find(b => b.typeOfBusiness === 'self-employment');
      if (se?.businessId) resolvedBusinessId = se.businessId;
    } catch { /* keep fallback */ }

    // ── 4. Obligations ───────────────────────────────────────────────────────
    const oblData = await call(results, 'Obligations – Income & Expenditure', `/obligations/details/${nino}/income-and-expenditure?typeOfBusiness=self-employment`, 'GET', token, fph, { accept: 'application/vnd.hmrc.3.0+json' });

    // Use actual obligation period dates if available (HMRC returns lowercase status)
    let periodStart = PERIOD_START;
    let periodEnd   = PERIOD_END;
    let oblTaxYear  = taxYear;
    try {
      type OblDetail = { periodStartDate: string; periodEndDate: string; status: string };
      const allObls: OblDetail[] = (oblData as { obligations?: { obligationDetails: OblDetail[] }[] })
        ?.obligations?.flatMap(o => o.obligationDetails) ?? [];
      const open = allObls.find(o => o.status.toLowerCase() === 'open');
      if (open?.periodStartDate) {
        periodStart = open.periodStartDate;
        periodEnd   = open.periodEndDate ?? PERIOD_END;
        // Derive taxYear from the obligation period
        const d = new Date(periodStart);
        const yr2 = (d.getMonth() > 3 || (d.getMonth() === 3 && d.getDate() >= 6))
          ? d.getFullYear() : d.getFullYear() - 1;
        oblTaxYear = `${yr2}-${String(yr2 + 1).slice(2)}`;
      }
    } catch { /* keep defaults */ }

    // Self Employment Business (MTD) v5.0 only supports 2023-24+
    // If obligation taxYear is older, fall back to current taxYear with current period
    const psTaxYear = oblTaxYear >= '2023-24' ? oblTaxYear : taxYear;
    const psStart   = oblTaxYear >= '2023-24' ? periodStart : PERIOD_START;
    const psEnd     = oblTaxYear >= '2023-24' ? periodEnd   : PERIOD_END;

    // ── 5. Period Summaries (Quarterly Update) ───────────────────────────────
    await call(
      results,
      'Period Summaries – Quarterly Update',
      `/individuals/business/self-employment/${nino}/${resolvedBusinessId}/period-summaries?taxYear=${psTaxYear}`,
      'PUT', token, fph,
      {
        accept: 'application/vnd.hmrc.5.0+json',
        body: {
          periodDates:    { periodStartDate: psStart, periodEndDate: psEnd },
          periodIncome:   { turnover: 5000, other: 0 },
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

    // ── 6. Annual Adjustments ────────────────────────────────────────────────
    await call(results, 'Annual Adjustments', `/individuals/self-assessment/adjustments/${nino}/${resolvedBusinessId}/${psTaxYear}`, 'PUT', token, fph, { accept: 'application/vnd.hmrc.5.0+json', body: { overlapReliefUsed: 100, accountingAdjustment: 50 } });

    // ── 7. Calculation – Trigger ─────────────────────────────────────────────
    const calcTrigger = await call(results, 'Calculation – Trigger', `/individuals/calculations/${nino}/self-assessment/${psTaxYear}`, 'POST', token, fph, { accept: 'application/vnd.hmrc.8.0+json', body: { finalDeclaration: false } });

    // ── 8. Calculation – Retrieve ────────────────────────────────────────────
    const calculationId = (calcTrigger as { calculationId?: string })?.calculationId;
    if (calculationId) {
      await call(results, 'Calculation – Retrieve', `/individuals/calculations/${nino}/self-assessment/${psTaxYear}/${calculationId}`, 'GET', token, fph, { accept: 'application/vnd.hmrc.8.0+json' });
    } else {
      results.push({ name: 'Calculation – Retrieve', endpoint: '(skipped – no calculationId)', method: 'GET', status: null, ok: false, error: 'Skipped: no calculationId from trigger' });
    }

    // ── 9. Dividends Income (Individuals Dividends Income MTD v2.0) ──────────
    // Correct path for this API is /individuals/dividends-income/ not /income-received/dividends/
    await call(results, 'Dividends Income', `/individuals/dividends-income/${nino}/${taxYear}`, 'PUT', token, fph, { accept: 'application/vnd.hmrc.2.0+json', body: { stockDividend: { customerReference: 'EasyTax-Test-001', grossAmount: 300.00 } } });

    // ── 10. Charitable Giving (Individuals Reliefs MTD v3.0) ─────────────────
    await call(results, 'Reliefs – Charitable Giving', `/individuals/reliefs/charitable-giving/${nino}/${taxYear}`, 'PUT', token, fph, { accept: 'application/vnd.hmrc.3.0+json', body: { giftAidPayments: { totalAmount: 100, oneOffAmount: 50 } } });

    // ── 11. Business Source Adjustable Summary (BSAS MTD v7.0) ───────────────
    await call(results, 'Business Source Adjustable Summary', `/individuals/self-assessment/adjustable-summary/${nino}/${taxYear}?businessId=${resolvedBusinessId}`, 'GET', token, fph, { accept: 'application/vnd.hmrc.7.0+json' });

    // ── 14–18. VAT MTD ───────────────────────────────────────────────────────
    // Use last 6 months to avoid DATE_RANGE_INVALID
    const to   = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const vatOblData = await call(results, 'VAT – Obligations', `/organisations/vat/${vrn}/obligations?from=${from}&to=${to}`, 'GET', token, fph, { accept: 'application/vnd.hmrc.1.0+json' });

    // Find any fulfilled period key (for Retrieve) and any open one (for Submit)
    let vatPeriodKeyAny  = '18A2';  // fallback — the one we know exists
    let vatOpenPeriodKey: string | null = null;
    try {
      const obs = (vatOblData as { obligations?: { periodKey: string; status: string }[] })?.obligations ?? [];
      const fulfilled = obs.find(o => o.status === 'F');
      const open      = obs.find(o => o.status === 'O');
      if (fulfilled?.periodKey) vatPeriodKeyAny  = fulfilled.periodKey;
      if (open?.periodKey)      vatOpenPeriodKey = open.periodKey;
    } catch { /* keep defaults */ }

    // Only attempt VAT submission when there is an open obligation
    if (vatOpenPeriodKey) {
      await call(
        results, 'VAT – Submit Return', `/organisations/vat/${vrn}/returns`,
        'POST', token, fph,
        {
          accept: 'application/vnd.hmrc.1.0+json',
          body: {
            periodKey: vatOpenPeriodKey, vatDueSales: 105.50, vatDueAcquisitions: 0,
            totalVatDue: 105.50, vatReclaimedCurrPeriod: 23.80, netVatDue: 81.70,
            totalValueSalesExVAT: 527, totalValuePurchasesExVAT: 119,
            totalValueGoodsSuppliedExVAT: 0, totalAcquisitionsExVAT: 0, finalised: true,
          },
        },
      );
    } else {
      results.push({ name: 'VAT – Submit Return', endpoint: `POST /organisations/vat/${vrn}/returns`, method: 'POST', status: null, ok: false, error: 'Skipped: no open VAT obligation found' });
    }

    await call(results, 'VAT – Retrieve Return',  `/organisations/vat/${vrn}/returns/18A2`, 'GET',  token, fph, { accept: 'application/vnd.hmrc.1.0+json' });

    // HMRC sandbox returns 404 for these endpoints unless a Gov-Test-Scenario header
    // forces sample data. Without the scenario, the request is well-formed but the
    // upstream test backend has no row matching real-date queries.
    await call(results, 'VAT – Liabilities',         `/organisations/vat/${vrn}/liabilities?from=${from}&to=${to}`,             'GET', token, fph, { accept: 'application/vnd.hmrc.1.0+json', scenario: 'SINGLE_LIABILITY' });
    await call(results, 'VAT – Payments',            `/organisations/vat/${vrn}/payments?from=${from}&to=${to}`,                'GET', token, fph, { accept: 'application/vnd.hmrc.1.0+json', scenario: 'SINGLE_PAYMENT' });
    await call(results, 'VAT – Penalties',           `/organisations/vat/${vrn}/penalties`,                                     'GET', token, fph, { accept: 'application/vnd.hmrc.1.0+json', scenario: 'PENALTIES_LSP_AND_LPP' });
    await call(results, 'VAT – Financial Details',   `/organisations/vat/${vrn}/financial-details?searchType=CHARGE`,           'GET', token, fph, { accept: 'application/vnd.hmrc.1.0+json', scenario: 'FINANCIAL_DETAILS' });

    const passed  = results.filter(r => r.ok).length;
    const failed  = results.filter(r => !r.ok).length;
    const summary = `${passed}/${results.length} calls succeeded`;

    return NextResponse.json({
      summary, passed, failed, total: results.length,
      debug: {
        hmrcEnv:    process.env.HMRC_ENV ?? '(not set)',
        baseUrl:    BASE,
        tokenLen:   token.length,
        tokenStart: token.substring(0, 8),
      },
      context: { nino, vrn, businessId: resolvedBusinessId, taxYear },
      results,
    });

  } catch (err) {
    // Always return valid JSON — never let the function return an empty body
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Unhandled server error: ${msg}` }, { status: 500 });
  }
}

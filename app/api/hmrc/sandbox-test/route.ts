import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getValidToken } from '@/lib/hmrc';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';

// Full HMRC endpoint coverage harness — 40+ sequential sandbox calls.
export const maxDuration = 120;

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
  // Gov-Client-Multi-Factor is intentionally omitted — see lib/hmrc.ts for the
  // rationale (HMRC ticket 2026-NQM717: EasyTax has no in-app MFA; the Gov
  // Gateway MFA is out of scope, sending a placeholder trips the validator).
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
  opts: { accept?: string; body?: unknown; scenario?: string } = {},
): Promise<unknown> {
  const entry: ApiResult = { name, endpoint, method, status: null, ok: false };
  results.push(entry);
  // HMRC sandbox throttles around 60 req/min per token. Space requests out
  // by ~900ms so 40+ calls fit inside maxDuration without triggering 429.
  if (results.length > 1) await new Promise(r => setTimeout(r, 900));
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
    // Prior tax year (already ended) — required by endpoints that only accept
    // completed years such as SA Accounts Coding Out Create/Amend.
    const prevTaxYear  = `${yr - 1}-${String(yr).slice(2)}`;
    const PERIOD_START = `${yr}-04-06`;
    const PERIOD_END   = `${yr}-07-05`;

    const jar = await cookies();
    let deviceData: Record<string, string> = {};
    try {
      const raw = jar.get('hmrc_device')?.value;
      if (raw) deviceData = JSON.parse(decodeURIComponent(raw));
    } catch { /* ignore */ }

    // Server-side profileId is always available here; the device cookie may not
    // yet carry userId if the client-side collector hasn't seen the session.
    // Force-authoritative override so FPH never falls back to placeholders.
    if (!deviceData.userId) deviceData.userId = profileId;

    const vendorIp = await getVendorIp();
    const fph      = buildFphHeaders(deviceData, vendorIp);

    const results: ApiResult[] = [];

    // ── 1. Hello World (user-restricted) ─────────────────────────────────────
    await call(results, 'Hello World', '/hello/user', 'GET', token, fph, { accept: 'application/vnd.hmrc.1.0+json' });

    // ── 2. FPH Validate ──────────────────────────────────────────────────────
    await call(results, 'FPH Validate', '/test/fraud-prevention-headers/validate', 'GET', token, fph, { accept: 'application/vnd.hmrc.1.0+json' });

    // ── Business Details v2.0 ────────────────────────────────────────────────
    const bizData = await call(results, 'Business Details – List', `/individuals/business/details/${nino}/list`, 'GET', token, fph, { accept: 'application/vnd.hmrc.2.0+json' });

    let resolvedBusinessId = 'XAIS12345678910';
    try {
      const biz = (bizData as { listOfBusinesses?: { typeOfBusiness: string; businessId: string }[] })?.listOfBusinesses ?? [];
      const se  = biz.find(b => b.typeOfBusiness === 'self-employment');
      if (se?.businessId) resolvedBusinessId = se.businessId;
    } catch { /* keep fallback */ }

    // Retrieve Business Details (single) — HMRC flagged this as missing coverage.
    await call(
      results,
      'Business Details – Retrieve',
      `/individuals/business/details/${nino}/${resolvedBusinessId}`,
      'GET', token, fph,
      { accept: 'application/vnd.hmrc.2.0+json' },
    );

    // ── Obligations v3.0 ─────────────────────────────────────────────────────
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
    // Suppress unused-var warnings while keeping the derived values available
    // for any future non-cumulative Period Summary re-enable.
    void periodStart; void periodEnd;

    // Self Employment Business (MTD) v5.0 only supports 2023-24+
    // If obligation taxYear is older, fall back to current taxYear.
    const psTaxYear = oblTaxYear >= '2023-24' ? oblTaxYear : taxYear;

    // ── Self-Employment Business v5.0: Non-cumulative Period Summary ─────────
    // Retained for evidence: TY 2024-25 sandbox stub. Real production code uses
    // real obligation dates. HMRC v5.0 sandbox stub only stocks TY ≤ 2024-25 for
    // this endpoint (returns RULE_TAX_YEAR_NOT_SUPPORTED otherwise).
    await call(
      results,
      'SE – Period Summaries (Quarterly Update)',
      `/individuals/business/self-employment/${nino}/${resolvedBusinessId}/period`,
      'POST', token, fph,
      {
        accept: 'application/vnd.hmrc.5.0+json',
        body: {
          periodDates:    { periodStartDate: '2024-04-06', periodEndDate: '2024-07-05' },
          periodIncome:   { turnover: 5000, other: 0 },
          periodExpenses: {
            costOfGoods:          200,
            wagesAndStaffCosts:   100,
            carVanTravelExpenses: 50,
            premisesRunningCosts: 300,
            adminCosts:           80,
            advertisingCosts:     120,
            professionalFees:     250,
            otherExpenses:        150,
          },
        },
      },
    );

    // ── Self-Employment Business v5.0: Annual Adjustments ────────────────────
    await call(
      results,
      'SE – Annual Adjustments',
      `/individuals/business/self-employment/${nino}/${resolvedBusinessId}/annual/${psTaxYear}`,
      'PUT', token, fph,
      {
        accept: 'application/vnd.hmrc.5.0+json',
        body: { adjustments: { overlapReliefUsed: 100, accountingAdjustment: 50 } },
      },
    );

    // ── Self-Employment Business v5.0: Cumulative Period Summary ─────────────
    // HMRC flagged both endpoints as missing coverage. Cumulative endpoints
    // only accept TY ≥ 2025-26, so pin to 2025-26 for the sandbox stub.
    const cumTaxYear = '2025-26';
    await call(
      results,
      'SE – Cumulative Period Summary (Create/Amend)',
      `/individuals/business/self-employment/${nino}/${resolvedBusinessId}/cumulative/${cumTaxYear}`,
      'PUT', token, fph,
      {
        accept: 'application/vnd.hmrc.5.0+json',
        body: {
          periodDates: { periodStartDate: '2025-04-06', periodEndDate: '2025-07-05' },
          periodIncome: { turnover: 1000.99, other: 1000.09, taxTakenOffTradingIncome: 1000.99 },
          periodExpenses: { consolidatedExpenses: 1000.99 },
        },
      },
    );
    await call(
      results,
      'SE – Cumulative Period Summary (Retrieve)',
      `/individuals/business/self-employment/${nino}/${resolvedBusinessId}/cumulative/${cumTaxYear}`,
      'GET', token, fph,
      { accept: 'application/vnd.hmrc.5.0+json' },
    );

    // ── Individual Calculations v8.0 ─────────────────────────────────────────
    // Trigger a new in-year calculation (POST) then retrieve + list.
    const calcTrigger = await call(
      results,
      'Calculation – Trigger (in-year)',
      `/individuals/calculations/${nino}/self-assessment/${psTaxYear}/trigger/in-year`,
      'POST', token, fph,
      { accept: 'application/vnd.hmrc.8.0+json' },
    );

    const calculationId = (calcTrigger as { calculationId?: string })?.calculationId;
    if (calculationId) {
      await call(results, 'Calculation – Retrieve', `/individuals/calculations/${nino}/self-assessment/${psTaxYear}/${calculationId}`, 'GET', token, fph, { accept: 'application/vnd.hmrc.8.0+json' });
    } else {
      results.push({ name: 'Calculation – Retrieve', endpoint: '(skipped – no calculationId)', method: 'GET', status: null, ok: false, error: 'Skipped: no calculationId from trigger' });
    }

    // List Self Assessment Tax Calculations — HMRC flagged this as missing.
    await call(
      results,
      'Calculation – List',
      `/individuals/calculations/${nino}/self-assessment/${psTaxYear}`,
      'GET', token, fph,
      { accept: 'application/vnd.hmrc.8.0+json' },
    );

    // ── Individuals Dividends Income v2.0 — full endpoint coverage ───────────
    // HMRC flagged: only one endpoint previously tested; requires all.
    // Full Dividends Income: PUT / GET / DELETE
    await call(
      results,
      'Dividends – Create/Amend',
      `/individuals/dividends-income/${nino}/${taxYear}`,
      'PUT', token, fph,
      {
        accept: 'application/vnd.hmrc.2.0+json',
        body: {
          stockDividend: { customerReference: 'EasyTax-Test-001', grossAmount: 300.00 },
        },
      },
    );
    await call(
      results,
      'Dividends – Retrieve',
      `/individuals/dividends-income/${nino}/${taxYear}`,
      'GET', token, fph,
      { accept: 'application/vnd.hmrc.2.0+json' },
    );
    await call(
      results,
      'Dividends – Delete',
      `/individuals/dividends-income/${nino}/${taxYear}`,
      'DELETE', token, fph,
      { accept: 'application/vnd.hmrc.2.0+json' },
    );
    // UK Dividends Annual Summary: PUT / GET / DELETE
    await call(
      results,
      'Dividends – UK Annual Summary (Create/Amend)',
      `/individuals/dividends-income/uk/${nino}/${taxYear}`,
      'PUT', token, fph,
      {
        accept: 'application/vnd.hmrc.2.0+json',
        body: { ukDividends: 5000.00, otherUkDividends: 200.00 },
      },
    );
    await call(
      results,
      'Dividends – UK Annual Summary (Retrieve)',
      `/individuals/dividends-income/uk/${nino}/${taxYear}`,
      'GET', token, fph,
      { accept: 'application/vnd.hmrc.2.0+json' },
    );
    await call(
      results,
      'Dividends – UK Annual Summary (Delete)',
      `/individuals/dividends-income/uk/${nino}/${taxYear}`,
      'DELETE', token, fph,
      { accept: 'application/vnd.hmrc.2.0+json' },
    );

    // ── Individuals Reliefs v3.0 — full endpoint coverage ────────────────────
    // HMRC flagged: only charitable-giving PUT previously tested; requires all.
    // Loop the four typed reliefs (investment, other, foreign, pensions) × CRUD.
    const reliefTypes: { name: string; body: Record<string, unknown> }[] = [
      {
        name: 'investment',
        body: {
          vctSubscription: [{ uniqueInvestmentRef: 'VCTREF', name: 'VCT Fund X', dateOfInvestment: '2020-04-16', amountInvested: 23312.00, reliefClaimed: 1334.00 }],
        },
      },
      {
        name: 'other',
        body: {
          nonDeductibleLoanInterest: { customerReference: 'easytax-ref', reliefClaimed: 763.00 },
          payrollGiving: { customerReference: 'easytax-ref', reliefClaimed: 154.00 },
        },
      },
      {
        name: 'foreign',
        body: { foreignTaxCreditRelief: { amount: 2000.99 } },
      },
      {
        name: 'pensions',
        body: {
          pensionReliefs: {
            regularPensionContributions: 1999.99,
            oneOffPensionContributionsPaid: 1999.99,
          },
        },
      },
    ];
    for (const rt of reliefTypes) {
      await call(results, `Reliefs – ${rt.name} (Create/Amend)`, `/individuals/reliefs/${rt.name}/${nino}/${taxYear}`, 'PUT', token, fph, { accept: 'application/vnd.hmrc.3.0+json', body: rt.body });
      await call(results, `Reliefs – ${rt.name} (Retrieve)`,      `/individuals/reliefs/${rt.name}/${nino}/${taxYear}`, 'GET', token, fph, { accept: 'application/vnd.hmrc.3.0+json' });
      await call(results, `Reliefs – ${rt.name} (Delete)`,        `/individuals/reliefs/${rt.name}/${nino}/${taxYear}`, 'DELETE', token, fph, { accept: 'application/vnd.hmrc.3.0+json' });
    }
    // Charitable Giving CRUD (PUT + GET + DELETE)
    await call(
      results,
      'Reliefs – Charitable Giving (Create/Amend)',
      `/individuals/reliefs/charitable-giving/${nino}/${taxYear}`,
      'PUT', token, fph,
      { accept: 'application/vnd.hmrc.3.0+json', body: { giftAidPayments: { totalAmount: 100, oneOffAmount: 50 } } },
    );
    await call(
      results,
      'Reliefs – Charitable Giving (Retrieve)',
      `/individuals/reliefs/charitable-giving/${nino}/${taxYear}`,
      'GET', token, fph,
      { accept: 'application/vnd.hmrc.3.0+json' },
    );
    await call(
      results,
      'Reliefs – Charitable Giving (Delete)',
      `/individuals/reliefs/charitable-giving/${nino}/${taxYear}`,
      'DELETE', token, fph,
      { accept: 'application/vnd.hmrc.3.0+json' },
    );

    // ── Business Source Adjustable Summary v7.0 (kept from earlier harness) ──
    await call(results, 'Business Source Adjustable Summary', `/individuals/self-assessment/adjustable-summary/${nino}/${taxYear}?businessId=${resolvedBusinessId}`, 'GET', token, fph, { accept: 'application/vnd.hmrc.7.0+json' });

    // ── Individuals Savings Income v2.0 — full endpoint coverage ─────────────
    // HMRC flagged: only List previously tested; requires all endpoints.
    await call(results, 'Savings – List UK Accounts', `/individuals/savings-income/uk-accounts/${nino}`, 'GET', token, fph, { accept: 'application/vnd.hmrc.2.0+json' });

    // Add UK Savings Account — use STATEFUL so we get a real ID back for the
    // subsequent update/retrieve/amend calls in the same session.
    const addSavings = await call(
      results,
      'Savings – Add UK Savings Account',
      `/individuals/savings-income/uk-accounts/${nino}`,
      'POST', token, fph,
      {
        accept: 'application/vnd.hmrc.2.0+json',
        scenario: 'STATEFUL',
        body: { accountName: 'EasyTax Test Savings' },
      },
    );
    // Sandbox stub sample id used as fallback if STATEFUL response is missing.
    const savingsAccountId = (addSavings as { savingsAccountId?: string })?.savingsAccountId ?? 'SAVKB2UVwUTBQGJ';

    await call(
      results,
      'Savings – Update UK Savings Account Name',
      `/individuals/savings-income/uk-accounts/${nino}/account-name/${savingsAccountId}`,
      'PUT', token, fph,
      {
        accept: 'application/vnd.hmrc.2.0+json',
        scenario: 'STATEFUL',
        body: { accountName: 'EasyTax Renamed Savings' },
      },
    );
    await call(
      results,
      'Savings – UK Savings Annual Summary (Create/Amend)',
      `/individuals/savings-income/uk-accounts/${nino}/${taxYear}/${savingsAccountId}`,
      'PUT', token, fph,
      {
        accept: 'application/vnd.hmrc.2.0+json',
        scenario: 'STATEFUL',
        body: { taxedUkInterest: 1234.56, untaxedUkInterest: 789.10 },
      },
    );
    await call(
      results,
      'Savings – UK Savings Annual Summary (Retrieve)',
      `/individuals/savings-income/uk-accounts/${nino}/${taxYear}/${savingsAccountId}`,
      'GET', token, fph,
      { accept: 'application/vnd.hmrc.2.0+json', scenario: 'STATEFUL' },
    );
    // Other Savings Income (securities + foreignInterest) CRUD
    await call(
      results,
      'Savings – Other Savings Income (Create/Amend)',
      `/individuals/savings-income/other/${nino}/${taxYear}`,
      'PUT', token, fph,
      {
        accept: 'application/vnd.hmrc.2.0+json',
        body: {
          securities: { taxTakenOff: 100.12, grossAmount: 1455.23, netAmount: 1355.11 },
          foreignInterest: [
            {
              amountBeforeTax: 1232.67,
              countryCode: 'DEU',
              taxTakenOff: 12.45,
              specialWithholdingTax: 14.78,
              taxableAmount: 1032.67,
              foreignTaxCreditRelief: true,
            },
          ],
        },
      },
    );
    await call(
      results,
      'Savings – Other Savings Income (Retrieve)',
      `/individuals/savings-income/other/${nino}/${taxYear}`,
      'GET', token, fph,
      { accept: 'application/vnd.hmrc.2.0+json' },
    );
    await call(
      results,
      'Savings – Other Savings Income (Delete)',
      `/individuals/savings-income/other/${nino}/${taxYear}`,
      'DELETE', token, fph,
      { accept: 'application/vnd.hmrc.2.0+json' },
    );

    // ── Self Assessment Accounts v4.0 — full endpoint coverage ───────────────
    // HMRC flagged: only balance-and-transactions previously tested; requires all.
    await call(
      results,
      'SA Accounts – Balance & Transactions',
      `/accounts/self-assessment/${nino}/balance-and-transactions?onlyOpenItems=true`,
      'GET', token, fph,
      { accept: 'application/vnd.hmrc.4.0+json' },
    );
    await call(
      results,
      'SA Accounts – Payments & Allocations',
      `/accounts/self-assessment/${nino}/payments-and-allocations`,
      'GET', token, fph,
      { accept: 'application/vnd.hmrc.4.0+json' },
    );
    // Coding Out CRUD — PUT is only valid for a completed tax year.
    await call(
      results,
      'SA Accounts – Coding Out (Retrieve)',
      `/accounts/self-assessment/${nino}/${prevTaxYear}/collection/tax-code?source=user`,
      'GET', token, fph,
      { accept: 'application/vnd.hmrc.4.0+json' },
    );
    await call(
      results,
      'SA Accounts – Coding Out (Create/Amend)',
      `/accounts/self-assessment/${nino}/${prevTaxYear}/collection/tax-code`,
      'PUT', token, fph,
      {
        accept: 'application/vnd.hmrc.4.0+json',
        body: {
          taxCodeComponents: {
            payeUnderpayment:           [{ amount: 2000.50, id: 1234567890 }],
            selfAssessmentUnderpayment: [{ amount: 1123.45, id: 4657839807 }],
            debt:                       [{ amount:  100.25, id: 2134693857 }],
            inYearAdjustment:            { amount:  123.45, id: 9873562901 },
          },
        },
      },
    );
    await call(
      results,
      'SA Accounts – Coding Out (Delete)',
      `/accounts/self-assessment/${nino}/${prevTaxYear}/collection/tax-code`,
      'DELETE', token, fph,
      { accept: 'application/vnd.hmrc.4.0+json' },
    );
    await call(
      results,
      'SA Accounts – Coding Out Opt Out',
      `/accounts/self-assessment/${nino}/${taxYear}/collection/tax-code/coding-out/opt-out`,
      'POST', token, fph,
      { accept: 'application/vnd.hmrc.4.0+json' },
    );
    await call(
      results,
      'SA Accounts – Coding Out Status',
      `/accounts/self-assessment/${nino}/${taxYear}/collection/tax-code/coding-out/status`,
      'GET', token, fph,
      { accept: 'application/vnd.hmrc.4.0+json' },
    );
    await call(
      results,
      'SA Accounts – Coding Out Opt In',
      `/accounts/self-assessment/${nino}/${taxYear}/collection/tax-code/coding-out/opt-in`,
      'POST', token, fph,
      { accept: 'application/vnd.hmrc.4.0+json' },
    );

    // ── Individuals Disclosures v2.0 — full endpoint coverage ────────────────
    // HMRC flagged: only Retrieve previously tested; requires Create Marriage
    // Allowance, Create/Amend Disclosures, and Delete Disclosures.
    await call(
      results,
      'Disclosures – Create Marriage Allowance',
      `/individuals/disclosures/marriage-allowance/${nino}`,
      'POST', token, fph,
      {
        accept: 'application/vnd.hmrc.2.0+json',
        body: {
          spouseOrCivilPartnerNino: 'TC663795B',
          spouseOrCivilPartnerFirstName: 'John',
          spouseOrCivilPartnerSurname: 'Smith',
          spouseOrCivilPartnerDateOfBirth: '1987-10-18',
        },
      },
    );
    await call(
      results,
      'Disclosures – Create/Amend',
      `/individuals/disclosures/${nino}/${taxYear}`,
      'PUT', token, fph,
      {
        accept: 'application/vnd.hmrc.2.0+json',
        body: {
          taxAvoidance: [{ srn: '14211123', taxYear: '2020-21' }],
          class2Nics: { class2VoluntaryContributions: true },
        },
      },
    );
    await call(
      results,
      'Disclosures – Retrieve',
      `/individuals/disclosures/${nino}/${taxYear}`,
      'GET', token, fph,
      { accept: 'application/vnd.hmrc.2.0+json' },
    );
    await call(
      results,
      'Disclosures – Delete',
      `/individuals/disclosures/${nino}/${taxYear}`,
      'DELETE', token, fph,
      { accept: 'application/vnd.hmrc.2.0+json' },
    );

    // ── SA Individual Details v2.0 ───────────────────────────────────────────
    await call(results, 'SA Individual Details – ITSA Status', `/individuals/person/itsa-status/${nino}/${taxYear}`, 'GET', token, fph, { accept: 'application/vnd.hmrc.2.0+json' });

    // ── Self Assessment Assist v1.0 — Produce + Acknowledge ──────────────────
    // Use a valid non-special UUID so sandbox returns 200 with reportId +
    // correlationId (rather than the 204 no-messages stub). Then Acknowledge
    // the returned report to exercise the second endpoint HMRC flagged.
    const saAssistCalcId = 'f2fb30e5-4ab6-4a29-b3c1-c7264259ff1c';
    const produceReport = await call(
      results,
      'SA Assist – Produce Report',
      `/individuals/self-assessment/assist/reports/${nino}/${taxYear}/${saAssistCalcId}`,
      'POST', token, fph,
      { accept: 'application/vnd.hmrc.1.0+json' },
    );
    // Sandbox stub always returns these fixed values; fall back to them if the
    // JSON body doesn't carry them (they may only appear in response headers).
    const saReportId      = (produceReport as { reportId?: string })?.reportId
      ?? '579800fe-e047-cd40-b3e4-0e14b1f183a8';
    const saCorrelationId = (produceReport as { correlationId?: string })?.correlationId
      ?? 'BD5A1B594995A197D528ECCF4BC6EA793C869B2F75333902F043E35561B927C4';
    await call(
      results,
      'SA Assist – Acknowledge Report',
      `/individuals/self-assessment/assist/reports/acknowledge/${nino}/${saReportId}/${saCorrelationId}`,
      'POST', token, fph,
      { accept: 'application/vnd.hmrc.1.0+json' },
    );

    // Individual Employment 1.2 + Individual Tax 1.1 were tested but dropped —
    // pre-MTD legacy APIs with no sandbox stub data, not used in production code.

    // ── VAT MTD ──────────────────────────────────────────────────────────────
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
    void vatPeriodKeyAny;

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
    // Penalties API + Financial Details are not in our production subscription scope
    // (declared out of scope in 9 Jun 2026 email to Ciaran). Excluded from the harness.

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

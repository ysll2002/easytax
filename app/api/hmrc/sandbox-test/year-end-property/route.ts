import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getValidToken, fraudHeaders } from '@/lib/hmrc';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { HARNESS_BASE, call, skipped, productionGuard, currentTaxYear, type ApiResult } from '@/lib/hmrc-sandbox-harness';

// Sandbox coverage for the three APIs we need before asking HMRC to add them
// to the production application:
//
//   Property Business (MTD)                    6.0  — UK property income
//   Business Source Adjustable Summary (MTD)   7.0  — year-end accounting adjustments
//   Individual Losses (MTD)                    7.0  — brought-forward losses and loss claims
//
// It is a separate suite from ../route.ts because that one already makes ~60
// calls at 900ms spacing; adding these would push it past maxDuration.
//
// Why every endpoint and not just the ones the product will call: SDST checks
// sandbox logs per endpoint before approving production access. On the first
// ITSA review they came back with "only List previously tested; requires all
// endpoints" for Savings Income and Dividends Income. This suite is written so
// that the same note does not come back for these three.
//
// Before running: the *sandbox* application must be subscribed to all three
// APIs on the Developer Hub. Unsubscribed, every row returns 403.
//
// Request shapes: written against HMRC's published specs as far as they could
// be read from outside the Developer Hub (which this repo's build environment
// cannot reach). Where a shape is wrong, the row carries HMRC's error code
// (RULE_INCORRECT_OR_EMPTY_BODY_SUBMITTED, FORMAT_*, MATCHING_RESOURCE_NOT_FOUND)
// and the expanded body says which field — fix the request here, re-run.
//
// Not covered: foreign property, and the historic (pre-2025-26) FHL / non-FHL
// annual endpoints. EasyTax is targeting UK property only. If SDST asks for
// full Property Business coverage, those are what it will mean.

export const maxDuration = 120;

const V = {
  property:    'application/vnd.hmrc.6.0+json',
  bsas:        'application/vnd.hmrc.7.0+json',
  losses:      'application/vnd.hmrc.7.0+json',
  obligations: 'application/vnd.hmrc.3.0+json',
  business:    'application/vnd.hmrc.2.0+json',
};

// Cumulative and year-end endpoints only accept 2025-26 onwards; the sandbox
// stubs are stocked for that year. Same pin as the SE cumulative calls in
// ../route.ts.
const TY        = '2025-26';
// The last year that still uses the non-cumulative period endpoints.
const LEGACY_TY = '2024-25';
// Losses are brought forward *from* an ended year, and claimed *for* one.
const LOSS_TY   = '2024-25';

export async function GET() {
  const guard = productionGuard();
  if (guard) return guard;

  try {
    const session = await auth();
    if (!session?.user?.profileId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const profileId = session.user.profileId;

    let token: string;
    try {
      token = await getValidToken(profileId);
    } catch {
      return NextResponse.json({ error: 'No HMRC connection found. Connect your HMRC account first.' }, { status: 400 });
    }
    if (!token) {
      return NextResponse.json({ error: 'HMRC token is null — please reconnect your HMRC account.' }, { status: 400 });
    }

    const { data: conn } = await supabase
      .from('hmrc_connections')
      .select('nino')
      .eq('user_id', profileId)
      .single();
    const nino       = conn?.nino ?? 'GW460330D';
    const ninoSource = conn?.nino ? 'from your HMRC connection' : 'sandbox default (none stored)';

    const fph = await fraudHeaders();
    const results: ApiResult[] = [];

    // ── Business IDs ─────────────────────────────────────────────────────────
    // A sandbox test user created with a UK property business lists it here.
    // If not, the stubs accept any well-formed ID, so fall back to one — and
    // report which it was, as ../route.ts does for the NINO.
    const biz = await call(results, 'Business Details – List', `/individuals/business/details/${nino}/list`, 'GET', token, fph, { accept: V.business });
    const list = (biz as { listOfBusinesses?: { typeOfBusiness: string; businessId: string }[] })?.listOfBusinesses ?? [];
    const seId       = list.find(b => b.typeOfBusiness === 'self-employment')?.businessId ?? 'XAIS12345678910';
    const propertyId = list.find(b => b.typeOfBusiness === 'uk-property')?.businessId ?? 'XPIS12345678901';
    const propertySource = list.some(b => b.typeOfBusiness === 'uk-property')
      ? 'from Business Details'
      : 'sandbox default (test user has no uk-property business)';

    // ════════════════════════════════════════════════════════════════════════
    // Property Business (MTD) 6.0
    // ════════════════════════════════════════════════════════════════════════

    // Obligations is already subscribed; this is the property-shaped call the
    // product will need, and the one lib/hmrc.ts currently hardcodes away.
    await call(results, 'Obligations – UK property', `/obligations/details/${nino}/income-and-expenditure?typeOfBusiness=uk-property`, 'GET', token, fph, { accept: V.obligations });

    // ── Cumulative period summary (2025-26 onwards) — the quarterly update ──
    const ukPeriod = {
      income: {
        periodAmount:        5000,
        premiumsOfLeaseGrant: 0,
        otherIncome:         120,
      },
      expenses: {
        premisesRunningCosts:     450,
        repairsAndMaintenance:    300,
        financialCosts:           0,
        professionalFees:         180,
        costOfServices:           60,
        travelCosts:              40,
        other:                    25,
        residentialFinancialCost: 1200,
      },
    };
    await call(results, 'Property – UK Cumulative Period Summary (Create/Amend)',
      `/individuals/business/property/uk/${nino}/${propertyId}/cumulative/${TY}`, 'PUT', token, fph,
      { accept: V.property, body: { fromDate: '2025-04-06', toDate: '2025-07-05', ukProperty: ukPeriod } });
    await call(results, 'Property – UK Cumulative Period Summary (Retrieve)',
      `/individuals/business/property/uk/${nino}/${propertyId}/cumulative/${TY}`, 'GET', token, fph,
      { accept: V.property });

    // ── Annual submission — adjustments and allowances ───────────────────────
    await call(results, 'Property – UK Annual Submission (Create/Amend)',
      `/individuals/business/property/uk/${nino}/${propertyId}/annual/${TY}`, 'PUT', token, fph,
      {
        accept: V.property,
        body: {
          ukProperty: {
            adjustments: {
              balancingCharge:      0,
              privateUseAdjustment: 0,
              businessPremisesRenovationAllowanceBalancingCharges: 0,
              nonResidentLandlord:  false,
              rentARoom:            { jointlyLet: false },
            },
            allowances: {
              annualInvestmentAllowance:     200,
              otherCapitalAllowance:         0,
              costOfReplacingDomesticItems:  150,
              zeroEmissionsCarAllowance:     0,
            },
          },
        },
      });
    await call(results, 'Property – UK Annual Submission (Retrieve)',
      `/individuals/business/property/uk/${nino}/${propertyId}/annual/${TY}`, 'GET', token, fph,
      { accept: V.property });
    await call(results, 'Property – Annual Submission (Delete)',
      `/individuals/business/property/${nino}/${propertyId}/annual/${TY}`, 'DELETE', token, fph,
      { accept: V.property });

    // ── Non-cumulative period summary (≤ 2024-25) ────────────────────────────
    // Kept for coverage, as the SE non-cumulative call is in ../route.ts.
    const created = await call(results, 'Property – UK Period Summary (Create, ≤2024-25)',
      `/individuals/business/property/uk/${nino}/${propertyId}/period/${LEGACY_TY}`, 'POST', token, fph,
      { accept: V.property, body: { fromDate: '2024-04-06', toDate: '2024-07-05', ukNonFhlProperty: ukPeriod } });
    const submissionId = (created as { submissionId?: string })?.submissionId;
    await call(results, 'Property – Period Summaries (List)',
      `/individuals/business/property/${nino}/${propertyId}/period/${LEGACY_TY}`, 'GET', token, fph,
      { accept: V.property });
    if (submissionId) {
      await call(results, 'Property – UK Period Summary (Retrieve)',
        `/individuals/business/property/uk/${nino}/${propertyId}/period/${LEGACY_TY}/${submissionId}`, 'GET', token, fph,
        { accept: V.property });
      await call(results, 'Property – UK Period Summary (Amend)',
        `/individuals/business/property/uk/${nino}/${propertyId}/period/${LEGACY_TY}/${submissionId}`, 'PUT', token, fph,
        { accept: V.property, body: { ukNonFhlProperty: ukPeriod } });
    } else {
      skipped(results, 'Property – UK Period Summary (Retrieve)', 'GET', 'no submissionId from Create');
      skipped(results, 'Property – UK Period Summary (Amend)',    'PUT', 'no submissionId from Create');
    }

    // ════════════════════════════════════════════════════════════════════════
    // Business Source Adjustable Summary (MTD) 7.0
    // ════════════════════════════════════════════════════════════════════════
    // HMRC's order is fixed: trigger a summary to get a calculationId, then
    // retrieve it, then submit adjustments against it. Default (stateless)
    // scenario on purpose — STATEFUL trigger is reported to return
    // RULE_OBLIGATIONS_NOT_MET in the sandbox even with obligations met
    // (hmrc/income-tax-mtd-changelog#484).
    const BSAS = `/individuals/self-assessment/adjustable-summary/${nino}`;
    const accountingPeriod = { startDate: '2025-04-06', endDate: '2026-04-05' };

    await call(results, 'BSAS – List (self-employment)', `${BSAS}/${TY}?businessId=${seId}`, 'GET', token, fph, { accept: V.bsas });
    await call(results, 'BSAS – List (uk-property)',     `${BSAS}/${TY}?typeOfBusiness=uk-property`, 'GET', token, fph, { accept: V.bsas });

    for (const src of [
      { label: 'self-employment', path: 'self-employment', businessId: seId,
        adjust: { income: { turnover: 100 }, expenses: { adminCosts: -20 } } },
      { label: 'uk-property',     path: 'uk-property',     businessId: propertyId,
        adjust: { ukProperty: { income: { totalRentsReceived: 100 }, expenses: { repairsAndMaintenance: -50 } } } },
    ]) {
      const trig = await call(results, `BSAS – Trigger (${src.label})`, `${BSAS}/trigger`, 'POST', token, fph,
        { accept: V.bsas, body: { accountingPeriod, typeOfBusiness: src.label, businessId: src.businessId } });
      const calcId = (trig as { calculationId?: string })?.calculationId;
      if (!calcId) {
        skipped(results, `BSAS – Retrieve (${src.label})`, 'GET',  'no calculationId from Trigger');
        skipped(results, `BSAS – Submit Adjustments (${src.label})`, 'POST', 'no calculationId from Trigger');
        continue;
      }
      await call(results, `BSAS – Retrieve (${src.label})`, `${BSAS}/${src.path}/${calcId}/${TY}`, 'GET', token, fph, { accept: V.bsas });
      await call(results, `BSAS – Submit Adjustments (${src.label})`, `${BSAS}/${src.path}/${calcId}/adjust/${TY}`, 'POST', token, fph,
        { accept: V.bsas, body: src.adjust });
    }

    // ════════════════════════════════════════════════════════════════════════
    // Individual Losses (MTD) 7.0
    // ════════════════════════════════════════════════════════════════════════
    const LOSSES = `/individuals/losses/${nino}`;

    // ── Brought-forward losses ───────────────────────────────────────────────
    const bfl = await call(results, 'Losses – Brought Forward (Create, self-employment)', `${LOSSES}/brought-forward-losses`, 'POST', token, fph,
      { accept: V.losses, body: { taxYearBroughtForwardFrom: LOSS_TY, typeOfLoss: 'self-employment', businessId: seId, lossAmount: 1500 } });
    // A property loss too — the case landlords actually have.
    await call(results, 'Losses – Brought Forward (Create, uk-property)', `${LOSSES}/brought-forward-losses`, 'POST', token, fph,
      { accept: V.losses, body: { taxYearBroughtForwardFrom: LOSS_TY, typeOfLoss: 'uk-property', businessId: propertyId, lossAmount: 2400 } });
    await call(results, 'Losses – Brought Forward (List)', `${LOSSES}/brought-forward-losses/tax-year/${LOSS_TY}`, 'GET', token, fph, { accept: V.losses });
    const lossId = (bfl as { lossId?: string })?.lossId;
    if (lossId) {
      await call(results, 'Losses – Brought Forward (Retrieve)',      `${LOSSES}/brought-forward-losses/${lossId}`, 'GET', token, fph, { accept: V.losses });
      await call(results, 'Losses – Brought Forward (Amend amount)',  `${LOSSES}/brought-forward-losses/${lossId}/change-loss-amount`, 'POST', token, fph,
        { accept: V.losses, body: { lossAmount: 1200 } });
      await call(results, 'Losses – Brought Forward (Delete)',        `${LOSSES}/brought-forward-losses/${lossId}`, 'DELETE', token, fph, { accept: V.losses });
    } else {
      for (const [n, m] of [['Retrieve', 'GET'], ['Amend amount', 'POST'], ['Delete', 'DELETE']] as const) {
        skipped(results, `Losses – Brought Forward (${n})`, m, 'no lossId from Create');
      }
    }

    // ── Loss claims ──────────────────────────────────────────────────────────
    const claim = await call(results, 'Losses – Loss Claim (Create)', `${LOSSES}/loss-claims`, 'POST', token, fph,
      { accept: V.losses, body: { taxYearClaimedFor: LOSS_TY, typeOfLoss: 'self-employment', typeOfClaim: 'carry-forward', businessId: seId } });
    await call(results, 'Losses – Loss Claims (List)', `${LOSSES}/loss-claims/tax-year/${LOSS_TY}`, 'GET', token, fph, { accept: V.losses });
    const claimId = (claim as { claimId?: string })?.claimId;
    if (claimId) {
      await call(results, 'Losses – Loss Claim (Retrieve)',          `${LOSSES}/loss-claims/${claimId}`, 'GET', token, fph, { accept: V.losses });
      await call(results, 'Losses – Loss Claim (Amend type)',        `${LOSSES}/loss-claims/${claimId}/change-type-of-claim`, 'POST', token, fph,
        { accept: V.losses, body: { typeOfClaim: 'carry-sideways' } });
      await call(results, 'Losses – Loss Claims (Amend order)',      `${LOSSES}/loss-claims/claim-type/carry-sideways/tax-year/${LOSS_TY}/change-order`, 'PUT', token, fph,
        { accept: V.losses, body: { listOfLossClaims: [{ claimId, sequence: 1 }] } });
      await call(results, 'Losses – Loss Claim (Delete)',            `${LOSSES}/loss-claims/${claimId}`, 'DELETE', token, fph, { accept: V.losses });
    } else {
      for (const [n, m] of [['Retrieve', 'GET'], ['Amend type', 'POST'], ['Amend order', 'PUT'], ['Delete', 'DELETE']] as const) {
        skipped(results, `Losses – Loss Claim (${n})`, m, 'no claimId from Create');
      }
    }

    const passed = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok && !(r.status === null && (r.error ?? '').startsWith('Skipped'))).length;

    return NextResponse.json({
      summary: `${passed}/${results.length} calls succeeded`,
      passed, failed, total: results.length,
      debug: {
        hmrcEnv:    process.env.HMRC_ENV ?? '(not set)',
        baseUrl:    HARNESS_BASE,
        tokenLen:   token.length,
        tokenStart: token.substring(0, 8),
      },
      context: {
        nino, ninoSource,
        businessId: `SE ${seId} · property ${propertyId}`,
        businessIdSource: propertySource,
        taxYear: `${TY} (losses ${LOSS_TY}) · now ${currentTaxYear()}`,
      },
      results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Unhandled server error: ${msg}` }, { status: 500 });
  }
}

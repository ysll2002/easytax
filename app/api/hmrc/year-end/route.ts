import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { IS_HMRC_PRODUCTION } from '@/lib/hmrc-env';
import { resolveBusinessId } from '@/lib/hmrc-business';
import {
  getValidToken,
  getFinalDeclarationObligations,
  getSelfEmploymentBiss,
  triggerSelfEmploymentBsas,
  getSelfEmploymentBsas,
  submitSelfEmploymentBsasAdjustments,
  listBroughtForwardLosses,
  listLossClaims,
  triggerCalculation,
  getCalculation,
  submitFinalDeclaration,
  type BsasAdjustments,
} from '@/lib/hmrc';

// Year-end (final declaration) for MTD Income Tax.
//
// SANDBOX ONLY. HMRC's production approval of 2026-11-11 covers in-year
// quarterly updates; end-of-year functionality has to be approved separately,
// and BSAS, Individual Losses and BISS are not subscribed in production at
// all. Until that approval exists this route refuses to run against the live
// API, whatever the UI does.
//
// One route, dispatched on `action`, because every step needs the same
// session → NINO → token → businessId resolution.

const TAX_YEAR_RE = /^\d{4}-\d{2}$/;

// Gov-Test-Scenario values accepted from the UI. Anything else is dropped, and
// lib/hmrc.ts drops the header altogether in production.
const SCENARIO_RE = /^[A-Z0-9_]{1,60}$/;

type Body = {
  action?:        string;
  taxYear?:       string;
  calculationId?: string;
  adjustments?:   BsasAdjustments;
  confirmed?:     boolean;
  scenario?:      string;
};

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

/** Run one HMRC lookup and report its failure alongside the others instead of failing the whole overview. */
async function settle<T>(fn: () => Promise<T>): Promise<{ data?: T; error?: string }> {
  try {
    return { data: await fn() };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}

export async function POST(req: NextRequest) {
  if (IS_HMRC_PRODUCTION) {
    return NextResponse.json(
      { error: 'YEAR_END_NOT_AVAILABLE', message: 'Year-end submission is not available in EasyTax yet.' },
      { status: 403 },
    );
  }

  const session = await auth();
  if (!session?.user?.profileId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const profileId = session.user.profileId;

  const body = (await req.json().catch(() => ({}))) as Body;
  const { action, taxYear, calculationId } = body;
  const scenario = body.scenario && SCENARIO_RE.test(body.scenario) ? body.scenario : undefined;

  if (!taxYear || !TAX_YEAR_RE.test(taxYear)) {
    return NextResponse.json({ error: 'Tax year must look like 2025-26.' }, { status: 400 });
  }
  if (calculationId !== undefined && !/^[0-9a-f-]{8,36}$/i.test(calculationId)) {
    return NextResponse.json({ error: 'Invalid calculation ID.' }, { status: 400 });
  }

  const { data: hmrc } = await supabase
    .from('hmrc_connections')
    .select('nino, business_id')
    .eq('user_id', profileId)
    .single();

  // Same sandbox fallback as the other HMRC routes. This route never runs in
  // production (see above), so the test NINO cannot reach the live API.
  const nino = hmrc?.nino ?? 'GW460330D';

  let token: string;
  try {
    token = await getValidToken(profileId);
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 401 });
  }

  const businessId = async () =>
    (await resolveBusinessId(profileId, nino, token, hmrc?.business_id)) ?? 'XAIS12345678910';

  try {
    switch (action) {
      // Everything HMRC already holds for the year, fetched together. Each part
      // fails on its own: a missing API subscription shows as an error on that
      // card, not as a broken page.
      case 'overview': {
        const bid = await businessId();
        const [obligations, biss, broughtForwardLosses, lossClaims] = await Promise.all([
          settle(() => getFinalDeclarationObligations(nino, taxYear, token, scenario)),
          settle(() => getSelfEmploymentBiss(nino, taxYear, bid, token, scenario)),
          settle(() => listBroughtForwardLosses(nino, taxYear, token, scenario)),
          settle(() => listLossClaims(nino, taxYear, token, scenario)),
        ]);
        return NextResponse.json({ businessId: bid, obligations, biss, broughtForwardLosses, lossClaims });
      }

      case 'bsas-trigger': {
        const result = await triggerSelfEmploymentBsas(nino, taxYear, await businessId(), token, scenario);
        return NextResponse.json({ calculationId: result?.calculationId });
      }

      case 'bsas-get': {
        if (!calculationId) return NextResponse.json({ error: 'calculationId is required.' }, { status: 400 });
        return NextResponse.json(await getSelfEmploymentBsas(nino, taxYear, calculationId, token, scenario));
      }

      case 'bsas-adjust': {
        if (!calculationId || !body.adjustments) {
          return NextResponse.json({ error: 'calculationId and adjustments are required.' }, { status: 400 });
        }
        await submitSelfEmploymentBsasAdjustments(nino, taxYear, calculationId, body.adjustments, token, scenario);
        return NextResponse.json({ success: true });
      }

      case 'calc-trigger': {
        const result = await triggerCalculation(nino, taxYear, token, 'intent-to-finalise', scenario);
        return NextResponse.json({ calculationId: result?.calculationId });
      }

      case 'calc-get': {
        if (!calculationId) return NextResponse.json({ error: 'calculationId is required.' }, { status: 400 });
        return NextResponse.json(await getCalculation(nino, taxYear, calculationId, token, scenario));
      }

      case 'declare': {
        if (!calculationId) return NextResponse.json({ error: 'calculationId is required.' }, { status: 400 });
        if (body.confirmed !== true) {
          return NextResponse.json({ error: 'The declaration has to be agreed to before submitting.' }, { status: 400 });
        }

        // Re-read the calculation rather than trusting the browser: it must be
        // an intent-to-finalise calculation, and HMRC must not have reported
        // errors against it.
        const calc = await getCalculation(nino, taxYear, calculationId, token);
        if (calc?.metadata?.intentToSubmitFinalDeclaration !== true) {
          return NextResponse.json({ error: 'This calculation cannot be used for a final declaration. Run the final calculation again.' }, { status: 409 });
        }
        if ((calc?.messages?.errors ?? []).length > 0) {
          return NextResponse.json({ error: 'HMRC reported errors on this calculation. Fix them and run the calculation again.' }, { status: 409 });
        }

        await submitFinalDeclaration(nino, taxYear, calculationId, token, scenario);

        const totalDue = calc?.calculation?.taxCalculation?.totalIncomeTaxAndNicsDue;
        const { error: insertError } = await supabase.from('sa_filings').insert({
          user_id:       profileId,
          tax_year:      taxYear,
          filing_type:   'final_declaration',
          hmrc_response: { calculationId, totalIncomeTaxAndNicsDue: totalDue ?? null, environment: 'sandbox' },
        });
        // HMRC has accepted the declaration at this point, so a failed local
        // record must not be reported to the customer as a failed filing.
        if (insertError) console.warn('[year-end] sa_filings insert failed:', insertError.message);

        return NextResponse.json({ success: true, calculationId, submittedAt: new Date().toISOString() });
      }

      default:
        return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 502 });
  }
}

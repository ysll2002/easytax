import { LOSSES_FROM_TAX_YEAR } from '@/lib/hmrc-eoy/catalog';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { IS_HMRC_PRODUCTION } from '@/lib/hmrc-env';
import { resolveBusinessId } from '@/lib/hmrc-business';
import { eoyContext, EoyError, yearEndApproved } from '@/lib/hmrc-eoy/access';
import {
  getFinalDeclarationObligations,
  getSelfEmploymentBiss,
  triggerSelfEmploymentBsas,
  getSelfEmploymentBsas,
  submitSelfEmploymentBsasAdjustments,
  getLossesAndClaims,
  triggerCalculation,
  getCalculation,
  submitFinalDeclaration,
  type BsasAdjustments,
} from '@/lib/hmrc';

// Year-end (final declaration) for MTD Income Tax.
//
// HMRC's production approval of 2026-11-11 covers in-year quarterly updates;
// end-of-year functionality is approved separately. Until it is, this route
// refuses to run against the live API: set 'year-end' in
// HMRC_PRODUCTION_EOY_APIS once HMRC approves it (lib/hmrc-eoy/access.ts).
//
// Works for the signed-in individual, or with ?clientId= for an agent's
// authorised client. Only a main agent can make a client's final declaration
// (HMRC: supporting agents cannot submit tax returns or view calculations).
//
// Two journeys share the steps:
//   finalise  intent-to-finalise calculation → final-declaration
//   amend     after the return is filed: change the figures, then an
//             intent-to-amend calculation → confirm-amendment
//
// One route, dispatched on `action`, because every step needs the same
// session → NINO → token → businessId resolution.

const TAX_YEAR_RE = /^\d{4}-\d{2}$/;

// Gov-Test-Scenario values accepted from the UI. Anything else is dropped, and
// lib/hmrc.ts drops the header altogether in production.
const SCENARIO_RE = /^[A-Z0-9_]{1,60}$/;

// The scenario picker lists Individual Calculations scenarios, so it is sent
// only to the calculation and final declaration calls. Other APIs reject or
// misread those values.
//
// BSAS retrieve in the sandbox answers 404 by default ("no data found"), even
// straight after a successful trigger, so it is asked for HMRC's
// self-employment examples instead: the unadjusted one before the customer
// adjusts (so the adjustment form is offered), the adjusted profit example
// after.
const SANDBOX_BSAS_BEFORE = 'SELF_EMPLOYMENT_UNADJUSTED';
const SANDBOX_BSAS_AFTER  = 'SELF_EMPLOYMENT_PROFIT';

type Body = {
  action?:        string;
  taxYear?:       string;
  calculationId?: string;
  adjustments?:   BsasAdjustments;
  confirmed?:     boolean;
  // finalise (default) or amend
  mode?:          'finalise' | 'amend';
  scenario?:      string;
  // Sandbox only: HMRC's default test calculation always carries error
  // C95005, so the declaration can be sent anyway to exercise the endpoint.
  sandboxIgnoreErrors?: boolean;
  afterAdjust?:   boolean;
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
  if (!yearEndApproved()) {
    return NextResponse.json(
      { error: 'YEAR_END_NOT_AVAILABLE', message: 'Year-end submission is not available in EasyTax yet.' },
      { status: 403 },
    );
  }

  let ctx;
  try {
    ctx = await eoyContext(req.nextUrl.searchParams.get('clientId'));
  } catch (err) {
    if (err instanceof EoyError) return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    throw err;
  }
  if (ctx.agentType === 'supporting') {
    return NextResponse.json({ error: 'HMRC does not let a supporting agent make a final declaration or see tax calculations. Only the client\'s main agent can.', code: 'SUPPORTING_AGENT' }, { status: 403 });
  }
  const profileId = ctx.profileId;

  const body = (await req.json().catch(() => ({}))) as Body;
  const mode = body.mode === 'amend' ? 'amend' : 'finalise';
  // Never honoured against the live API.
  const ignoreErrors = !IS_HMRC_PRODUCTION && body.sandboxIgnoreErrors === true;
  const { action, taxYear, calculationId } = body;
  const scenario = body.scenario && SCENARIO_RE.test(body.scenario) ? body.scenario : undefined;

  if (!taxYear || !TAX_YEAR_RE.test(taxYear)) {
    return NextResponse.json({ error: 'Tax year must look like 2025-26.' }, { status: 400 });
  }
  if (calculationId !== undefined && !/^[0-9a-f-]{8,36}$/i.test(calculationId)) {
    return NextResponse.json({ error: 'Invalid calculation ID.' }, { status: 400 });
  }

  const { nino, token } = ctx;

  // An agent client's businessId is stored on the client; an individual's on
  // the connection (resolved and stored on first use). The sandbox test
  // business is the fallback in the sandbox only.
  const businessId = async () => {
    const known = ctx.clientId ? ctx.businessId : await resolveBusinessId(profileId, nino, token, ctx.businessId);
    if (known) return known;
    if (IS_HMRC_PRODUCTION) throw new Error('No self-employment business found for this NINO.');
    return 'XAIS12345678910';
  };

  try {
    switch (action) {
      // Everything HMRC already holds for the year, fetched together. Each part
      // fails on its own: a missing API subscription shows as an error on that
      // card, not as a broken page.
      case 'overview': {
        const bid = await businessId();
        const [obligations, biss, losses] = await Promise.all([
          settle(() => getFinalDeclarationObligations(nino, taxYear, token)),
          settle(() => getSelfEmploymentBiss(nino, taxYear, bid, token)),
          // Losses 7.0 starts at 2026-27: for earlier years there is nothing
          // to ask HMRC, and the page says so instead of showing HMRC's 400.
          taxYear >= LOSSES_FROM_TAX_YEAR
            ? settle(() => getLossesAndClaims(nino, bid, taxYear, token))
            : Promise.resolve({ notCovered: true as const }),
        ]);
        return NextResponse.json({ businessId: bid, who: ctx.label, isAgent: ctx.clientId !== null, obligations, biss, losses });
      }

      case 'bsas-trigger': {
        const result = await triggerSelfEmploymentBsas(nino, taxYear, await businessId(), token);
        return NextResponse.json({ calculationId: result?.calculationId });
      }

      case 'bsas-get': {
        if (!calculationId) return NextResponse.json({ error: 'calculationId is required.' }, { status: 400 });
        return NextResponse.json(await getSelfEmploymentBsas(nino, taxYear, calculationId, token, body.afterAdjust ? SANDBOX_BSAS_AFTER : SANDBOX_BSAS_BEFORE));
      }

      case 'bsas-adjust': {
        if (!calculationId || !body.adjustments) {
          return NextResponse.json({ error: 'calculationId and adjustments are required.' }, { status: 400 });
        }
        await submitSelfEmploymentBsasAdjustments(nino, taxYear, calculationId, body.adjustments, token);
        return NextResponse.json({ success: true });
      }

      case 'calc-trigger': {
        const result = await triggerCalculation(nino, taxYear, token, mode === 'amend' ? 'intent-to-amend' : 'intent-to-finalise', scenario);
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
        // the right kind of calculation (intent-to-finalise for a declaration,
        // intent-to-amend for an amendment), and HMRC must not have reported
        // errors against it.
        const calc = await getCalculation(nino, taxYear, calculationId, token);
        const calcType = String(calc?.metadata?.calculationType ?? '');
        const rightKind = mode === 'amend'
          ? calcType === 'intent-to-amend'
          : calc?.metadata?.intentToSubmitFinalDeclaration === true || calcType === 'intent-to-finalise';
        if (!rightKind && !ignoreErrors) {
          return NextResponse.json({ error: mode === 'amend'
            ? 'This calculation cannot be used to confirm an amendment. Run the amendment calculation again.'
            : 'This calculation cannot be used for a final declaration. Run the final calculation again.' }, { status: 409 });
        }
        if ((calc?.messages?.errors ?? []).length > 0 && !ignoreErrors) {
          return NextResponse.json({ error: 'HMRC reported errors on this calculation. Fix them and run the calculation again.' }, { status: 409 });
        }

        await submitFinalDeclaration(nino, taxYear, calculationId, token, scenario, mode === 'amend' ? 'confirm-amendment' : 'final-declaration');

        const totalDue = calc?.calculation?.taxCalculation?.totalIncomeTaxAndNicsDue;
        const { error: insertError } = await supabase.from('sa_filings').insert({
          user_id:       profileId,
          client_id:     ctx.clientId,
          tax_year:      taxYear,
          filing_type:   mode === 'amend' ? 'amendment' : 'final_declaration',
          hmrc_response: {
            calculationId, totalIncomeTaxAndNicsDue: totalDue ?? null,
            environment: IS_HMRC_PRODUCTION ? 'production' : 'sandbox',
            submittedAs: ctx.clientId ? 'agent' : 'individual',
            ignoredErrors: ignoreErrors,
          },
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

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { IS_HMRC_PRODUCTION } from '@/lib/hmrc-env';
import { hmrcRequest } from '@/lib/hmrc';
import { ownerFilter } from '@/lib/records-owner';
import { filedPeriods, inFiledPeriod } from '@/lib/records-lock';
import { ISO_DATE } from '@/lib/records';
import {
  ENDPOINTS, SECTIONS, getEndpoint, buildPath, buildQuery, sectionOf, FILING_CALCULATION_TYPES,
} from '@/lib/hmrc-eoy/catalog';
import { eoyContext, EoyError, supportingAgentMay, productionAllows } from '@/lib/hmrc-eoy/access';
import { recordsEndpoint, buildFromRecords, type PropertyRecord } from '@/lib/hmrc-eoy/property-records';

// The year-end workspace: every endpoint of the end-of-year, property and
// non-business income APIs (lib/hmrc-eoy/catalog.ts), called for the
// signed-in individual or, with ?clientId=, for an agent's authorised client.
//
//   GET                      the catalog, grouped into sections, and whose
//                            return this is
//   POST { endpoint, params, body?, scenario?, records? }
//                            one HMRC call; HMRC's status, correlation ID and
//                            response body are returned as HMRC sent them, so
//                            its error codes and messages reach the customer
//
// The NINO is always the one on the connection or the agent client, never one
// sent by the browser. Property quarterly and period summaries are built from
// the customer's records on the server (lib/hmrc-eoy/property-records.ts);
// figures sent from the browser for those endpoints are ignored. Filing a
// final declaration or confirming an amendment goes through the guided steps
// (/api/hmrc/year-end), which require the declaration to be agreed first.

const MAX_BODY = 200_000;

/** "2024-03-31" → "2023-24": the tax year a date falls in (6 April to 5 April). */
function taxYearOf(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  const start = m > 4 || (m === 4 && d >= 6) ? y : y - 1;
  return `${start}-${String(start + 1).slice(2)}`;
}
const SCENARIO_RE = /^[A-Z0-9_]{1,80}$/;

function fail(err: unknown) {
  if (err instanceof EoyError) return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
  return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await eoyContext(req.nextUrl.searchParams.get('clientId'));
    return NextResponse.json({
      who: { label: ctx.label, agentType: ctx.agentType, businessId: ctx.businessId, isAgent: ctx.clientId !== null },
      sandbox: !IS_HMRC_PRODUCTION,
      sections: SECTIONS.map(s => ({ key: s.key, title: s.title, intro: s.intro, ids: ENDPOINTS.filter(e => sectionOf(e)?.key === s.key).map(e => e.id) })),
      endpoints: ENDPOINTS.map(e => ({
        ...e,
        recordsBuilt: !!recordsEndpoint(e.method, e.path),
        allowed: (ctx.agentType !== 'supporting' || supportingAgentMay(e)) && productionAllows(e),
      })),
    });
  } catch (err) {
    return fail(err);
  }
}

type Body = {
  endpoint?: string;
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  scenario?: string;
  // Records-built property endpoints: which records to add up.
  records?: { fromDate?: string; toDate?: string; periodStart?: string; fhl?: boolean };
  preview?: boolean;
};

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ error: 'That request is too large.' }, { status: 413 });
  let input: Body;
  try { input = JSON.parse(raw || '{}'); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

  const e = input.endpoint ? getEndpoint(input.endpoint) : undefined;
  if (!e) return NextResponse.json({ error: 'Unknown HMRC endpoint.' }, { status: 400 });

  let ctx;
  try { ctx = await eoyContext(req.nextUrl.searchParams.get('clientId')); } catch (err) { return fail(err); }

  if (ctx.agentType === 'supporting' && !supportingAgentMay(e)) {
    return NextResponse.json({ error: 'HMRC does not let a supporting agent use this. Only the client\'s main agent can.', code: 'SUPPORTING_AGENT' }, { status: 403 });
  }

  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.params ?? {})) if (typeof v === 'string') params[k] = v;
  params.nino = ctx.nino;

  if (params.calculationType && (FILING_CALCULATION_TYPES as readonly string[]).includes(params.calculationType)) {
    return NextResponse.json({ error: 'Make the final declaration or confirm an amendment from the guided steps, after agreeing to the declaration.', code: 'USE_DECLARATION' }, { status: 400 });
  }
  if (!productionAllows(e, params.calculationType)) {
    return NextResponse.json({ error: 'EasyTax is not approved by HMRC for this yet.', code: 'NOT_APPROVED' }, { status: 403 });
  }

  const built = buildPath(e, params);
  if ('error' in built) return NextResponse.json({ error: built.error }, { status: 400 });
  const q = buildQuery(e, input.query);
  if ('error' in q) return NextResponse.json({ error: q.error }, { status: 400 });
  const scenario = !IS_HMRC_PRODUCTION && input.scenario && SCENARIO_RE.test(input.scenario) ? input.scenario : undefined;

  // Request body: from the records for records-built endpoints, otherwise
  // what the customer entered in the form.
  let body: unknown;
  let recordIds: string[] = [];
  const rec = recordsEndpoint(e.method, e.path);
  if (rec) {
    const { fromDate, toDate, fhl } = input.records ?? {};
    if (!fromDate || !toDate || !ISO_DATE.test(fromDate) || !ISO_DATE.test(toDate) || fromDate > toDate) {
      return NextResponse.json({ error: 'Choose the period the records are for.' }, { status: 400 });
    }
    const { data, error } = await ownerFilter(
      supabase.from('business_records').select('id, amount, category, property_bucket, property_id, income_source').eq('user_id', ctx.profileId),
      ctx.clientId,
    ).eq('income_source', rec.source).gte('txn_date', fromDate).lte('txn_date', toDate);
    if (error) return NextResponse.json({ error: 'Could not read the records.' }, { status: 500 });
    const out = buildFromRecords(rec.shape, (data ?? []) as PropertyRecord[], { taxYear: params.taxYear, fromDate, toDate, dates: rec.dates, fhl: fhl === true });
    if (input.preview) return NextResponse.json({ preview: true, body: out.body, records: out.recordIds.length, problems: out.problems });
    if (out.problems.length) return NextResponse.json({ error: out.problems.join(' '), code: 'RECORDS_INCOMPLETE' }, { status: 400 });
    body = out.body;
    recordIds = out.recordIds;
  } else if (e.bodies.length > 0) {
    if (!input.body || typeof input.body !== 'object' || Array.isArray(input.body)) {
      return NextResponse.json({ error: 'Fill in the form first.' }, { status: 400 });
    }
    body = input.body;
  }

  let result;
  try {
    result = await hmrcRequest(e.method, built.path + q.qs, ctx.token, { version: e.version, body, scenario });
  } catch (err) {
    return fail(err);
  }

  // A property quarterly (or period) update is a filing: keep the link to the
  // records it was built from, which also locks them (records-lock.ts).
  if (rec?.files && result.ok) {
    const periodStart = input.records?.periodStart && ISO_DATE.test(input.records.periodStart) ? input.records.periodStart : input.records!.fromDate!;
    const periods = await filedPeriods(ctx.profileId, ctx.clientId).catch(() => []);
    if (!inFiledPeriod(input.records!.toDate!, periods, rec.source)) {
      const { error } = await supabase.from('sa_filings').insert({
        user_id:       ctx.profileId,
        client_id:     ctx.clientId,
        tax_year:      params.taxYear ?? taxYearOf(input.records!.toDate!),
        filing_type:   'quarterly',
        income_source: rec.source,
        business_id:   params.businessId ?? null,
        period_start:  periodStart,
        period_end:    input.records!.toDate,
        hmrc_response: { endpoint: e.summary, status: result.status, body: result.body, environment: IS_HMRC_PRODUCTION ? 'production' : 'sandbox' },
        record_ids:    recordIds,
      });
      // HMRC has the update; a failed local record must not read as a failed filing.
      if (error) console.warn('[eoy] sa_filings insert failed:', error.message);
    }
  }

  return NextResponse.json({
    status: result.status, ok: result.ok, correlationId: result.correlationId, body: result.body,
    sent: { method: e.method, path: (built.path + q.qs).replace(ctx.nino, '{nino}'), body: rec ? body : undefined, records: rec ? recordIds.length : undefined },
  });
}

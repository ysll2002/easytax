import { NextRequest, NextResponse } from 'next/server';
import { HMRC_SANDBOX_BASE as SANDBOX } from '@/lib/hmrc-env';
import { SANDBOX_CLIENT_SIMULATION } from '@/lib/agent';
import { agentUserId } from '../_shared';

// Sandbox only: creates HMRC test users so agent mode can be tried end to
// end — an agent (with an Agent Services Account / ARN), an individual
// client (NINO + postcode for the Income Tax request) and a VAT business
// client (VRN + VAT registration date).
async function appToken() {
  const res = await fetch(`${SANDBOX}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: (process.env.HMRC_CLIENT_ID ?? '').trim(),
      client_secret: (process.env.HMRC_CLIENT_SECRET ?? '').trim(),
    }),
  });
  if (!res.ok) throw new Error(`App token failed (${res.status})`);
  return (await res.json()).access_token as string;
}

const KINDS = {
  agent:        { path: 'agents',        services: ['agent-services'] },
  individual:   { path: 'individuals',   services: ['national-insurance', 'self-assessment', 'mtd-income-tax'] },
  organisation: { path: 'organisations', services: ['mtd-vat'] },
} as const;

export async function POST(req: NextRequest) {
  const uid = await agentUserId();
  if (!uid) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  if (!SANDBOX_CLIENT_SIMULATION) return NextResponse.json({ error: 'SANDBOX_ONLY' }, { status: 403 });
  const { kind } = await req.json().catch(() => ({}));
  const k = KINDS[kind as keyof typeof KINDS];
  if (!k) return NextResponse.json({ error: 'INVALID_KIND' }, { status: 400 });

  try {
    const res = await fetch(`${SANDBOX}/create-test-user/${k.path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await appToken()}`, Accept: 'application/vnd.hmrc.1.0+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceNames: k.services }),
    });
    const d = await res.json();
    if (!res.ok) return NextResponse.json({ error: `HMRC ${res.status}`, detail: d }, { status: 502 });
    return NextResponse.json({
      kind,
      userId: d.userId,
      password: d.password,
      name: d.individualDetails ? `${d.individualDetails.firstName} ${d.individualDetails.lastName}` : d.organisationDetails?.name ?? d.userFullName ?? null,
      arn: d.agentServicesAccountNumber ?? null,
      nino: d.nino ?? null,
      postcode: d.individualDetails?.address?.postcode ?? d.organisationDetails?.address?.postcode ?? null,
      vrn: d.vrn ?? null,
      vatRegDate: d.vatRegistrationDate ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}

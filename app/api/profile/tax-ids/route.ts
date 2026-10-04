import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { checkVrn } from '@/lib/vat-number';

// The user's own tax identifiers. Not an HMRC call — this only reads and
// writes our own row, and nothing here talks to test-api.service.hmrc.gov.uk.
//
// `vrn` was added on 2026-09-14. Until then it was read in seven places and
// written in none: no input, no route, no way for any user to supply one. So
// every account except one hand-edited row had `vrn: null`, and the VAT Return
// card on /dashboard/company sat behind a "Requires VRN" badge that nothing in
// the product could ever clear.

export async function GET() {
  const session = await auth();
  // `session?.user?.profileId`, not `!session`. A session object without a
  // user is a state this route hit for real during local testing, and the old
  // check let it through to `session.user.profileId` — which throws, turning
  // an unauthenticated request into a 500 instead of a 401.
  if (!session?.user?.profileId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data } = await supabase
    .from('hmrc_connections')
    .select('nino, vrn')
    .eq('user_id', session.user.profileId)
    .single();

  return NextResponse.json({
    nino: data?.nino ?? '',
    vrn: data?.vrn ?? '',
    user: session.user,
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.profileId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  // Built from the keys the caller actually sent, never from a fixed shape.
  // PostgREST's upsert writes every column in the payload, so including `vrn`
  // unconditionally would blank a saved VAT number on any request that only
  // meant to change the NINO — and the two fields share one form today but
  // need not tomorrow.
  const update: Record<string, string | null> = { user_id: session.user.profileId };
  let warning: string | undefined;
  let storedVrn: string | undefined;

  if ('nino' in body) {
    const nino = typeof body.nino === 'string' ? body.nino.trim().toUpperCase() : '';
    update.nino = nino || null;
  }

  if ('vrn' in body) {
    const checked = checkVrn(typeof body.vrn === 'string' ? body.vrn : '');
    if (!checked.ok) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }
    // Stored normalised — digits only, no GB prefix, no spaces — because that
    // is the form the MTD VAT API wants in its {vrn} path segment. Storing
    // what the user typed would put "GB 220 4302 31" into a URL.
    update.vrn = checked.vrn || null;
    warning = checked.warning;
    storedVrn = checked.vrn;
  }

  const { error } = await supabase
    .from('hmrc_connections')
    .upsert(update, { onConflict: 'user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // The normalised VRN goes back so the form can show what was actually
  // stored: type "GB 220 4302 31", see "220430231" — which is the string that
  // will appear in the {vrn} path segment of every VAT call we make.
  return NextResponse.json({
    success: true,
    ...(storedVrn !== undefined ? { vrn: storedVrn } : {}),
    ...(warning ? { warning } : {}),
  });
}

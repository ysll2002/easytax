import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// GET /api/profile/export — the customer downloads everything EasyTax holds on
// them: profile, tax IDs, HMRC filings, bank connections. Access tokens are
// redacted (they belong to EasyTax's OAuth session, not the customer's own
// records) but every field that represents their business data is included so
// they can migrate elsewhere. Required by the HMRC MTD-ITSA production checklist
// item on customer record ownership + export.
export async function GET() {
  const session = await auth();
  if (!session?.user?.profileId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const profileId = session.user.profileId;

  const [profileRes, hmrcRes, banksRes, filingsRes] = await Promise.all([
    supabase.from('profiles').select('id, name, email, created_at').eq('id', profileId).maybeSingle(),
    supabase.from('hmrc_connections').select('nino, vrn, business_id, connected_at, token_expires_at, adjustments_submitted').eq('user_id', profileId).maybeSingle(),
    supabase.from('bank_connections').select('provider, account_id, account_name, item_id, connected_at').eq('user_id', profileId),
    supabase.from('sa_filings').select('*').eq('user_id', profileId).order('created_at', { ascending: false }),
  ]);

  const bundle = {
    exported_at:  new Date().toISOString(),
    exported_by:  'EasyTax (https://easytax.vip)',
    schema_version: 1,
    notice: 'This file contains every record EasyTax holds on your behalf. OAuth access tokens are omitted intentionally — they are session credentials, not your business data.',
    profile:            profileRes.data ?? null,
    hmrc_connection:    hmrcRes.data ?? null,
    bank_connections:   banksRes.data ?? [],
    sa_filings:         filingsRes.data ?? [],
  };

  const filename = `easytax-export-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(bundle, null, 2), {
    headers: {
      'Content-Type':        'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  });
}

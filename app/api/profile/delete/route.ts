import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// DELETE /api/profile/delete — self-serve account deletion (UK GDPR right to
// erasure). Removes every row EasyTax holds for the signed-in user, in
// dependency order, then the profile itself. The client signs the user out
// afterwards.
//
// Prompted by a real support request ("how to delete easy tax account?",
// 24 Aug 2026) — before this the only route was emailing the founder.

export const runtime = 'nodejs';

const OWNER = 'lilin.gabriel@gmail.com';

async function handler() {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const email = session?.user?.email ?? null;

  // Child tables first. Each is keyed by user_id -> profiles.id.
  const childTables = ['sa_filings', 'bank_connections', 'hmrc_connections', 'launch_waitlist'] as const;
  const failures: string[] = [];

  for (const table of childTables) {
    const { error } = await supabase.from(table).delete().eq('user_id', profileId);
    // launch_waitlist may not exist yet; a missing table is not a reason to
    // block erasure of everything else.
    if (error && !(table === 'launch_waitlist' && /launch_waitlist|does not exist|PGRST205/i.test(`${error.code} ${error.message}`))) {
      failures.push(`${table}: ${error.message}`);
    }
  }

  if (failures.length > 0) {
    console.error('[account-delete] child deletes failed', { profileId, failures });
    return NextResponse.json({ error: 'Could not delete all of your data. Please email hello@easytax.vip and we will finish this by hand.', code: 'partial_failure' }, { status: 500 });
  }

  const { error: profileErr } = await supabase.from('profiles').delete().eq('id', profileId);
  if (profileErr) {
    console.error('[account-delete] profile delete failed', { profileId, message: profileErr.message });
    return NextResponse.json({ error: 'Could not delete your profile. Please email hello@easytax.vip and we will finish this by hand.', code: 'profile_failed' }, { status: 500 });
  }

  // Let the data controller know an erasure happened (needed for the GDPR
  // records-of-processing log). Fire and forget.
  new Resend(process.env.RESEND_API_KEY).emails.send({
    from: 'EasyTax <hello@easytax.vip>',
    to: OWNER,
    subject: 'Account deleted (self-serve) · EasyTax',
    text: `A user deleted their EasyTax account via Settings.\n\nProfile ID: ${profileId}\nEmail: ${email ?? '(unknown)'}\nDeleted at: ${new Date().toISOString()}\n\nRows removed from: sa_filings, bank_connections, hmrc_connections, launch_waitlist, profiles.\nIf a Plaid item was linked, remove it from the Plaid dashboard to stop billing.`,
  }).catch(err => console.error('[account-delete] owner notification failed', err));

  return NextResponse.json({ ok: true });
}

export { handler as DELETE, handler as POST };

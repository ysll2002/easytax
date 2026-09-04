import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// Shared by the one-click POST handler (app/api/unsubscribe) and the
// confirmation page (app/unsubscribe). Lives here rather than in either of
// them so the page does not have to import from a route module.

export type OptOutResult = { ok: boolean; reason?: 'not_configured' | 'error' | 'invalid' };

/**
 * Marks an address opted out of marketing email.
 *
 * Idempotent: unsubscribing an address that is already unsubscribed — or one
 * that has no account at all — is a success. One-click senders retry on
 * failure, and a second click must not surface an error to the recipient.
 */
export async function optOut(email: string): Promise<OptOutResult> {
  const address = email.trim().toLowerCase();
  if (!address) return { ok: false, reason: 'invalid' };

  const { error } = await supabase
    .from('profiles')
    .update({ reminder_opt_out: true })
    .ilike('email', address);

  if (error) {
    // 42703 / PGRST204 = column does not exist, i.e. the 20260904 migration
    // has not been run yet.
    if (error.code === '42703' || error.code === 'PGRST204') {
      console.error(
        '[unsubscribe] profiles.reminder_opt_out missing — run supabase/migrations/20260904_email_compliance.sql',
      );
      return { ok: false, reason: 'not_configured' };
    }
    console.error('[unsubscribe] failed to record opt-out', error);
    return { ok: false, reason: 'error' };
  }

  // Also drop them from the launch announcement list, so one click means one
  // decision rather than "you unsubscribed from A but still get B". A failure
  // here must not fail the opt-out that already succeeded.
  const { error: launchError } = await supabase
    .from('launch_subscribers')
    .delete()
    .ilike('email', address);
  if (launchError) {
    console.error('[unsubscribe] could not remove from launch list', launchError);
  }

  return { ok: true };
}

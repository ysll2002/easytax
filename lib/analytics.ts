import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// Server-side event recording.
//
// Every function here is fail-soft on purpose: analytics must never be able to
// break a page render or fail a signup. If the table has not been created yet
// (see supabase/migrations/20260903_growth_instrumentation.sql) or Supabase is
// unreachable, we log once and carry on.

export type AnalyticsEvent = {
  name: string;
  userId?: string | null;
  anonId?: string | null;
  path?: string | null;
  referrer?: string | null;
  utm?: { source?: string | null; medium?: string | null; campaign?: string | null };
  props?: Record<string, unknown>;
};

/** Event names used across the app. Keeping them in one place stops the
 *  funnel query in /api/admin/daily-metrics from silently drifting out of sync
 *  with the call sites. */
export const EVENTS = {
  pageView:            'page_view',
  registerStarted:     'register_started',
  registerCompleted:   'register_completed',
  launchSubscribed:    'launch_subscribed',
  trustViewed:         'trust_viewed',
  activationCtaClick:  'activation_cta_click',
  articleCtaClick:     'article_cta_click',
} as const;

let warned = false;

function warnOnce(message: string) {
  if (warned) return;
  warned = true;
  console.warn(`[analytics] disabled: ${message}`);
}

// Supabase reports an unknown table as PGRST205 (schema cache) or 42P01
// (Postgres undefined_table) depending on which layer rejects it. Either means
// "migration not run yet", which is expected between deploy and migration.
const MISSING_TABLE = new Set(['PGRST205', '42P01']);

export async function track(event: AnalyticsEvent): Promise<void> {
  try {
    const { error } = await supabase.from('analytics_events').insert({
      name:         event.name,
      user_id:      event.userId  ?? null,
      anon_id:      event.anonId  ?? null,
      path:         event.path    ?? null,
      referrer:     event.referrer ?? null,
      utm_source:   event.utm?.source   ?? null,
      utm_medium:   event.utm?.medium   ?? null,
      utm_campaign: event.utm?.campaign ?? null,
      props: {
        ...(event.props ?? {}),
        // Stamped here rather than at the call site so that *every* event —
        // client beacons and server-side conversions alike — carries it. The
        // funnel in /api/admin/daily-metrics counts only env='production',
        // so an unstamped event would silently vanish from the numbers.
        env: process.env.VERCEL_ENV ?? 'development',
      },
    });
    if (error) {
      if (MISSING_TABLE.has(error.code ?? '')) {
        warnOnce('analytics_events table not found — run the 20260903 migration');
      } else {
        warnOnce(`insert failed (${error.code}): ${error.message}`);
      }
    }
  } catch (err) {
    warnOnce(err instanceof Error ? err.message : String(err));
  }
}

/** Fire-and-forget wrapper for call sites that must not await (route handlers
 *  on the critical path, e.g. registration). */
export function trackAsync(event: AnalyticsEvent): void {
  void track(event).catch(() => {});
}

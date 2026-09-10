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
  checkerStarted:      'checker_started',
  checkerCompleted:    'checker_completed',
  // Free tools. The specific tool travels in props.tool, not in the name.
  toolsHubViewed:      'tools_hub_viewed',
  toolStarted:         'tool_started',
  toolCompleted:       'tool_completed',
  toolCtaClick:        'tool_cta_click',
  topicHubViewed:      'topic_hub_viewed',
  editorialViewed:     'editorial_standards_viewed',
  // Deadline-schedule capture. The address is given for something deliverable
  // today, so it is counted separately from the plain launch waitlist.
  scheduleRequested:   'schedule_requested',
  scheduleSent:        'schedule_sent',
  // Recorded server-side by the .ics route. Not in /api/track's allowlist on
  // purpose: nothing in the browser should be able to forge a subscription.
  calendarFetched:     'calendar_fetched',
  calendarCtaClick:    'calendar_cta_click',
  // Distribution: the four ways a page of ours can end up somewhere else.
  // The click on a share control, and the copy of a result link. Both carry
  // props.tool and props.channel; neither ever carries the figures, which are
  // in the shared URL only because the reader put them there.
  shareClick:          'share_click',
  shareCopy:           'share_copy',
  // Server-side, from the Open Graph route a shared result link points at. A
  // hit is a platform scraping the card, which is the closest thing we get to
  // proof that a link was actually posted somewhere.
  shareCardServed:     'share_card_served',
  // Server-side, from /embed/*. props.host is the site doing the embedding —
  // in other words, a backlink, detected by us rather than waited for from
  // Search Console.
  embedServed:         'embed_served',
  // Server-side, from the RSS/JSON feeds. A repeating fetch from the same
  // reader user-agent is a subscription.
  feedFetched:         'feed_fetched',
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

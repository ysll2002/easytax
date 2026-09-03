'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Records a page_view into analytics_events on every client-side navigation.
//
// This runs alongside GA rather than replacing it. GA is fine for a human
// looking at a dashboard, but it cannot be queried from the server, so the
// daily agent has no way to read it. These rows can be joined against
// profiles / hmrc_connections to compute an actual funnel.

const ANON_KEY = 'et_anon_id';
const UTM_KEY  = 'et_utm';

/** Stable per-browser id kept in localStorage. Random, not derived from
 *  anything about the device, and never sent anywhere but our own /api/track. */
function getAnonId(): string | null {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    // Private mode / storage blocked. Events still record, just unstitched.
    return null;
  }
}

/** Exposed so server-recorded conversions (registration) can carry the same id
 *  as the anonymous page views that led to them. */
export function getStoredAnonId(): string | null {
  return getAnonId();
}

type Utm = { utmSource?: string; utmMedium?: string; utmCampaign?: string };

/** UTM params only appear on the landing hit, but the conversion happens
 *  several navigations later — so stash them for the rest of the session and
 *  attach them to every event. Without this, every signup looks like direct
 *  traffic and no channel can be credited. */
function resolveUtm(params: URLSearchParams): Utm {
  const fresh: Utm = {};
  const source   = params.get('utm_source');
  const medium   = params.get('utm_medium');
  const campaign = params.get('utm_campaign');
  if (source)   fresh.utmSource   = source;
  if (medium)   fresh.utmMedium   = medium;
  if (campaign) fresh.utmCampaign = campaign;

  try {
    if (Object.keys(fresh).length > 0) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const stored = sessionStorage.getItem(UTM_KEY);
    return stored ? (JSON.parse(stored) as Utm) : {};
  } catch {
    return fresh;
  }
}

export function trackClient(name: string, props: Record<string, unknown> = {}) {
  try {
    const payload = JSON.stringify({
      name,
      anonId:   getAnonId(),
      path:     window.location.pathname,
      referrer: document.referrer || null,
      ...resolveUtm(new URLSearchParams(window.location.search)),
      props,
    });

    // sendBeacon survives the page unloading, which matters for the CTA clicks
    // that navigate away immediately. It is unavailable in a few browsers, so
    // fall back to keepalive fetch.
    if (!navigator.sendBeacon?.(  '/api/track', new Blob([payload], { type: 'application/json' }))) {
      void fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Analytics must never surface an error to the visitor.
  }
}

export default function PageViewTracker() {
  // Deliberately not using useSearchParams: it opts the whole tree out of
  // static rendering unless wrapped in Suspense, and trackClient already reads
  // the live query string off window.location.
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    // StrictMode mounts effects twice in dev; without this the first view of
    // every page is counted twice.
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    trackClient('page_view');
  }, [pathname]);

  return null;
}

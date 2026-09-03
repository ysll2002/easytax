'use client';

import { useEffect, useRef } from 'react';
import { trackClient } from './PageViewTracker';

/** Fires a named event once when a server-rendered page mounts.
 *
 *  page_view already records the path, but naming the event separately keeps
 *  the funnel query in /api/admin/daily-metrics a simple count-by-name instead
 *  of a path match that breaks the moment a route is renamed. */
export default function TrackEvent({
  name,
  props,
}: {
  name: string;
  props?: Record<string, unknown>;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return; // StrictMode double-mount guard
    fired.current = true;
    trackClient(name, props ?? {});
  }, [name, props]);

  return null;
}

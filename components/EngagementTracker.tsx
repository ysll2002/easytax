'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackClient } from '@/components/PageViewTracker';
import { isEmbedPath } from '@/lib/embed';

// Did anybody actually read anything?
//
// The question this exists to answer, and why nothing else can. Bot labelling
// went live on 2026-09-11. In the two days to 2026-09-13, 36 production events
// carried a verdict: 29 automation, 7 human. All seven human events were
// `page_view` on `/`. Five of the seven had no referrer at all. Not one reached
// an article, a tool, a topic hub or a second page of any kind.
//
// Two stories fit that data exactly and they imply opposite work:
//
//   1. Three or four people a day arrive, find nothing worth clicking, and
//      leave. The site's problem is what is on the homepage.
//   2. Three or four automated clients a day arrive with a browser User-Agent,
//      render the page, and leave — because that is all they ever do. The
//      site's problem is that it has no human traffic at all, and four rounds
//      of on-site work have been tuning a page nobody has seen.
//
// Every number this project currently has is identical under both. And the
// difference decides whether the next month goes into the site or into getting
// anybody to it — which is the single largest open question in the project.
//
// The distinguishing evidence is behaviour that a headless client rendering a
// page does not produce: scrolling, staying, moving a pointer, pressing a key.
// A crawler executing our JavaScript fires `page_view` identically to a reader.
// It does not scroll to 50% and sit there for fifteen seconds.
//
// Design rules, in the order they mattered:
//
//   - **One event per page view, at most.** This runs on every page; a scroll
//     handler that beacons per frame would be a self-inflicted denial of
//     service on the events table.
//   - **Passive listeners, no layout reads in the handler.** `scrollY` and
//     `innerHeight` only, compared against a height captured on mount. Nothing
//     here may cost a reader a frame.
//   - **Report what happened, not a verdict.** The event carries depth, dwell
//     and which signals fired, rather than a boolean "engaged". A threshold
//     baked into the client is a threshold that cannot be revisited once the
//     data is in, and this measurement exists precisely because we do not yet
//     know where the line is.
//   - **No identifiers beyond the existing anon id.** Depth, seconds and three
//     booleans. Nothing about the device, nothing that narrows who this was.

/** Fraction of the scrollable page that counts as having read into it. */
const DEPTH_THRESHOLD = 0.5;

/** Seconds on the page that count as having stayed. */
const DWELL_SECONDS = 15;

/** A page shorter than the viewport can never reach DEPTH_THRESHOLD by
 *  scrolling, so on those depth is reported as 1 and the dwell and interaction
 *  signals carry the decision. Without this every mobile-height page would
 *  report 0% depth forever and look like a bounce. */
function scrollDepth(): number {
  const doc = document.documentElement;
  const scrollable = doc.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return 1;
  return Math.min(1, Math.max(0, window.scrollY / scrollable));
}

export default function EngagementTracker() {
  const pathname = usePathname();
  // Held in refs rather than state: none of this may cause a re-render, and a
  // state update per scroll event would be the exact cost this is avoiding.
  const sent = useRef(false);
  const maxDepth = useRef(0);
  const interacted = useRef(false);
  const startedAt = useRef(0);

  useEffect(() => {
    // A widget inside someone else's page is not a visit here, and the
    // page-view tracker excludes it for the same reason.
    if (isEmbedPath(pathname)) return;

    sent.current = false;
    maxDepth.current = 0;
    interacted.current = false;
    startedAt.current = Date.now();

    const onScroll = () => {
      const d = scrollDepth();
      if (d > maxDepth.current) maxDepth.current = d;
    };
    const onInteract = () => {
      interacted.current = true;
    };

    // Sent the moment any one signal is met, rather than held until the page
    // unloads.
    //
    // The first version waited: a timer at 15 seconds that only fired if the
    // reader had *also* scrolled or clicked, and otherwise an unload beacon.
    // Driving a real Chromium through it showed that lost two of the three
    // cases worth catching. Somebody who stayed sixteen seconds without
    // scrolling produced nothing, because the timer's own condition excluded
    // the signal the timer exists to measure. Somebody who clicked and left
    // after three seconds produced nothing either, because a click is
    // decisive at the moment it happens and the code was saving it for an
    // unload that a closing tab does not reliably deliver.
    //
    // Both are exactly the readers this is meant to distinguish from a
    // crawler, so: whichever signal lands first sends, `reason` records which
    // one it was, and `sent` keeps it to one event per view. A crawler that
    // renders and leaves inside a second still produces nothing, which is the
    // discrimination the whole thing is for.
    const send = (reason: 'interaction' | 'scroll' | 'dwell' | 'leaving') => {
      if (sent.current) return;
      const dwell = Math.round((Date.now() - startedAt.current) / 1000);
      const depth = Math.max(maxDepth.current, scrollDepth());
      const deep = depth >= DEPTH_THRESHOLD;
      const stayed = dwell >= DWELL_SECONDS;

      // On the way out, only report a visit that showed something. A beacon on
      // every page unload would double the size of the events table to record
      // that nothing happened, which the absence of the event already says.
      if (reason === 'leaving' && !deep && !stayed && !interacted.current) return;

      sent.current = true;
      trackClient('page_engaged', {
        // Percent rather than a fraction: it reads correctly in a SQL average
        // and in the metrics payload without anyone having to remember a unit.
        depth_pct: Math.round(depth * 100),
        // Seconds elapsed when the signal fired — NOT time on page. Because
        // the event is sent the moment the first signal lands, a reader who
        // scrolls at second two and then reads for five minutes reports 2.
        // That is the cost of not depending on an unload beacon, and it is
        // the right trade: a reliable lower bound beats an accurate number
        // that is frequently missing. Read it as "engaged by second N", and
        // do not average it as dwell time.
        dwell_seconds: dwell,
        scrolled: deep,
        stayed,
        interacted: interacted.current,
        reason,
      });
    };

    const onScrollSignal = () => {
      onScroll();
      if (maxDepth.current >= DEPTH_THRESHOLD) send('scroll');
    };
    const onInteractSignal = () => {
      onInteract();
      send('interaction');
    };

    // Reaching this at all means the page was open for DWELL_SECONDS. The
    // visibility check is what stops a tab opened in the background and never
    // looked at from counting as a read.
    const timer = window.setTimeout(() => {
      if (document.visibilityState === 'visible' || interacted.current) send('dwell');
    }, DWELL_SECONDS * 1000);

    const onHide = () => {
      if (document.visibilityState === 'hidden') send('leaving');
    };

    window.addEventListener('scroll', onScrollSignal, { passive: true });
    window.addEventListener('pointerdown', onInteractSignal, { passive: true });
    window.addEventListener('keydown', onInteractSignal, { passive: true });
    // `visibilitychange` rather than `unload`: it is the only one that fires
    // reliably on mobile Safari, where a backgrounded tab may never unload.
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScrollSignal);
      window.removeEventListener('pointerdown', onInteractSignal);
      window.removeEventListener('keydown', onInteractSignal);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
      // A client-side navigation away is a departure like any other, and the
      // most common one on a site that routes with Next's router.
      send('leaving');
    };
  }, [pathname]);

  return null;
}

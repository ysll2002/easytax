'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { trackClient } from './PageViewTracker';

/**
 * An internal link that records which placement produced the click.
 *
 * Every call to date has been written inline — MtdStatusBar has its own
 * `onClick={() => trackClient('activation_cta_click', { placement: … })}`, and
 * the homepage hero had no instrumentation at all. The homepage is 39% of all
 * production page views and, until now, the only thing it could tell us about
 * those visitors was that they arrived.
 *
 * `placement` is the whole point: `activation_cta_click` counted in aggregate
 * cannot say which button on which page earned the visit, which is the only
 * form of the number that can settle an argument about page layout.
 */
export default function TrackedCta({
  href,
  placement,
  event = 'activation_cta_click',
  className,
  style,
  children,
}: {
  href: string;
  /** Where on the site this control lives, e.g. 'home_hero_secondary'. */
  placement: string;
  /** Override for controls that are not activation, e.g. 'tool_cta_click'. */
  event?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      style={style}
      onClick={() => trackClient(event, { placement, href })}
    >
      {children}
    </Link>
  );
}

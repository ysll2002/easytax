// The embeddable widget, described in one place.
//
// Why the site has one at all: after four growth rounds the honest conclusion
// in GROWTH_2026-09-08 was that the remaining constraint is off-site — "getting
// linked from somewhere else, which is the one thing that cannot be done from
// inside this repository". That is nearly true, but not quite. What *can* be
// done from inside the repository is to build something another site wants to
// put on its own page, and to make the terms of doing so a visible attribution
// link back here.
//
// The audience is specific: accountants, bookkeepers and membership bodies who
// write for UK sole traders and already have to answer "when is my next
// quarterly update due?" on their own sites. A dated sentence goes stale four
// times a year; an iframe does not. That asymmetry is the whole offer.

/** The one embeddable route, today. Kept as a prefix so a second widget does
 *  not mean revisiting the framing headers, the tracker and the chat widget. */
export const EMBED_PREFIX = '/embed';

export function isEmbedPath(pathname: string | null | undefined): boolean {
  return !!pathname && (pathname === EMBED_PREFIX || pathname.startsWith(`${EMBED_PREFIX}/`));
}

export const DEADLINE_EMBED_PATH = `${EMBED_PREFIX}/mtd-deadline`;

/** Height that fits the widget's tallest state — mandate live, with a quarter
 *  name, a date and a day count — without an internal scrollbar. */
export const DEADLINE_EMBED_HEIGHT = 190;

/**
 * The snippet we ask people to paste.
 *
 * `title` is not decoration: an iframe without one is an unlabelled frame to a
 * screen reader, and an accountant's site that fails an accessibility audit
 * because of our widget will remove our widget.
 */
export function deadlineEmbedSnippet(origin: string): string {
  return `<iframe
  src="${origin}${DEADLINE_EMBED_PATH}"
  title="Next Making Tax Digital quarterly update deadline"
  width="100%"
  height="${DEADLINE_EMBED_HEIGHT}"
  style="border:1px solid #DDD5C8;border-radius:16px;max-width:560px"
  loading="lazy"
></iframe>`;
}

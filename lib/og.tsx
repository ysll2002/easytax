import { ImageResponse } from 'next/og';

// The social card, rendered once and shared by every route that needs one.
//
// Why this file exists: `app/layout.tsx` declared `openGraph.images` and
// `twitter.images` as `/og-image.png` — a file that has never existed in
// `public/`. Every page on the site therefore advertised a 1200×630 preview
// image at a URL that returns 404. Four growth rounds have been spent trying to
// earn links to this site, and every link any of them earned rendered as a bare
// text row in Slack, WhatsApp, X, LinkedIn, Discord and Google Discover.
//
// Generating the card instead of shipping a PNG matters for a second reason:
// the interesting cards are not static. An article's card should carry the
// article's headline; a shared calculator result should carry the number. A
// file in `public/` can do neither.

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = 'image/png';

// Straight from globals.css / the calculator surfaces, so a card and the page
// it links to are recognisably the same product.
const CREAM = '#FDFCF8';
const PANEL = '#F0EBE1';
const INK = '#1C1208';
const MUTED = '#8A7F73';
const RULE = '#DDD5C8';
const ACCENT = '#C4622D';

export interface OgCardOptions {
  /** Small line above the headline — section, tool name, or category. */
  eyebrow: string;
  /** The headline. Long values are clamped rather than overflowing. */
  title: string;
  /** One supporting line under the headline. Optional. */
  subtitle?: string;
  /**
   * The number the card exists to show — a penalty total, a days-remaining
   * count. Rendered large, to the right of the headline.
   */
  figure?: { value: string; caption: string };
  /** Bottom-right line. Defaults to the domain. */
  footnote?: string;
}

/** Hard-clamp text so an unexpectedly long title degrades to an ellipsis
 *  rather than pushing the layout off the canvas. Satori has no `line-clamp`,
 *  so the clamp has to happen before layout. */
function clamp(s: string, max: number): string {
  const t = s.trim().replace(/\s+/g, ' ');
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Build the card.
 *
 * Every element carries an explicit `display: flex`: Satori (the renderer
 * behind ImageResponse) throws on a `<div>` with more than one child unless
 * the display mode is stated, and the failure surfaces as a 500 on the image
 * URL rather than anything visible in review.
 */
export function renderOgCard(opts: OgCardOptions): ImageResponse {
  const { eyebrow, title, subtitle, figure, footnote } = opts;

  // With a figure alongside it, the headline gets roughly half the width, so
  // it has to be both shorter and smaller.
  const titleText = clamp(title, figure ? 68 : 104);
  const base = titleText.length > 76 ? 52 : titleText.length > 46 ? 60 : 68;
  // A figure box takes roughly a third of the width, so the headline wraps
  // sooner and a 68px setting runs into four lines and out of the canvas.
  const titleSize = figure ? Math.min(base, 54) : base;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: CREAM,
          padding: '64px 72px',
          // A single accent edge, so the card is identifiable at thumbnail size
          // in a feed where it is 200px wide.
          borderTop: `16px solid ${ACCENT}`,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: ACCENT,
              fontWeight: 600,
            }}
          >
            {clamp(eyebrow, 46)}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 28, gap: 48 }}>
            <div
              style={{
                display: 'flex',
                flex: 1,
                fontSize: titleSize,
                lineHeight: 1.14,
                color: INK,
                fontWeight: 700,
              }}
            >
              {titleText}
            </div>

            {figure && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  backgroundColor: PANEL,
                  border: `1px solid ${RULE}`,
                  borderRadius: 24,
                  padding: '24px 32px',
                }}
              >
                <div style={{ display: 'flex', fontSize: 76, fontWeight: 700, color: ACCENT }}>
                  {clamp(figure.value, 12)}
                </div>
                <div style={{ display: 'flex', fontSize: 24, color: MUTED, marginTop: 6 }}>
                  {clamp(figure.caption, 28)}
                </div>
              </div>
            )}
          </div>

          {subtitle && (
            <div
              style={{
                display: 'flex',
                marginTop: 28,
                // A third line of subtitle only fits if it is set smaller, and
                // a subtitle that ends in "…" mid-clause reads as a bug on a
                // card whose whole job is to look deliberate.
                fontSize: subtitle.length > 104 ? 27 : 30,
                lineHeight: 1.4,
                color: MUTED,
              }}
            >
              {clamp(subtitle, figure ? 136 : 168)}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${RULE}`,
            paddingTop: 28,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, color: INK }}>
              EasyTax
            </div>
            <div style={{ display: 'flex', fontSize: 24, color: MUTED }}>
              MTD ITSA software for the UK
            </div>
          </div>
          <div style={{ display: 'flex', fontSize: 24, color: MUTED }}>
            {footnote ?? 'easytax.vip'}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}

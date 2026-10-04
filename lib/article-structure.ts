// Making an article addressable.
//
// The problem this solves, from the 2026-09-12 read of the analytics table.
// The archive is 113 published pages and it earns roughly one search-referred
// visit a day — ten in nine days, and none at all in the last seventy-two
// hours. Meanwhile the crawlers that *are* reading it are answer engines:
// ClaudeBot, GPTBot, PerplexityBot and meta-externalagent between them fetched
// the feeds, the calendar and the topic hubs twenty times in forty-eight
// hours, and meta-externalagent was pulling article bodies directly.
//
// Both audiences want the same thing and neither can currently get it. A
// 4,300-character article here is one undifferentiated block: its `<h2>`s carry
// no `id`, so there is no URL that points at the paragraph answering a
// question, nothing for Google to build a "jump to" link from, and nothing for
// a model to cite more precisely than the whole page. Adding the anchors is a
// render-time transform over markup we already sanitised on the way in.
//
// The FAQ half is deliberately narrower than it could be. Google's structured
// data policy wants FAQPage used for genuine question-and-answer content, and
// a manual action for marking up prose is a real cost to a site whose entire
// pitch is that it is trustworthy about tax. A heading is treated as a question
// only when it ends in a question mark. Measured over the corpus that is 146
// headings across 41 of the 113 articles — against 336 if headings merely
// *starting* with "what" or "why" counted, which would have swept in "Why the
// Timing of Income Matters More Than Ever" and "What HMRC Typically Accepts".
// Those are section titles, not questions, and claiming otherwise in markup is
// exactly the thing the policy is about. A third of the archive marked up
// honestly beats all of it marked up wrongly.

/** Heading levels we anchor. `h1` is the page title, rendered outside the body
 *  HTML; `h4` and below do not appear in what the cron writes. */
const HEADING_RE = /<(h[23])\b[^>]*>([\s\S]*?)<\/\1\s*>/gi;

export type ArticleHeading = {
  id: string;
  text: string;
  level: 2 | 3;
  isQuestion: boolean;
};

export type FaqPair = { question: string; answer: string };

/** Tags to text, entities decoded, whitespace collapsed. Used for heading
 *  labels and FAQ answers, both of which must be plain text. */
function toText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A URL fragment from a heading.
 *
 * Restricted to `[a-z0-9-]` rather than escaped, because the result is
 * interpolated into an `id` attribute and into an `href`. There is no quoting
 * to get wrong if the character set cannot contain a quote, an angle bracket or
 * a space in the first place.
 */
export function headingSlug(text: string): string {
  return (
    toText(text)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60)
      .replace(/^-+|-+$/g, '') || 'section'
  );
}

/** A heading is a question when it says so. See the note at the top of this
 *  file for why the looser test was rejected. */
export function isQuestionHeading(text: string): boolean {
  return toText(text).endsWith('?');
}

/**
 * Reads the headings out of an article body, with the ids `withHeadingIds`
 * will give them.
 *
 * Duplicate slugs are suffixed rather than deduplicated: two sections called
 * "A Practical Example" are two different places in the page, and collapsing
 * them would make one of the two contents links go to the wrong one. The
 * numbering here and in `withHeadingIds` walks the document in the same order
 * from the same regex, so the two agree by construction.
 */
export function extractHeadings(html: string): ArticleHeading[] {
  const seen = new Map<string, number>();
  const out: ArticleHeading[] = [];

  for (const m of html.matchAll(HEADING_RE)) {
    const text = toText(m[2]);
    if (!text) continue;
    const base = headingSlug(text);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    out.push({
      id: n === 0 ? base : `${base}-${n + 1}`,
      text,
      level: m[1].toLowerCase() === 'h3' ? 3 : 2,
      isQuestion: isQuestionHeading(text),
    });
  }

  return out;
}

/**
 * Rewrites the body so every heading carries its id.
 *
 * The input has already been through `sanitiseArticleHtml`, which strips every
 * attribute from every tag — so the heading tags reaching this function have no
 * attributes to preserve or to collide with, and the id we add is the only one
 * there. The value comes from `headingSlug`, whose output cannot contain a
 * quote, so the attribute cannot be broken out of.
 */
export function withHeadingIds(html: string): string {
  const seen = new Map<string, number>();

  return html.replace(HEADING_RE, (_match, tag: string, inner: string) => {
    const text = toText(inner);
    const level = tag.toLowerCase();
    if (!text) return `<${level}>${inner}</${level}>`;
    const base = headingSlug(text);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    const id = n === 0 ? base : `${base}-${n + 1}`;
    return `<${level} id="${id}">${inner}</${level}>`;
  });
}

/** How much of the answer goes into the structured data. Long enough to be a
 *  real answer, short enough that the markup is not a copy of the page. */
const MAX_ANSWER_CHARS = 620;

/**
 * Question-and-answer pairs, for FAQPage.
 *
 * The answer is the text between a question heading and the next heading of
 * any level — which is precisely the content that heading introduces. A
 * question with nothing under it is dropped rather than given an empty answer:
 * an FAQPage entry with a blank acceptedAnswer is invalid markup and would cost
 * the whole block.
 */
export function extractFaq(html: string): FaqPair[] {
  const matches = [...html.matchAll(HEADING_RE)];
  const pairs: FaqPair[] = [];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const question = toText(m[2]);
    if (!isQuestionHeading(question)) continue;

    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? html.length) : html.length;
    const answer = toText(html.slice(start, end));
    if (answer.length < 40) continue;

    pairs.push({
      question,
      answer:
        answer.length > MAX_ANSWER_CHARS
          ? `${answer.slice(0, MAX_ANSWER_CHARS).replace(/\s+\S*$/, '')}…`
          : answer,
    });
  }

  return pairs;
}

/** Below this the block is not an FAQ, it is an article that happens to ask a
 *  question once. Google's own guidance is that the page should read as a list
 *  of questions and answers. */
export const MIN_FAQ_PAIRS = 2;

/**
 * FAQPage JSON-LD, or null when the article does not genuinely qualify.
 *
 * Returning null rather than an empty FAQPage matters: an `mainEntity: []` is
 * an assertion that the page is an FAQ with no questions on it, which is both
 * invalid and untrue.
 */
export function faqJsonLd(html: string, pageUrl: string): Record<string, unknown> | null {
  const pairs = extractFaq(html);
  if (pairs.length < MIN_FAQ_PAIRS) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    inLanguage: 'en-GB',
    mainEntity: pairs.map(p => ({
      '@type': 'Question',
      name: p.question,
      acceptedAnswer: { '@type': 'Answer', text: p.answer },
    })),
  };
}

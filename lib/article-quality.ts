// Quality gate for generated articles.
//
// Why this exists, in one number: the archive is 114 articles and every single
// one is between 573 and 724 words. That band is not what UK tax writing looks
// like — it is the signature of one prompt saying "500-700 words" with
// `max_tokens: 1500` capping the response, repeated 114 times. One of the 114
// cites a source. None contains a table. Together they earned six organic
// search visits in the six days we have measured.
//
// Google's guidance on scaled content abuse is explicit that volume produced
// without added value is the thing being demoted, so 114 uniform stubs are not
// an asset that needs more siblings — they are the liability. The fix is a
// standard enforced in code rather than requested in a prompt, because a prompt
// is a preference and a validator is a rule.
//
// Nothing here judges whether the tax is *correct*: that is what the human
// review gate in /api/admin/article-review is for. This only establishes that
// there is enough substance on the page to be worth a reviewer's time.

export type GeneratedSource = { label: string; url?: string };

/** The only tags an article body may contain. Everything else is unwrapped. */
const ALLOWED_TAGS = new Set([
  'h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption',
]);

/** Hosts we accept as a primary source. A citation to a blog is not a citation. */
const SOURCE_HOSTS = [
  'gov.uk',
  'legislation.gov.uk',
  'hmrc.gov.uk',
  'ons.gov.uk',
  'bankofengland.co.uk',
];

export const STANDARD = {
  minWords: 1100,
  maxWords: 2600,
  minSources: 2,
  minMoneyFigures: 3,
  minHeadings: 4,
  maxTitleChars: 80,
  maxExcerptWords: 45,
  // The excerpt is used verbatim as the page's meta description, and Google
  // truncates that around 155-160 characters. Forty-five words is roughly 270,
  // so the old word-only limit was letting through descriptions that lost their
  // last 40% in the search result — which for an answer-first excerpt is the
  // half that contains the answer. The 2026-09-09 audit found 148 of 155 pages
  // outside the usable range.
  maxExcerptChars: 155,
} as const;

/**
 * Strips every tag outside ALLOWED_TAGS and every attribute from the ones that
 * survive.
 *
 * The body is rendered with `dangerouslySetInnerHTML`, so this is a security
 * boundary and not a formatting nicety. Before this, the pipeline removed `<a>`
 * and nothing else, which left `<img src=x onerror=…>` — and every other
 * event-handler attribute — a working injection into our own pages via a model
 * response. Dropping attributes wholesale rather than filtering them means
 * there is no allowlist of "safe" attributes to get wrong later.
 */
export function sanitiseArticleHtml(html: string): string {
  const cleaned = html
    // Elements whose *content* is also dangerous have to go as a unit; unwrapping
    // <script> would leave the script body as text, which is worse than useless.
    .replace(/<(script|style|iframe|object|embed|template)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, rawName: string) => {
      const name = rawName.toLowerCase();
      if (!ALLOWED_TAGS.has(name)) return '';
      return match.startsWith('</') ? `</${name}>` : `<${name}>`;
    })
    // An unclosed or stray '<' that was not part of a tag would otherwise sit in
    // the output and can start swallowing markup in a forgiving parser.
    .replace(/<(?![a-zA-Z/])/g, '&lt;');

  // Wrapped after sanitising, not before: this markup is ours, so the class
  // survives the attribute-stripping above. A rates table can be four columns
  // wide and the page must not scroll sideways on a phone because of it, so the
  // overflow belongs to the table's own container.
  //
  // Only when the tags balance. An unclosed <table> would otherwise gain an
  // opening <div> with no closing one, and an unbalanced wrapper is a worse
  // page than an unwrapped table — the browser closes it at the article
  // container, taking the rest of the layout with it. A malformed table is the
  // model's mistake; making it a layout bug would be ours.
  const open = (cleaned.match(/<table>/g) ?? []).length;
  const close = (cleaned.match(/<\/table>/g) ?? []).length;
  if (open === 0 || open !== close) return cleaned;

  return cleaned
    .replace(/<table>/g, '<div class="prose-article-scroll"><table>')
    .replace(/<\/table>/g, '</table></div>');
}

export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ');
}

export function wordCount(html: string): number {
  return stripTags(html).split(/\s+/).filter(Boolean).length;
}

/** Distinct sterling amounts in the body. A worked example has several; a page
 *  that merely mentions a threshold has one. */
export function moneyFigures(html: string): string[] {
  const text = stripTags(html);
  const found = text.match(/£\s?[\d,]+(?:\.\d{1,2})?/g) ?? [];
  return [...new Set(found.map(s => s.replace(/\s/g, '')))];
}

export function hasTable(html: string): boolean {
  return /<table\b/i.test(html);
}

export function countHeadings(html: string): number {
  return (html.match(/<h[23]\b/gi) ?? []).length;
}

/** Keeps only well-formed entries pointing at a primary source. A `label` with
 *  no usable URL is not a citation a reader can follow, so it does not count. */
export function normaliseSources(raw: unknown): GeneratedSource[] | null {
  if (!Array.isArray(raw)) return null;
  const out: GeneratedSource[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const { label, url } = item as { label?: unknown; url?: unknown };
    if (typeof label !== 'string' || !label.trim()) continue;
    let cleanUrl: string | undefined;
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      cleanUrl = url.slice(0, 500);
    }
    const key = (cleanUrl ?? label).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label: label.trim().slice(0, 200), ...(cleanUrl ? { url: cleanUrl } : {}) });
    if (out.length === 8) break;
  }
  return out.length > 0 ? out : null;
}

export function isPrimarySource(source: GeneratedSource): boolean {
  if (!source.url) return false;
  let host: string;
  try {
    host = new URL(source.url).hostname.toLowerCase();
  } catch {
    return false;
  }
  return SOURCE_HOSTS.some(h => host === h || host.endsWith(`.${h}`));
}

export type QualityReport = {
  pass: boolean;
  words: number;
  headings: number;
  primarySources: number;
  moneyFigures: number;
  hasTable: boolean;
  /** Human-readable, and fed back to the model verbatim on the retry. */
  failures: string[];
};

export type ArticleDraft = {
  title: string;
  excerpt: string;
  content: string;
  sources?: GeneratedSource[] | null;
};

/**
 * Grades a draft against STANDARD.
 *
 * The failures read as instructions on purpose — they are handed straight back
 * to the model for the one retry, so "Body is 640 words; needs at least 1100"
 * is more useful than a boolean.
 */
export function gradeArticle(draft: ArticleDraft): QualityReport {
  const words = wordCount(draft.content);
  const headings = countHeadings(draft.content);
  const money = moneyFigures(draft.content);
  const table = hasTable(draft.content);
  const primary = (draft.sources ?? []).filter(isPrimarySource);

  const failures: string[] = [];
  if (words < STANDARD.minWords) {
    failures.push(`Body is ${words} words; it must be at least ${STANDARD.minWords}.`);
  }
  if (words > STANDARD.maxWords) {
    failures.push(`Body is ${words} words; keep it under ${STANDARD.maxWords}.`);
  }
  if (headings < STANDARD.minHeadings) {
    failures.push(`Only ${headings} section headings; use at least ${STANDARD.minHeadings} <h2>/<h3> sections.`);
  }
  if (!table) {
    failures.push('No <table>. Include at least one table setting out the rates, thresholds, dates or a side-by-side comparison.');
  }
  if (money.length < STANDARD.minMoneyFigures) {
    failures.push(`Only ${money.length} distinct £ figures; a worked example with real numbers needs at least ${STANDARD.minMoneyFigures}.`);
  }
  if (primary.length < STANDARD.minSources) {
    failures.push(
      `Only ${primary.length} citation(s) with a gov.uk or legislation.gov.uk URL; at least ${STANDARD.minSources} are required.`,
    );
  }
  if (!draft.excerpt?.trim()) {
    failures.push('The excerpt is empty; it must answer the question outright.');
  } else if (draft.excerpt.trim().length > STANDARD.maxExcerptChars) {
    failures.push(
      `The excerpt is ${draft.excerpt.trim().length} characters; it must be at most ` +
        `${STANDARD.maxExcerptChars}, because it is used verbatim as the meta description and ` +
        'is truncated in search results beyond that.',
    );
  } else if (draft.excerpt.trim().split(/\s+/).length > STANDARD.maxExcerptWords) {
    failures.push(`The excerpt is longer than ${STANDARD.maxExcerptWords} words.`);
  }
  if (!draft.title?.trim()) {
    failures.push('The title is empty.');
  } else if (draft.title.length > STANDARD.maxTitleChars) {
    failures.push(`The title is ${draft.title.length} characters; keep it under ${STANDARD.maxTitleChars}.`);
  }

  return {
    pass: failures.length === 0,
    words,
    headings,
    primarySources: primary.length,
    moneyFigures: money.length,
    hasTable: table,
    failures,
  };
}

/**
 * Ranks an existing article for the upgrade queue: lower is weaker.
 *
 * Deliberately blunt and monotonic in the four things the standard cares about,
 * so "which article is worst" is answerable without another model call. Word
 * count dominates because it is the dimension the whole archive fails on.
 */
export function weaknessScore(article: { content: string; sources?: unknown }): number {
  const words = wordCount(article.content ?? '');
  const sources = Array.isArray(article.sources)
    ? (article.sources as GeneratedSource[]).filter(isPrimarySource).length
    : 0;
  return (
    Math.min(words, STANDARD.minWords) / STANDARD.minWords * 100 +
    Math.min(sources, STANDARD.minSources) / STANDARD.minSources * 30 +
    (hasTable(article.content ?? '') ? 20 : 0) +
    Math.min(moneyFigures(article.content ?? '').length, STANDARD.minMoneyFigures) * 5
  );
}

/** True when an article already meets the standard and does not need rewriting. */
export function meetsStandard(article: { content: string; sources?: unknown }): boolean {
  return (
    wordCount(article.content ?? '') >= STANDARD.minWords &&
    hasTable(article.content ?? '') &&
    Array.isArray(article.sources) &&
    (article.sources as GeneratedSource[]).filter(isPrimarySource).length >= STANDARD.minSources
  );
}

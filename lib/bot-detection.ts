// Which "visitors" are people?
//
// Why this exists: on 2026-09-11 the production analytics held 97 page views
// from 46 distinct anonymous ids over nine days, and not one of those visitors
// did anything else. No registration, no launch-list signup, no calculator
// started, no deadline checked — zero of every conversion event the site
// records, across the whole window. A 0% rate on 46 people is possible. A 0%
// rate on 46 people who also produced no scroll, no second page and no click
// is better explained by most of them not being people.
//
// The 2026-09-08 round already found one version of this: crawlers probing for
// /55251a02303938bd113be2863f9c7b6c.txt rendered the 404 page, which carries
// the tracker, and recorded themselves as visitors. That was fixed at source by
// path. But a headless Chrome executing our JavaScript on a real page is
// indistinguishable *by path* from a reader, and it is counted identically.
//
// The distinguishing evidence is the User-Agent, and it is only trustworthy
// server-side: /api/track reads the request header rather than anything the
// caller put in the body, so a client cannot declare itself human. The result
// is stamped into props and the funnel then reports humans and bots separately
// — following the same rule the last round set for its exclusions: the filter
// is reported alongside the totals, because a filter you cannot see is how a
// metric starts lying in the other direction.
//
// This is a heuristic and is deliberately conservative. A bot that sends a
// browser User-Agent is counted as a person; that is the error we would rather
// make, because the alternative is quietly deleting real readers from the one
// number this project steers by.

/**
 * Substrings that appear in self-identifying automation. Lowercased; matched
 * as substrings against a lowercased User-Agent.
 *
 * Ordered roughly by how often we actually see them. `bot`, `crawler` and
 * `spider` catch the long tail on their own — the named entries exist so the
 * report can say *which* crawler rather than just "some bot", which is what
 * makes a sudden change in the mix legible.
 */
const BOT_SIGNATURES: readonly string[] = [
  // Search engines.
  'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'baiduspider', 'slurp',
  'applebot', 'petalbot', 'seznambot',
  // AI crawlers and assistants. These matter to us specifically: an answer
  // engine citing the site is a genuinely good outcome, but it is not a reader
  // and must not be counted as one.
  'gptbot', 'oai-searchbot', 'chatgpt-user', 'perplexitybot', 'claudebot',
  'anthropic-ai', 'claude-web', 'ccbot', 'google-extended', 'bytespider',
  'amazonbot', 'meta-externalagent', 'facebookbot', 'diffbot', 'timpibot',
  // SEO and backlink crawlers.
  'ahrefsbot', 'semrushbot', 'mj12bot', 'dotbot', 'dataforseobot', 'blexbot',
  'screaming frog', 'sitebulb', 'serpstatbot', 'barkrowler', 'zoominfobot',
  // Link unfurlers. A preview fetch means someone shared a link — worth
  // knowing, and still not a visit.
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'slackbot', 'discordbot',
  'whatsapp', 'telegrambot', 'skypeuripreview', 'redditbot', 'embedly',
  'pinterest', 'vkshare', 'quora link preview', 'nuzzel',
  // Monitoring, headless browsers and libraries.
  'headlesschrome', 'phantomjs', 'puppeteer', 'playwright', 'selenium',
  'lighthouse', 'chrome-lighthouse', 'pagespeed', 'gtmetrix', 'pingdom',
  'uptimerobot', 'statuscake', 'site24x7', 'newrelicpinger',
  'curl/', 'wget/', 'python-requests', 'python-urllib', 'go-http-client',
  'java/', 'okhttp', 'axios/', 'node-fetch', 'got (', 'libwww-perl', 'httpie',
  'postmanruntime', 'insomnia', 'guzzlehttp', 'apache-httpclient',
  // Feed readers. Recorded properly by distribution.feeds; never a page view.
  'feedly', 'inoreader', 'newsblur', 'feedbin', 'rss', 'feedfetcher',
  // Generic. Last, so a named match above wins when both apply.
  'bot', 'crawler', 'spider', 'scraper', 'archiver', 'monitor', 'preview',
];

/**
 * A browser User-Agent that says nothing else. Real browsers always name a
 * rendering engine; "Mozilla/5.0" alone, or an empty string, is automation
 * that did not bother to finish the disguise.
 */
function looksLikeRealBrowser(ua: string): boolean {
  return /(chrome|crios|firefox|fxios|safari|edg|edge|opr|opera|samsungbrowser)\//.test(ua);
}

/** True when the User-Agent identifies automation rather than a reader. */
export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return true; // A page view with no User-Agent did not come from a browser.
  const s = ua.toLowerCase();
  if (BOT_SIGNATURES.some(sig => s.includes(sig))) return true;
  return !looksLikeRealBrowser(s);
}

/**
 * A short, stable label for the automation behind a User-Agent, for grouping
 * in a report — 'googlebot', 'ahrefsbot', 'curl/'. Null when it looks human.
 *
 * Returns the first *named* signature where one matches, falling back to the
 * generic term, so the report distinguishes crawlers it can name from ones it
 * can only classify.
 */
export function botLabel(ua: string | null | undefined): string | null {
  if (!ua) return 'no-user-agent';
  const s = ua.toLowerCase();
  const hit = BOT_SIGNATURES.find(sig => s.includes(sig));
  if (hit) return hit.replace(/\/$/, '').replace(/ \($/, '').trim();
  return looksLikeRealBrowser(s) ? null : 'unidentified-client';
}

import { MetadataRoute } from 'next';

// The crawl policy.
//
// The AI agents are named explicitly rather than left to the `*` rule, and the
// reason is worth writing down because the instinct in 2026 runs the other way.
// Over the nine days to 2026-09-12 organic search sent this site ten referred
// visits in total and none in the last seventy-two hours, while ClaudeBot,
// GPTBot, PerplexityBot, meta-externalagent and AhrefsBot fetched the feeds,
// the calendar and the topic hubs twenty times in forty-eight hours. Being
// quoted by an answer engine is, for a pre-revenue site with 113 pages and no
// rankings, a better outcome than not being quoted — and the content is public
// guidance we published to be read, not a moat.
//
// So: allowed, and pointed at /llms.txt so they take the clean version.
// If that calculus changes — if citation stops converting, or the crawl cost
// starts mattering — this is the one file to change, and the named rules make
// it a one-line edit per agent rather than a rewrite.

/** Agents that read pages to answer questions, as opposed to indexing them for
 *  a results list. Listed so the allow is deliberate and revocable per agent. */
const AI_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'meta-externalagent',
  'Bytespider',
  'Amazonbot',
  'CCBot',
  'cohere-ai',
  'Diffbot',
  'Timpibot',
];

export default function robots(): MetadataRoute.Robots {
  // The same disallow list for everyone. /dashboard is a signed-in area, /api
  // is machinery and /admin is the editorial review queue; none is content, and
  // an agent that indexes a login redirect is wasting its crawl and our
  // rankings alike. /admin is also noindex on the page itself — robots.txt asks
  // a crawler not to fetch, which is not the same as asking it not to list.
  const disallow = ['/dashboard/', '/api/', '/admin/'];

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      ...AI_AGENTS.map(userAgent => ({ userAgent, allow: '/', disallow })),
    ],
    sitemap: 'https://easytax.vip/sitemap.xml',
    host: 'https://easytax.vip',
  };
}

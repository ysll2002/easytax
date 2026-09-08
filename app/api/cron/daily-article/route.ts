import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { sendArticleReviewEmail } from '@/lib/email';
import { coverage, nextQuery, linkLabelFor, type TargetQuery } from '@/lib/search-queries';
import { getMtdStatus, mandateSentence } from '@/lib/mtd-status';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function toSlug(title: string, date: string): string {
  return (
    title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 80) +
    '-' + date
  );
}

export type GeneratedSource = { label: string; url?: string };

/** What the model was asked to write, and why. `target` is null only on the
 *  fallback path, where the curated list has been exhausted. */
type Assignment = { topic: string; target: TargetQuery | null };

/** Escapes into an attribute or text node we build ourselves. The article body
 *  is rendered with dangerouslySetInnerHTML, so anything we append to it has
 *  to be safe by construction. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Appends the internal link for a target query.
 *
 * Built here rather than asked for in the prompt, for two reasons: the model
 * cannot then emit an arbitrary `<a href>` into HTML we inject unescaped, and
 * the link is guaranteed to be present rather than present-most-days. Every
 * article therefore carries a route to a page that can convert.
 */
function withInternalLink(content: string, target: TargetQuery | null): string {
  if (!target) return content;
  return (
    content +
    `<p><strong>Next step:</strong> <a href="${esc(target.link)}">${esc(linkLabelFor(target.link))}</a>.</p>`
  );
}

async function generateArticle(assignment: Assignment): Promise<{
  title: string;
  excerpt: string;
  content: string;
  sources?: GeneratedSource[];
}> {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const status = getMtdStatus();
  const { target } = assignment;

  // The archive's problem was never writing quality — it was that nothing tied
  // a title to something a person types. When we have a target query, the
  // query leads the prompt and the excerpt is required to answer it outright:
  // the excerpt is rendered as the lead paragraph under the headline and is
  // used verbatim as the meta description, so an excerpt that answers the
  // question is the difference between a search result worth clicking and a
  // teaser that gets scrolled past.
  const brief = target
    ? `Someone has just typed this into a search engine:

"${target.q}"

Write the page that answers them, directly and without preamble.

- Use this headline, or something within a few words of it: "${target.title}"
- The "excerpt" field must ANSWER THE QUESTION in 40 words or fewer. Not a summary, not a tease — the actual answer, stated plainly, so that someone who reads only that sentence has what they came for. It is shown as the opening paragraph and used as the search-result description.
- The article body then earns the answer: the conditions, the exceptions, the numbers, what to actually do.
- Reader intent here is ${target.intent}.`
    : `Write a practical, informative article about the following topic:
"${assignment.topic}"

The "excerpt" field should state the article's central point in 40 words or fewer, plainly enough to stand alone.`;

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `You are a UK tax expert writing for EasyTax, a platform for UK freelancers, sole traders, and limited companies.

Today is ${today}.

Current status of the regime, which your article must be consistent with:
- ${mandateSentence(status)}
- ${status.autoSignupHasStarted ? 'HMRC has begun automatically signing up people who met the threshold and had not signed up themselves.' : 'HMRC is not yet auto-enrolling.'}
${status.dueQuarter ? `- The next quarterly update deadline is ${status.dueQuarter.deadlineLabel}, covering ${status.dueQuarter.periodLabel}.` : ''}

Write in the correct tense for today's date. Do not describe a rule that is already in force as something that is going to happen.

${brief}

Make it specific to UK tax rules, accurate, and actionable. Write for the most relevant audience (freelancers/sole traders OR limited company directors, depending on the topic).

Ground every rate, threshold, deadline and legal claim in a source you can name — an HMRC manual or guidance page, or the specific UK statute. If you are not confident a figure is current, say so in the article rather than stating it flatly.

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "title": "A clear headline (max 80 characters)",
  "excerpt": "The direct answer, 40 words or fewer",
  "content": "Full article HTML using only <h2>, <p>, <ul>, <li>, <strong> tags. 500-700 words. Practical and specific. Do not include <a> tags.",
  "sources": [
    { "label": "Name of the HMRC manual page, guidance page or statute relied on", "url": "https://www.gov.uk/... or https://www.legislation.gov.uk/..." }
  ]
}`,
    }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const parsed = JSON.parse(raw) as {
    title: string; excerpt: string; content: string; sources?: GeneratedSource[];
  };

  // Strip any anchor the model emitted anyway, then add ours. Belt and braces:
  // the body goes into the page unescaped.
  parsed.content = withInternalLink(
    parsed.content.replace(/<\/?a\b[^>]*>/gi, ''),
    target,
  );
  return parsed;
}

/** Keeps only well-formed `{label, url?}` entries, capped so a talkative model
 *  cannot write an unbounded blob into the row. Returns null rather than an
 *  empty array so the column stays honestly empty when nothing was cited. */
function normaliseSources(raw: unknown): GeneratedSource[] | null {
  if (!Array.isArray(raw)) return null;
  const out: GeneratedSource[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const { label, url } = item as { label?: unknown; url?: unknown };
    if (typeof label !== 'string' || !label.trim()) continue;
    out.push({
      label: label.trim().slice(0, 200),
      ...(typeof url === 'string' && /^https?:\/\//i.test(url) ? { url: url.slice(0, 500) } : {}),
    });
    if (out.length === 8) break;
  }
  return out.length > 0 ? out : null;
}

type DraftRow = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published_at: string;
  sources: GeneratedSource[] | null;
};

/**
 * Inserts a generated article as a draft.
 *
 * Falls back to the pre-review-gate shape if `review_status`/`sources` do not
 * exist yet — i.e. this code deployed before the 20260906 migration ran. The
 * fallback publishes immediately, which is exactly what happened before, so
 * the worst case of a deploy/migration race is a day of the old behaviour
 * rather than a lost article or a failed cron.
 */
async function insertDraft(row: DraftRow): Promise<string | null> {
  const { error } = await supabase.from('tax_articles').insert({
    title:         row.title,
    slug:          row.slug,
    excerpt:       row.excerpt,
    content:       row.content,
    published_at:  row.published_at,
    review_status: 'draft',
    sources:       row.sources,
  });

  if (!error) return null;

  if (error.code === '42703' || error.code === 'PGRST204') {
    console.warn(
      '[daily-article] review_status/sources missing — run the 20260906 migration. ' +
        'Falling back to publishing immediately.',
    );
    const { error: legacyError } = await supabase.from('tax_articles').insert({
      title:        row.title,
      slug:         row.slug,
      excerpt:      row.excerpt,
      content:      row.content,
      published_at: row.published_at,
    });
    return legacyError?.message ?? null;
  }

  return error.message;
}

async function notifyReviewQueue(drafts: { title: string; slug: string }[]): Promise<void> {
  const { count } = await supabase
    .from('tax_articles')
    .select('slug', { count: 'exact', head: true })
    .eq('review_status', 'draft');

  await sendArticleReviewEmail(drafts, count ?? drafts.length);
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') ?? req.nextUrl.searchParams.get('secret');
    const token = auth?.replace('Bearer ', '');
    if (token !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Check if we need to seed initial articles
    const { count } = await supabase
      .from('tax_articles')
      .select('*', { count: 'exact', head: true });

    const isSeeding = (count ?? 0) === 0;

    // Every title in the archive, drafts included — coverage has to count an
    // article that is queued for review, or the pipeline writes the same query
    // again tomorrow.
    const { data: allTitles } = await supabase
      .from('tax_articles')
      .select('title')
      .order('published_at', { ascending: false });
    const titles = (allTitles ?? []).map(r => r.title as string);

    const cover = coverage(titles);
    const assignments: Assignment[] = [];

    if (isSeeding) {
      // Seeding used to run a hardcoded list. The curated queries are a
      // strictly better starting archive, and they keep the seed path and the
      // daily path on the same rails.
      assignments.push(
        ...cover.pending.slice(0, 6).map(t => ({ topic: t.q, target: t })),
      );
    } else {
      const target = nextQuery(titles);
      if (target) {
        assignments.push({ topic: target.q, target });
      } else {
        // The curated list is fully covered. Fall back to the old behaviour —
        // ask for a fresh topic — rather than writing a duplicate. When this
        // branch starts firing, the list needs extending; the response reports
        // coverage so that is visible rather than silent.
        const recentTitles = titles.slice(0, 10).join('; ');
        const topicMsg = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: `You are a UK tax expert. Suggest ONE specific, practical article topic for a UK tax audience, phrased as a question a taxpayer would actually type into a search engine.
Topics can cover any of: Self Assessment, Making Tax Digital (MTD ITSA), freelancer/sole trader expenses, VAT returns, Corporation Tax (CT600), company accounts (Balance Sheet, P&L), or general UK business tax.
Avoid these recent topics: ${recentTitles || 'none'}.
Reply with ONLY the topic sentence, no explanation.`,
          }],
        });
        assignments.push({
          topic: (topicMsg.content[0] as { type: string; text: string }).text.trim(),
          target: null,
        });
      }
    }

    const results = [];
    const today = new Date().toISOString().slice(0, 10);

    for (let i = 0; i < assignments.length; i++) {
      const pubDate = isSeeding
        ? new Date(Date.now() - (assignments.length - 1 - i) * 24 * 60 * 60 * 1000).toISOString()
        : new Date().toISOString();

      const article = await generateArticle(assignments[i]);
      const slug = toSlug(article.title, isSeeding ? new Date(pubDate).toISOString().slice(0, 10) : today);

      const error = await insertDraft({
        title: article.title,
        slug,
        excerpt: article.excerpt,
        content: article.content,
        published_at: pubDate,
        sources: normaliseSources(article.sources),
      });

      results.push({
        topic: assignments[i].topic,
        targetQuery: assignments[i].target?.q ?? null,
        cluster: assignments[i].target?.cluster ?? null,
        title: article.title,
        slug,
        error,
      });
    }

    const created = results.filter(r => !r.error);
    if (created.length > 0) {
      // The drafts are invisible until someone acts on them, so a silent queue
      // is a queue that never empties. Fire-and-forget: a mail failure must not
      // fail the cron and lose the generated article.
      void notifyReviewQueue(created.map(r => ({ title: r.title, slug: r.slug }))).catch(err => {
        console.error('[daily-article] review notification failed', err);
      });
    }

    return NextResponse.json({
      ok: true,
      generated: results.length,
      status: 'draft — awaiting review at /api/admin/article-review',
      // Coverage as it stood before this run. The point of the curated list is
      // that progress against it is legible: "wrote an article" says nothing,
      // "38 of 41 target queries answered" says whether the archive is getting
      // closer to answering the things people search for.
      query_coverage: {
        total: cover.total,
        covered: cover.covered,
        remaining: cover.pending.length,
        next_up: cover.pending.slice(0, 3).map(q => q.q),
      },
      results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

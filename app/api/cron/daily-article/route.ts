import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { recordArticleRun } from '@/lib/editorial-run';
import {
  TARGET_QUERIES,
  coverage,
  coversQuery,
  distinctiveWords,
  linkLabelFor,
  nextQuery,
  type TargetQuery,
} from '@/lib/search-queries';
import { getMtdStatus, mandateSentence } from '@/lib/mtd-status';
import { publishedTopicsForTitle } from '@/app/tax-tips/_lib/topic-articles';
import {
  STANDARD,
  findTitleCollision,
  gradeArticle,
  meetsStandard,
  normaliseSources,
  sanitiseArticleHtml,
  weaknessScore,
  type ArticleDraft,
  type GeneratedSource,
  type QualityReport,
} from '@/lib/article-quality';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Two model calls at 8k output tokens, and up to `count` of them. The old
// 1500-token cap made this a fast route; depth costs time.
//
// 300 is the ceiling, not a preference: this project is on Vercel's Hobby
// plan, where a serverless function may not exceed it — a first attempt at 800
// failed the deploy outright with "must have a maxDuration between 1 and 300
// for plan hobby". That same limit is why `count` is capped low.
export const maxDuration = 300;

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

/** What the model was asked to write, and why.
 *
 *  `new` writes a page for a query nobody here has answered yet. `upgrade`
 *  replaces one of the 573–724-word stubs already in the archive; it carries
 *  the existing row so the rewrite can be staged against it rather than
 *  published over a live page. */
type Assignment =
  | { kind: 'new'; topic: string; target: TargetQuery | null }
  | { kind: 'upgrade'; topic: string; target: TargetQuery | null; existing: ExistingArticle };

type ExistingArticle = {
  slug: string;
  title: string;
  content: string;
  sources: unknown;
};

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
function withInternalLink(content: string, link: InternalLink | null): string {
  if (!link) return content;
  return (
    content +
    `<p><strong>Next step:</strong> <a href="${esc(link.href)}">${esc(link.label)}</a>.</p>`
  );
}

type InternalLink = { href: string; label: string };

/**
 * Where an article should send the reader next.
 *
 * A target query carries its own mapped page, which is the best answer. An
 * upgrade of an existing article usually has no target — `coversQuery` matched
 * only 3 of the 113 published titles against the curated list, because the
 * archive was written before the list existed and is about different things.
 * Those fall back to the article's own topic hub, which is a real page, always
 * topically right, and is the one route by which the older half of the archive
 * gets any inbound internal link at all.
 */
async function internalLinkFor(
  target: TargetQuery | null,
  title: string,
): Promise<InternalLink | null> {
  if (target) return { href: target.link, label: linkLabelFor(target.link) };
  try {
    const topics = await publishedTopicsForTitle(title);
    const topic = topics[0];
    if (topic) {
      return { href: `/tax-tips/topics/${topic.slug}`, label: `More on ${topic.label}` };
    }
  } catch (err) {
    // A link is worth having, not worth failing a generation over.
    console.warn('[daily-article] topic lookup failed', err);
  }
  return null;
}

/**
 * The standard, stated to the model in the same terms the validator checks.
 *
 * Kept in one string so the prompt and `lib/article-quality` cannot drift: if
 * the numbers here stop matching STANDARD, every generation fails the gate on
 * the first pass and the retry cost shows up immediately.
 */
function standardBrief(): string {
  return `This has to be the best page on the internet for the question, not a summary of it. Specifically:

- **Length: ${STANDARD.minWords}–${STANDARD.maxWords} words.** Depth is the point. A 650-word answer to any of these questions is one that leaves the reader still searching.
- **At least ${STANDARD.minHeadings} <h2> or <h3> sections**, each answering something the reader still wants to know after the previous one.
- **At least one <table>** — the rates, the thresholds, the deadlines, or a side-by-side of the two options. Use <table>, <thead>, <tbody>, <tr>, <th>, <td>.
- **A worked example with real numbers.** Name a figure, do the arithmetic, show what it comes to. At least ${STANDARD.minMoneyFigures} distinct £ amounts must appear.
- **At least ${STANDARD.minSources} citations with a real gov.uk or legislation.gov.uk URL**, in the "sources" array. Cite the page you are actually relying on for a rate or a rule, not the HMRC homepage. A citation without a working URL does not count.
- Where a figure could be out of date, say when it applies from rather than stating it flatly.`;
}

/** Model output as it arrives, before sanitising and grading. */
type RawDraft = { title: string; excerpt: string; content: string; sources?: unknown };

function parseDraft(text: string): RawDraft {
  // The model is asked for bare JSON, but a stray ```json fence is the one
  // deviation that shows up in practice and is cheap to tolerate.
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned) as RawDraft;
}

async function callModel(prompt: string): Promise<RawDraft> {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    // The old value was 1500, which is why no article in the archive exceeds
    // 724 words: the cap, not the brief, was the binding constraint. A
    // 2,600-word body plus JSON overhead needs roughly 6k.
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = msg.content[0];
  if (!block || block.type !== 'text') {
    throw new Error('model returned no text block');
  }
  return parseDraft(block.text);
}

function finalise(raw: RawDraft, link: InternalLink | null): ArticleDraft {
  return {
    title: String(raw.title ?? '').trim(),
    excerpt: String(raw.excerpt ?? '').trim(),
    // Sanitise before the internal link is appended, so our own anchor is not
    // stripped by the tag allowlist that exists to remove the model's.
    content: withInternalLink(sanitiseArticleHtml(String(raw.content ?? '')), link),
    sources: normaliseSources(raw.sources),
  };
}

/**
 * Generates a draft and holds it to the standard, with one retry.
 *
 * The retry is the whole point of grading in code: the first response fails on
 * length or a missing table far more often than on anything a human reviewer
 * would catch, and handing the specific failures back fixes it without a person
 * being involved. What a second failure produces is still returned — the review
 * gate means nothing reaches the site unreviewed — but it is returned with the
 * report attached so the reviewer knows what they are looking at.
 */
async function generateArticle(
  assignment: Assignment,
): Promise<{ draft: ArticleDraft; quality: QualityReport; attempts: number }> {
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
  let brief: string;
  if (assignment.kind === 'upgrade') {
    brief = `We already publish a page titled "${assignment.existing.title}". It is ${
      String(assignment.existing.content).replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length
    } words long, cites nothing a reader can check, and does not rank. Rewrite it completely.

Keep the same subject and the same reader. You may sharpen the headline, but it must still be recognisably about the same thing — the page keeps its URL, so a reader arriving from a link must find what they expected.

Here is what we currently say, as context for what to keep and what to replace:

"""
${String(assignment.existing.content).replace(/<[^>]*>/g, ' ').slice(0, 2500)}
"""

Do not preserve its structure. Start again and write the version that deserves the ranking.`;
  } else if (target) {
    brief = `Someone has just typed this into a search engine:

"${target.q}"

Write the page that answers them, directly and without preamble.

- Use this headline, or something within a few words of it: "${target.title}"
- The headline MUST contain these words, because a headline without them is not about this search: ${distinctiveWords(target).map(w => `"${w}"`).join(', ')}. This is checked before the article is written and a headline that misses them is discarded.
- The "excerpt" field must ANSWER THE QUESTION in ${STANDARD.maxExcerptChars} characters or fewer. Not a summary, not a tease — the actual answer, stated plainly, so that someone who reads only that sentence has what they came for. It is shown as the opening paragraph and used as the search-result description.
- The article body then earns the answer: the conditions, the exceptions, the numbers, what to actually do.
- Reader intent here is ${target.intent}.`;
  } else {
    brief = `Write a practical, informative article about the following topic:
"${assignment.topic}"

The "excerpt" field should state the article's central point in ${STANDARD.maxExcerptChars} characters or fewer, plainly enough to stand alone.`;
  }

  const basePrompt = `You are a UK tax expert writing for EasyTax, a platform for UK freelancers, sole traders, and limited companies.

Today is ${today}.

Current status of the regime, which your article must be consistent with:
- ${mandateSentence(status)}
- ${status.autoSignupHasStarted ? 'HMRC has begun automatically signing up people who met the threshold and had not signed up themselves.' : 'HMRC is not yet auto-enrolling.'}
${status.dueQuarter ? `- The next quarterly update deadline is ${status.dueQuarter.deadlineLabel}, covering ${status.dueQuarter.periodLabel}.` : ''}

Write in the correct tense for today's date. Do not describe a rule that is already in force as something that is going to happen.

${brief}

${standardBrief()}

Make it specific to UK tax rules, accurate, and actionable. Write for the most relevant audience (freelancers/sole traders OR limited company directors, depending on the topic).

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "title": "A clear headline (max ${STANDARD.maxTitleChars} characters)",
  "excerpt": "The direct answer, at most ${STANDARD.maxExcerptChars} characters — it is the meta description",
  "content": "Full article HTML using only <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <table>, <thead>, <tbody>, <tr>, <th>, <td>. Do not include <a> tags.",
  "sources": [
    { "label": "Name of the HMRC manual page, guidance page or statute relied on", "url": "https://www.gov.uk/... or https://www.legislation.gov.uk/..." }
  ]
}`;

  const link = await internalLinkFor(target, assignment.kind === 'upgrade' ? assignment.existing.title : (target?.title ?? assignment.topic));

  /**
   * Did the headline come back about the thing it was commissioned for?
   *
   * This is the check that was missing, and it cost the pipeline a week.
   * `nextQuery` picks the highest-priority query no page answers, the model is
   * briefed on it, and `coverage` then decides whether it has been answered by
   * running `coversQuery` over the resulting title. Nothing closed the loop
   * between the brief and that test. So on 2026-09-11 the pipeline was asked
   * for "what counts as qualifying income for making tax digital" and wrote
   * "HMRC signed you up for Making Tax Digital — what happens now", which
   * answers no target query at all. The query stayed pending, came up again on
   * 09-13, and produced the same headline a second time.
   *
   * That was merely wasteful until yesterday. `findTitleCollision` now refuses
   * a headline the archive already claims, which turns the loop from writing
   * the same page repeatedly into writing nothing at all, every single "new
   * article" day, for as long as the query stays at the top of the list.
   *
   * Graded rather than thrown, so the existing retry does the work: the miss
   * is appended to the quality failures and the model is told what it got
   * wrong in exactly the way it is told about a short excerpt.
   */
  const offTarget = (d: ArticleDraft): string[] =>
    assignment.kind === 'new' && target && !coversQuery(d.title, target)
      ? [
          `The headline "${d.title}" is not about the search it was written for ("${target.q}"). ` +
            `Rewrite the headline so it contains all of these words: ${distinctiveWords(target).map(w => `"${w}"`).join(', ')}.`,
        ]
      : [];

  const grade = (d: ArticleDraft): QualityReport => {
    const report = gradeArticle(d);
    const missed = offTarget(d);
    return missed.length === 0
      ? report
      : { ...report, pass: false, failures: [...report.failures, ...missed] };
  };

  let draft = finalise(await callModel(basePrompt), link);
  let quality = grade(draft);
  if (quality.pass) return { draft, quality, attempts: 1 };

  const retryPrompt = `${basePrompt}

Your previous attempt was rejected. Fix every one of these and return the complete article again:

${quality.failures.map(f => `- ${f}`).join('\n')}

Do not shorten anything else to compensate. Return the same JSON shape.`;

  draft = finalise(await callModel(retryPrompt), link);
  quality = grade(draft);
  return { draft, quality, attempts: 2 };
}

type DraftRow = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published_at: string;
  sources: GeneratedSource[] | null;
  /** The curated query this was commissioned against, stored so the page can
   *  state the question it answers. Null when the run had no target. */
  target_query: string | null;
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
  const gated = {
    title:         row.title,
    slug:          row.slug,
    excerpt:       row.excerpt,
    content:       row.content,
    published_at:  row.published_at,
    review_status: 'draft',
    sources:       row.sources,
  };

  const { error } = await supabase.from('tax_articles').insert({
    ...gated,
    target_query: row.target_query,
  });

  if (!error) return null;

  // `target_query` is the newest column here (20260916) and the most likely
  // one to be missing on a deploy that lands before its migration. Retry
  // without it, still gated, BEFORE reaching the legacy fallback below —
  // otherwise a missing column whose only job is a snippet would drop this
  // insert into the path that publishes without review. A cosmetic field must
  // never be able to open the editorial gate.
  if (error.code === '42703' || error.code === 'PGRST204') {
    const { error: retryError } = await supabase.from('tax_articles').insert(gated);
    if (!retryError) {
      console.warn('[daily-article] target_query missing — run the 20260916 migration.');
      return null;
    }
    if (retryError.code !== '42703' && retryError.code !== 'PGRST204') {
      return retryError.message;
    }
  }

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

/**
 * Stages a rewrite against the row it replaces.
 *
 * The live columns are untouched: the published page keeps serving until a
 * human promotes the rewrite. A missing `pending_*` column means the 20260909
 * migration has not run, which is reported rather than retried — publishing the
 * rewrite over the live article instead would be exactly the unreviewed
 * overwrite this design exists to avoid.
 */
async function stageUpgrade(
  slug: string,
  draft: ArticleDraft,
): Promise<{ error: string | null; migrationMissing: boolean }> {
  const { error } = await supabase
    .from('tax_articles')
    .update({
      pending_title:        draft.title,
      pending_excerpt:      draft.excerpt,
      pending_content:      draft.content,
      pending_sources:      draft.sources,
      pending_generated_at: new Date().toISOString(),
    })
    .eq('slug', slug);

  if (!error) return { error: null, migrationMissing: false };
  if (error.code === '42703' || error.code === 'PGRST204') {
    return { error: error.message, migrationMissing: true };
  }
  return { error: error.message, migrationMissing: false };
}

/**
 * The weakest published article that is not already waiting on a rewrite.
 *
 * Scored in code rather than by another model call — the four things the
 * standard measures are all countable, so "which is worst" needs no judgement.
 */
async function weakestPublished(
  count: number,
): Promise<{ articles: ExistingArticle[]; migrationMissing: boolean }> {
  const gated = await supabase
    .from('tax_articles')
    .select('slug, title, content, sources, pending_generated_at')
    .eq('review_status', 'published')
    .is('pending_generated_at', null);

  if (gated.error) {
    if (gated.error.code === '42703' || gated.error.code === 'PGRST204') {
      return { articles: [], migrationMissing: true };
    }
    throw new Error(gated.error.message);
  }

  const rows = (gated.data ?? []) as unknown as ExistingArticle[];
  const candidates = rows.filter(r => r.content && !meetsStandard(r));
  candidates.sort((a, b) => weaknessScore(a) - weaknessScore(b));
  return { articles: candidates.slice(0, count), migrationMissing: false };
}

/** The target query an existing article already answers, so an upgraded page
 *  gains the same internal link a new one would.
 *
 *  Reuses `coversQuery` rather than a looser match of its own: that matcher
 *  requires every *distinctive* word of the query to be present, which is what
 *  stopped one generic MTD title from claiming four unrelated queries at once
 *  when it was written. A wrong link here would point a reader at a page that
 *  does not follow from what they just read, so a miss — no link — is the
 *  better failure. */
function targetForTitle(title: string): TargetQuery | null {
  return TARGET_QUERIES.find(q => coversQuery(title, q)) ?? null;
}

/* The review-queue email used to be sent from the end of this handler. It is
 * now sent by /api/cron/daily, half an hour later.
 *
 * The reason is this handler's failure mode. Everything above makes two model
 * calls per assignment; when one of them throws, the catch at the bottom
 * returns a 500 and nothing after the loop runs — including, until today, the
 * email whose entire job is to say that the archive has stopped publishing.
 * The alarm was wired downstream of the thing it was watching, so it went
 * silent in exactly the case it existed for: eight days frozen, three drafts
 * queued, not one alarm sent.
 *
 * /api/cron/daily makes no model calls and has written a snapshot row every
 * day since it shipped. It derives "what is new" from the queue's own
 * timestamps (`reviewEmailInput`) rather than from what a run produced, which
 * is what lets it be sent from somewhere that is not here.
 */

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

  // `mode` forces one arm of the alternation, for testing and for catching the
  // upgrade queue up by hand. Left unset, the day decides.
  const forced = req.nextUrl.searchParams.get('mode');

  // How many pieces to produce in this run. One a day is the cron's cadence and
  // the default; the parameter exists because 113 published articles fail the
  // standard and one rewrite every other day clears that queue in 33 weeks.
  // Whether to close the gap by batching rewrites, or by pruning the weakest
  // articles instead of rewriting them, is a call for the owner — this makes
  // the first option available without committing to it. Capped so a typo
  // cannot spend an afternoon of model calls.
  // Named for what it is rather than `count`, which is already taken in this
  // handler by the article row count from Supabase.
  const batchSize = Math.max(1, Math.min(10, Number(req.nextUrl.searchParams.get('count')) || 1));

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
    let upgradeNote: string | null = null;

    if (isSeeding) {
      // Seeding used to run a hardcoded list. The curated queries are a
      // strictly better starting archive, and they keep the seed path and the
      // daily path on the same rails.
      assignments.push(
        ...cover.pending.slice(0, 6).map(t => ({ kind: 'new' as const, topic: t.q, target: t })),
      );
    } else {
      // Alternate. Writing a new page every day is what produced 114 stubs;
      // half the days now go to making an existing page worth finding instead.
      // Volume was never the constraint — six organic visits across 114 pages
      // in six days is the evidence — so trading half the velocity for depth
      // costs nothing we were actually earning.
      const dayIndex = Math.floor(Date.now() / 86_400_000);
      const wantUpgrade = forced ? forced === 'upgrade' : dayIndex % 2 === 0;

      if (wantUpgrade) {
        const { articles, migrationMissing } = await weakestPublished(batchSize);
        for (const article of articles) {
          assignments.push({
            kind: 'upgrade',
            topic: article.title,
            target: targetForTitle(article.title),
            existing: article,
          });
        }
        if (articles.length === 0) {
          upgradeNote = migrationMissing
            ? 'pending_* columns missing — run supabase/migrations/20260909_article_upgrades.sql. Wrote a new article instead.'
            : 'Every published article already meets the standard. Wrote a new article instead.';
        }
      }

      if (assignments.length === 0) {
        const target = nextQuery(titles);
        if (target) {
          assignments.push({ kind: 'new', topic: target.q, target });
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
          const block = topicMsg.content[0];
          assignments.push({
            kind: 'new',
            topic: block && block.type === 'text' ? block.text.trim() : 'UK Self Assessment deadlines',
            target: null,
          });
        }
      }
    }

    const results = [];
    const today = new Date().toISOString().slice(0, 10);

    for (let i = 0; i < assignments.length; i++) {
      const assignment = assignments[i];
      const pubDate = isSeeding
        ? new Date(Date.now() - (assignments.length - 1 - i) * 24 * 60 * 60 * 1000).toISOString()
        : new Date().toISOString();

      const { draft, quality, attempts } = await generateArticle(assignment);

      if (assignment.kind === 'upgrade') {
        const staged = await stageUpgrade(assignment.existing.slug, draft);
        results.push({
          mode: 'upgrade' as const,
          slug: assignment.existing.slug,
          title: draft.title,
          replaces: assignment.existing.title,
          targetQuery: assignment.target?.q ?? null,
          cluster: assignment.target?.cluster ?? null,
          quality,
          attempts,
          error: staged.migrationMissing
            ? 'pending_* columns missing — run supabase/migrations/20260909_article_upgrades.sql'
            : staged.error,
        });
        continue;
      }

      // Refuse a headline the archive already claims. `titles` includes drafts,
      // so a queued article counts — otherwise the pipeline writes the same
      // page again tomorrow while the first one waits for review.
      const collision = findTitleCollision(draft.title, titles);
      if (collision) {
        results.push({
          mode: 'new' as const,
          slug: null,
          title: draft.title,
          replaces: null,
          targetQuery: assignment.target?.q ?? null,
          cluster: assignment.target?.cluster ?? null,
          quality,
          attempts,
          error: `Not written: this headline ${collision.kind === 'exact' ? 'is already in the archive' : 'claims the same subject as an existing page'} — "${collision.match}". Two pages competing for one query rank worse than one.`,
        });
        continue;
      }

      const slug = toSlug(draft.title, isSeeding ? new Date(pubDate).toISOString().slice(0, 10) : today);
      // Keep the in-run list current so a batch cannot collide with itself.
      titles.push(draft.title);
      const error = await insertDraft({
        title: draft.title,
        slug,
        excerpt: draft.excerpt,
        content: draft.content,
        published_at: pubDate,
        sources: draft.sources ?? null,
        target_query: assignment.target?.q ?? null,
      });

      results.push({
        mode: 'new' as const,
        slug,
        title: draft.title,
        replaces: null,
        targetQuery: assignment.target?.q ?? null,
        cluster: assignment.target?.cluster ?? null,
        quality,
        attempts,
        error,
      });
    }

    // The durable trace. Written before the response, because the response is
    // the part nobody reads — and a run that produced nothing leaves no row in
    // `tax_articles` to say it happened at all.
    const recorded = await recordArticleRun({
      ran_at: new Date().toISOString(),
      mode: assignments[0]?.kind ?? 'none',
      written: results.filter(r => !r.error && r.slug).length,
      outcomes: results.map(r =>
        r.error ? `${r.mode}: ${r.error}` : `${r.mode}: wrote "${r.title}"`,
      ),
      coverage: {
        covered: cover.covered,
        total: cover.total,
        next_up: cover.pending.slice(0, 3).map(q => q.q),
      },
    });

    return NextResponse.json({
      ok: true,
      generated: results.length,
      run_recorded: recorded,
      status: 'draft — awaiting review at /admin/review',
      // The review email is sent by /api/cron/daily now; see the note above.
      review_notification: 'sent by /api/cron/daily',
      upgrade_note: upgradeNote,
      // Whether the gate is doing work or just adding a model call. If
      // first_pass_failures stays at 100%, the prompt and the standard have
      // drifted apart and the retry is paying for the difference every day.
      gate: {
        standard: STANDARD,
        passed: results.filter(r => r.quality.pass).length,
        failed: results.filter(r => !r.quality.pass).length,
        needed_retry: results.filter(r => r.attempts > 1).length,
      },
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
    // A thrown run is the one that most needs a trace: it writes no article,
    // and until now the only record of it was a red line in a Vercel log that
    // ages out. This is the case that cost eight days of publishing.
    await recordArticleRun({
      ran_at: new Date().toISOString(),
      mode: 'none',
      written: 0,
      outcomes: [],
      coverage: { covered: 0, total: 0, next_up: [] },
      error: msg,
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

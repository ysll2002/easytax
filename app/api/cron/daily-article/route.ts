import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { sendArticleReviewEmail } from '@/lib/email';

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

const SEED_TOPICS = [
  'The most common allowable expenses UK freelancers miss on their Self Assessment return',
  'Making Tax Digital for Income Tax: what self-employed people need to do before April 2026',
  'How to calculate your tax-free personal allowance and Marriage Allowance as a freelancer',
  'How to prepare your first VAT return as a UK limited company',
  'CT600 explained: what every UK limited company director needs to know about Corporation Tax',
  'Balance Sheet basics for small UK limited companies: what you need to include',
];

export type GeneratedSource = { label: string; url?: string };

async function generateArticle(topic: string): Promise<{
  title: string;
  excerpt: string;
  content: string;
  sources?: GeneratedSource[];
}> {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `You are a UK tax expert writing for EasyTax, a platform for UK freelancers, sole traders, and limited companies.

Today is ${today}. Write a practical, informative article about the following topic:
"${topic}"

Make it specific to UK tax rules, accurate, and actionable. Write for the most relevant audience (freelancers/sole traders OR limited company directors, depending on the topic).

Ground every rate, threshold, deadline and legal claim in a source you can name — an HMRC manual or guidance page, or the specific UK statute. If you are not confident a figure is current, say so in the article rather than stating it flatly.

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "title": "A clear, engaging headline (max 80 characters)",
  "excerpt": "2-3 sentence summary of the article",
  "content": "Full article HTML using only <h2>, <p>, <ul>, <li>, <strong> tags. 500-700 words. Practical and specific.",
  "sources": [
    { "label": "Name of the HMRC manual page, guidance page or statute relied on", "url": "https://www.gov.uk/... or https://www.legislation.gov.uk/..." }
  ]
}`,
    }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  return JSON.parse(raw);
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
    const topics: string[] = [];

    if (isSeeding) {
      topics.push(...SEED_TOPICS);
    } else {
      // Daily: pick a fresh topic — ask Claude to choose one that hasn't appeared recently
      const { data: recent } = await supabase
        .from('tax_articles')
        .select('title')
        .order('published_at', { ascending: false })
        .limit(10);

      const recentTitles = (recent ?? []).map(r => r.title).join('; ');

      const topicMsg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `You are a UK tax expert. Suggest ONE specific, practical article topic for a UK tax audience.
Topics can cover any of: Self Assessment, Making Tax Digital (MTD ITSA), freelancer/sole trader expenses, VAT returns, Corporation Tax (CT600), company accounts (Balance Sheet, P&L), or general UK business tax.
Avoid these recent topics: ${recentTitles || 'none'}.
Reply with ONLY the topic sentence, no explanation.`,
        }],
      });

      topics.push((topicMsg.content[0] as { type: string; text: string }).text.trim());
    }

    const results = [];
    const today = new Date().toISOString().slice(0, 10);

    for (let i = 0; i < topics.length; i++) {
      const pubDate = isSeeding
        ? new Date(Date.now() - (topics.length - 1 - i) * 24 * 60 * 60 * 1000).toISOString()
        : new Date().toISOString();

      const article = await generateArticle(topics[i]);
      const slug = toSlug(article.title, isSeeding ? new Date(pubDate).toISOString().slice(0, 10) : today);

      const error = await insertDraft({
        title: article.title,
        slug,
        excerpt: article.excerpt,
        content: article.content,
        published_at: pubDate,
        sources: normaliseSources(article.sources),
      });

      results.push({ topic: topics[i], title: article.title, slug, error });
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
      results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

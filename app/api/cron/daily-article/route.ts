import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/lib/supabase';

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
];

async function generateArticle(topic: string): Promise<{ title: string; excerpt: string; content: string }> {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `You are a UK tax expert writing for EasyTax, a platform for UK freelancers and self-employed professionals.

Today is ${today}. Write a practical, informative article about the following topic:
"${topic}"

Make it specific to UK tax rules, accurate, and actionable for freelancers.

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "title": "A clear, engaging headline (max 80 characters)",
  "excerpt": "2-3 sentence summary of the article",
  "content": "Full article HTML using only <h2>, <p>, <ul>, <li>, <strong> tags. 500-700 words. Practical and specific."
}`,
    }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  return JSON.parse(raw);
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
          content: `You are a UK tax expert. Suggest ONE specific, practical article topic for UK freelancers and self-employed people.
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

      const { error } = await supabase.from('tax_articles').insert({
        title: article.title,
        slug,
        excerpt: article.excerpt,
        content: article.content,
        published_at: pubDate,
      });

      results.push({ topic: topics[i], title: article.title, slug, error: error?.message ?? null });
    }

    return NextResponse.json({ ok: true, generated: results.length, results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { articleUrl, submitToIndexNow } from '@/lib/indexnow';

// The review queue for generated articles.
//
// /api/cron/daily-article now inserts drafts instead of publishing straight to
// the site. This is the other half: read what is waiting, then publish or
// reject it. Publishing stamps the reviewer and the date — which is what the
// notice on the article page and the `reviewedBy` in its JSON-LD are drawn
// from, so neither can claim a review that did not happen.
//
//   GET  /api/admin/article-review?key=<AGENT_METRICS_KEY>[&slug=…]
//   POST /api/admin/article-review?key=<AGENT_METRICS_KEY>
//        { "slug": "...", "action": "publish" | "reject", "reviewer": "Lin Li" }
//
// Same key as /api/admin/daily-metrics. That endpoint is read-only aggregates;
// this one changes what the public site serves, so it is worth saying plainly:
// anyone holding the key can publish a page. Rotate it if it leaks.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MISSING_COLUMN = new Set(['42703', 'PGRST204', 'PGRST100']);

function unauthorised(req: NextRequest): NextResponse | null {
  const expected = process.env.AGENT_METRICS_KEY;
  if (!expected) {
    return NextResponse.json({ error: 'AGENT_METRICS_KEY is not configured.' }, { status: 503 });
  }
  if (req.nextUrl.searchParams.get('key') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

function migrationMissing(): NextResponse {
  return NextResponse.json(
    {
      error:
        'tax_articles.review_status does not exist. Run ' +
        'supabase/migrations/20260906_editorial_and_scorecard.sql in the Supabase SQL editor.',
    },
    { status: 503 },
  );
}

export async function GET(req: NextRequest) {
  const denied = unauthorised(req);
  if (denied) return denied;

  const slug = req.nextUrl.searchParams.get('slug');

  // A single draft comes back with its body, so it can actually be read before
  // being published. The list deliberately does not — a queue listing that
  // ships 20 full articles is unreadable.
  const query = slug
    ? supabase
        .from('tax_articles')
        .select('title, slug, excerpt, content, sources, published_at, review_status')
        .eq('slug', slug)
        .single()
    : supabase
        .from('tax_articles')
        .select('title, slug, excerpt, sources, published_at')
        .eq('review_status', 'draft')
        .order('published_at', { ascending: true })
        .limit(50);

  const { data, error } = await query;

  if (error) {
    if (MISSING_COLUMN.has(error.code ?? '')) return migrationMissing();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (slug) return NextResponse.json({ ok: true, article: data });

  const rows = (data ?? []) as { slug: string }[];
  return NextResponse.json({
    ok: true,
    pending: rows.length,
    drafts: data,
    review_url: `https://easytax.vip/api/admin/article-review?key=…&slug=<slug>`,
  });
}

export async function POST(req: NextRequest) {
  const denied = unauthorised(req);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const slug = typeof b.slug === 'string' ? b.slug.trim() : '';
  const action = b.action === 'publish' || b.action === 'reject' ? b.action : null;
  const reviewer =
    typeof b.reviewer === 'string' && b.reviewer.trim()
      ? b.reviewer.trim().slice(0, 120)
      : 'the EasyTax editorial team';

  if (!slug || !action) {
    return NextResponse.json(
      { error: 'Body must be { slug: string, action: "publish" | "reject", reviewer?: string }.' },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('tax_articles')
    .update({
      review_status: action === 'publish' ? 'published' : 'rejected',
      // Recorded for a rejection too: it is still the moment a person looked.
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewer,
    })
    .eq('slug', slug)
    .eq('review_status', 'draft')
    .select('slug, title');

  if (error) {
    if (MISSING_COLUMN.has(error.code ?? '')) return migrationMissing();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    // Either the slug is wrong or it is no longer a draft. Both mean "nothing
    // changed", and saying which would let the key-less enumerate slugs.
    return NextResponse.json(
      { error: 'No draft found with that slug. It may already have been reviewed.' },
      { status: 404 },
    );
  }

  // Only a publish is worth telling a search engine about; a rejected draft was
  // never a URL. Deliberately awaited — the caller is a person waiting on one
  // request, and knowing whether the ping landed is more useful than saving
  // them 200ms.
  const indexnow =
    action === 'publish' ? await submitToIndexNow([articleUrl(slug)]) : null;

  return NextResponse.json({ ok: true, action, slug, title: data[0].title, indexnow });
}

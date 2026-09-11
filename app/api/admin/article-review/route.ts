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
// It also handles the second queue: rewrites of articles that are already
// live. Those are staged in the `pending_*` columns rather than inserted as new
// drafts, so the published page is unaffected until `promote` swaps the rewrite
// into place — an archive of 573-to-724-word stubs has to be fixable without
// any of it going dark while it waits for a reviewer.
//
//        { "slug": "...", "action": "promote" | "discard", "reviewer": "Lin Li" }
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
  // A single article comes back with both bodies where a rewrite is staged, so
  // the reviewer can compare rather than take the replacement on trust. The
  // list deliberately does not — a queue listing that ships 20 full articles is
  // unreadable.
  if (slug) {
    const { data, error } = await supabase
      .from('tax_articles')
      .select(
        'title, slug, excerpt, content, sources, published_at, review_status, ' +
          'pending_title, pending_excerpt, pending_content, pending_sources, pending_generated_at',
      )
      .eq('slug', slug)
      .single();

    if (error) {
      if (MISSING_COLUMN.has(error.code ?? '')) return migrationMissing();
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, article: data });
  }

  const { data, error } = await supabase
    .from('tax_articles')
    .select('title, slug, excerpt, sources, published_at')
    .eq('review_status', 'draft')
    .order('published_at', { ascending: true })
    .limit(50);

  if (error) {
    if (MISSING_COLUMN.has(error.code ?? '')) return migrationMissing();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Staged rewrites are a separate queue with separate actions, so they are
  // listed separately. A missing column here means the 20260909 migration has
  // not run; that is worth reporting but must not fail the draft listing, which
  // is the older and more important of the two.
  const upgrades = await supabase
    .from('tax_articles')
    .select('title, slug, pending_title, pending_generated_at')
    .not('pending_generated_at', 'is', null)
    .order('pending_generated_at', { ascending: true })
    .limit(50);

  const upgradesUnavailable = upgrades.error && MISSING_COLUMN.has(upgrades.error.code ?? '');

  const rows = (data ?? []) as { slug: string }[];
  return NextResponse.json({
    ok: true,
    pending: rows.length,
    drafts: data,
    pending_upgrades: upgradesUnavailable ? null : (upgrades.data ?? []).length,
    upgrades: upgradesUnavailable ? null : upgrades.data,
    upgrades_note: upgradesUnavailable
      ? 'Run supabase/migrations/20260909_article_upgrades.sql to enable staged rewrites.'
      : undefined,
    review_url: `https://easytax.vip/api/admin/article-review?key=…&slug=<slug>`,
  });
}

/**
 * Swaps a staged rewrite into the live columns, or throws it away.
 *
 * Read-then-write rather than a single UPDATE … SET content = pending_content,
 * because PostgREST cannot express a column-to-column assignment and doing it
 * in SQL would mean a database function to maintain. The race that costs — two
 * reviewers promoting the same slug at once — writes the same bytes twice.
 *
 * The title moves with the body but the slug never does. A promoted rewrite is
 * the same page made better, so changing its URL would throw away whatever
 * index position and inbound links it had, which is the one thing the archive
 * has that a new page does not.
 */
async function reviewUpgrade(
  slug: string,
  action: 'promote' | 'discard',
  reviewer: string,
): Promise<NextResponse> {
  const cleared = {
    pending_title: null,
    pending_excerpt: null,
    pending_content: null,
    pending_sources: null,
    pending_generated_at: null,
  };

  const { data: row, error: readError } = await supabase
    .from('tax_articles')
    .select('slug, title, pending_title, pending_excerpt, pending_content, pending_sources, pending_generated_at')
    .eq('slug', slug)
    .not('pending_generated_at', 'is', null)
    .maybeSingle();

  if (readError) {
    if (MISSING_COLUMN.has(readError.code ?? '')) {
      return NextResponse.json(
        {
          error:
            'tax_articles.pending_content does not exist. Run ' +
            'supabase/migrations/20260909_article_upgrades.sql in the Supabase SQL editor.',
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }

  if (!row) {
    return NextResponse.json({ error: 'No staged rewrite found for that slug.' }, { status: 404 });
  }

  const pending = row as {
    title: string;
    pending_title: string | null;
    pending_excerpt: string | null;
    pending_content: string | null;
    pending_sources: unknown;
  };

  const update =
    action === 'discard'
      ? cleared
      : {
          ...cleared,
          title: pending.pending_title ?? pending.title,
          excerpt: pending.pending_excerpt,
          content: pending.pending_content,
          sources: pending.pending_sources,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewer,
        };

  const { error: writeError } = await supabase
    .from('tax_articles')
    .update(update)
    .eq('slug', slug);

  if (writeError) {
    return NextResponse.json({ error: writeError.message }, { status: 500 });
  }

  // A promoted rewrite changes what the URL serves, so the URL is worth
  // re-announcing; a discarded one never reached the page.
  const indexnow = action === 'promote' ? await submitToIndexNow([articleUrl(slug)]) : null;

  return NextResponse.json({
    ok: true,
    action,
    slug,
    title: action === 'promote' ? (pending.pending_title ?? pending.title) : pending.title,
    indexnow,
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

  const ACTIONS = ['publish', 'reject', 'promote', 'discard'] as const;
  type Action = (typeof ACTIONS)[number];

  const b = (body ?? {}) as Record<string, unknown>;
  const slug = typeof b.slug === 'string' ? b.slug.trim() : '';
  const action = ACTIONS.includes(b.action as Action) ? (b.action as Action) : null;
  const reviewer =
    typeof b.reviewer === 'string' && b.reviewer.trim()
      ? b.reviewer.trim().slice(0, 120)
      : 'the EasyTax editorial team';

  if (!slug || !action) {
    return NextResponse.json(
      { error: `Body must be { slug: string, action: ${ACTIONS.map(a => `"${a}"`).join(' | ')}, reviewer?: string }.` },
      { status: 400 },
    );
  }

  if (action === 'promote' || action === 'discard') {
    return reviewUpgrade(slug, action, reviewer);
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

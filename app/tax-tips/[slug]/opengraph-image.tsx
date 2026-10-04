import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { hasSupabaseEnv } from '../_lib/articles';
import { selectPublished } from '../_lib/review';

export const alt = 'EasyTax Tax Tips';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 3600;

// One card per article, carrying that article's own headline.
//
// The archive is 113 pages and every one of them shared a single site-wide
// preview image — which, until this round, did not exist at all. An article
// link posted anywhere therefore looked identical to a link to the pricing
// page. The headline is the only part of an article a reader sees before
// deciding whether to click, so it is the part that has to be on the card.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Preview deployments have no Supabase credentials and `supabaseAdmin`
  // throws without them. The generic card is a better answer than a 500 on
  // an image URL, which is invisible until someone shares the link.
  let title = 'Tax Tips';
  let excerpt =
    'Plain-English UK tax guidance for sole traders, landlords and limited companies.';

  if (hasSupabaseEnv()) {
    const { data } = await selectPublished(gated => {
      const q = supabase.from('tax_articles').select('title, excerpt');
      return (gated ? q.eq('review_status', 'published') : q).eq('slug', slug).single();
    });
    if (data) {
      title = data.title;
      excerpt = data.excerpt ?? excerpt;
    }
  }

  return renderOgCard({
    eyebrow: 'Tax Tips',
    title,
    subtitle: excerpt,
    footnote: 'easytax.vip/tax-tips',
  });
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ArticleIndex from '../../_components/ArticleIndex';
import { getArticlePage, getTotalPages } from '../../_lib/articles';

// Pages 2..N of the Tax Tips archive.
//
// Page 1 lives at /tax-tips (not /tax-tips/page/1) so there is exactly one URL
// for the index and no duplicate-content split.

export const revalidate = 3600;

export async function generateStaticParams() {
  const totalPages = await getTotalPages();
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({ n: String(i + 2) }));
}

function parsePage(n: string): number | null {
  if (!/^\d+$/.test(n)) return null;
  const page = Number(n);
  // Page 1 is /tax-tips; serving it here too would duplicate the index.
  return page >= 2 ? page : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string }>;
}): Promise<Metadata> {
  const { n } = await params;
  const page = parsePage(n);
  if (!page) return {};

  return {
    title: `Tax Tips & Insights — page ${page} | EasyTax`,
    description:
      'Daily UK tax tips, HMRC updates and Self Assessment guidance for freelancers and self-employed professionals.',
    alternates: { canonical: `https://easytax.vip/tax-tips/page/${page}` },
  };
}

export default async function TaxTipsPaginated({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const page = parsePage(n);
  if (!page) notFound();

  const { articles, total, totalPages } = await getArticlePage(page);
  if (page > totalPages) notFound();

  return <ArticleIndex articles={articles} page={page} totalPages={totalPages} total={total} />;
}

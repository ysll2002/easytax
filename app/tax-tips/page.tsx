import type { Metadata } from 'next';
import ArticleIndex from './_components/ArticleIndex';
import { getArticlePage } from './_lib/articles';

export const metadata: Metadata = {
  title: 'Tax Tips & Insights | EasyTax',
  description:
    'Daily UK tax tips, HMRC updates and Self Assessment guidance for freelancers and self-employed professionals.',
  alternates: { canonical: 'https://easytax.vip/tax-tips' },
};

export const revalidate = 3600;

export default async function TaxTipsPage() {
  const { articles, total, totalPages } = await getArticlePage(1);
  return <ArticleIndex articles={articles} page={1} totalPages={totalPages} total={total} />;
}

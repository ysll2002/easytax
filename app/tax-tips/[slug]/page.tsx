import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { Calendar, ChevronLeft } from 'lucide-react';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = await supabase.from('tax_articles').select('title, excerpt').eq('slug', slug).single();
  if (!data) return {};
  return { title: `${data.title} | EasyTax`, description: data.excerpt };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: article } = await supabase
    .from('tax_articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!article) notFound();

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#FDFCF8', color: '#1C1208' }}>
      <SiteHeader />

      <main className="flex-grow">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-20">
          <Link href="/tax-tips" className="inline-flex items-center gap-1 text-sm mb-8" style={{ color: '#9A8F83', textDecoration: 'none' }}>
            <ChevronLeft size={14} /> Back to Tax Tips
          </Link>

          <div className="flex items-center gap-1.5 mb-4">
            <Calendar size={13} color="#9A8F83" />
            <span className="text-sm" style={{ color: '#9A8F83' }}>
              {new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: '#1C1208', lineHeight: 1.2, marginBottom: '1.25rem' }}>
            {article.title}
          </h1>

          <p className="text-lg leading-relaxed mb-8 pb-8" style={{ color: '#4A4035', borderBottom: '1px solid #E8E2DA' }}>
            {article.excerpt}
          </p>

          <div
            className="prose-article"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <div className="mt-12 pt-8" style={{ borderTop: '1px solid #E8E2DA' }}>
            <p className="text-xs mb-4" style={{ color: '#9A8F83' }}>
              This article is for general information only and does not constitute tax advice. For your specific situation, consult a qualified accountant.
            </p>
            <Link href="/tax-tips" className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: '#C4622D', textDecoration: 'none' }}>
              ← More Tax Tips
            </Link>
          </div>
        </article>
      </main>

      <footer style={{ borderTop: '1px solid #2E2418', backgroundColor: '#1C1208', padding: '2rem 0' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1rem', color: '#4A4035' }}>
            EasyTax Ltd. Built in London.
          </div>
          <div className="flex gap-6 text-sm" style={{ color: '#4A4035' }}>
            <Link href="/privacy" className="hover:text-[#C4622D] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#C4622D] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

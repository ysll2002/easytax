import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { Calendar } from 'lucide-react';

export const metadata = {
  title: 'Tax Tips & Insights | EasyTax',
  description: 'Daily UK tax tips, HMRC updates and Self Assessment guidance for freelancers and self-employed professionals.',
};

export const revalidate = 3600;

export default async function TaxTipsPage() {
  const { data: articles } = await supabase
    .from('tax_articles')
    .select('title, slug, excerpt, published_at')
    .order('published_at', { ascending: false })
    .limit(30);

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#FDFCF8', color: '#1C1208' }}>
      <SiteHeader />

      <main className="flex-grow">
        <section className="pt-12 sm:pt-16 pb-16 sm:pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4" style={{ backgroundColor: '#F0EBE1', color: '#C4622D', border: '1px solid #C4622D30' }}>
                Updated daily
              </div>
              <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, color: '#1C1208', lineHeight: 1.15, marginBottom: '1rem' }}>
                What you need to know<br />
                <em style={{ color: '#C4622D', fontStyle: 'italic' }}>about the tax.</em>
              </h1>
              <p style={{ color: '#9A8F83', fontSize: '1.05rem', maxWidth: '520px' }}>
                Practical UK tax guidance for freelancers and self-employed professionals — a new article every morning.
              </p>
            </div>

            {!articles || articles.length === 0 ? (
              <div className="py-20 text-center" style={{ color: '#9A8F83' }}>
                <p className="text-lg font-medium mb-2">First article coming tomorrow at 8am.</p>
                <p className="text-sm">Check back soon.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {articles.map((a) => (
                  <Link key={a.slug} href={`/tax-tips/${a.slug}`} style={{ textDecoration: 'none' }}>
                    <div className="p-5 sm:p-6 rounded-2xl transition-all hover:shadow-md" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2DA' }}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Calendar size={12} color="#9A8F83" />
                        <span className="text-xs" style={{ color: '#9A8F83' }}>
                          {new Date(a.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <h2 className="font-bold mb-2" style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.1rem', color: '#1C1208', lineHeight: 1.35 }}>
                        {a.title}
                      </h2>
                      <p className="text-sm leading-relaxed" style={{ color: '#4A4035' }}>{a.excerpt}</p>
                      <p className="text-sm font-medium mt-3" style={{ color: '#C4622D' }}>Read more →</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { Landmark, Sparkles, Send, CheckCircle2, Clock, ShieldCheck, Calendar, FileText, BarChart2, Receipt, Building2, User } from 'lucide-react';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';
import { getTranslations } from 'next-intl/server';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('home.meta');
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: 'https://easytax.vip' },
  };
}

export default async function Home() {
  const session = await auth();
  const ctaHref = session ? '/dashboard' : '/register';
  const t = await getTranslations('home');

  const { data: latestArticles } = await supabase
    .from('tax_articles')
    .select('title, slug, excerpt, published_at')
    .order('published_at', { ascending: false })
    .limit(3);

  const Q1_DEADLINE = new Date('2026-08-05T23:59:59Z');
  const daysToQ1 = Math.max(0, Math.ceil((Q1_DEADLINE.getTime() - Date.now()) / 86_400_000));

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}>

      {/* ── MTD 2026 announcement bar ── */}
      <div style={{ backgroundColor: '#1C1208', padding: '0.6rem 1rem', textAlign: 'center' }}>
        <p style={{ color: '#FDFCF8', fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>
          <span style={{ color: '#C4622D' }}>{t('announcement.live')}</span> {t('announcement.deadline')} <span style={{ color: '#6B8E6E' }}>{t('announcement.freeCallout')}</span>
        </p>
      </div>

      <SiteHeader />

      <main className="flex-grow">

        {/* ── Hero ── */}
        <section className="relative pt-12 sm:pt-16 pb-16 sm:pb-24 overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #C4622D 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6 sm:mb-8" style={{ border: '1px solid #C4622D40', color: '#C4622D', backgroundColor: '#F0EBE1' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ backgroundColor: '#C4622D' }} />
                  {t('hero.pill', { days: daysToQ1 })}
                </div>

                <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(1.75rem, 5vw, 2.75rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#1C1208', marginBottom: '1.25rem' }}>
                  {t('hero.title1')}<br />
                  <span style={{ color: '#6B8E6E' }}>{t('hero.title2')}</span>{' '}
                  <em style={{ color: '#C4622D', fontStyle: 'italic' }}>{t('hero.title3')}</em>
                </h1>

                <p className="text-base sm:text-xl leading-relaxed mb-6" style={{ color: '#4A4035', maxWidth: '520px' }}>
                  {t('hero.subtitle')} <strong style={{ color: '#1C1208' }}>{t('hero.subtitleEmph')}</strong>
                </p>

                <div className="flex items-center gap-3 mb-7 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#6B8E6E', color: '#FDFCF8' }}>
                    {t('hero.badgeFree')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>
                    {t('hero.badgeNoCard')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#4A4035', border: '1px solid #DDD5C8' }}>
                    {t('hero.badgeHmrc')}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={ctaHref} className="inline-block px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-medium text-sm text-center transition-all" style={{ backgroundColor: '#1C1208', color: '#FDFCF8' }}>
                    {t('hero.ctaPrimary')}
                  </Link>
                  <a href="#services" className="inline-block px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-medium text-sm text-center transition-all" style={{ backgroundColor: 'transparent', color: '#1C1208', border: '1px solid #DDD5C8' }}>
                    {t('hero.ctaSecondary')}
                  </a>
                </div>
              </div>

              <div className="hidden lg:block flex-shrink-0" style={{ width: '480px' }}>
                <div style={{ borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.12)', border: '1px solid #E8E2DA' }}>
                  <img
                    src="/dashboard-preview.png"
                    alt="EasyTax dashboard"
                    style={{ width: '100%', display: 'block' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust bar ── */}
        <section style={{ borderTop: '1px solid #E8E2DA', borderBottom: '1px solid #E8E2DA', backgroundColor: '#F8F5F0', padding: '1.75rem 0' }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10">
              {[
                { Icon: CheckCircle2, label: t('trust.hmrc'),     color: '#059669' },
                { Icon: ShieldCheck,  label: t('trust.security'), color: '#FF6B35' },
                { Icon: Clock,        label: t('trust.fast'),     color: '#7C3AED' },
                { Icon: Sparkles,     label: t('trust.ai'),       color: '#C9963D' },
                { Icon: Building2,    label: t('trust.company'),  color: '#1C1208' },
              ].map(({ Icon, label, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon size={16} color={color} strokeWidth={2} />
                  <span className="text-sm font-medium" style={{ color: '#4A4035' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Services ── */}
        <section id="services" className="py-20 sm:py-28" style={{ backgroundColor: '#FDFCF8' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="mb-14 max-w-2xl">
              <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#1C1208', marginBottom: '1rem' }}>
                {t('services.title1')}<br />
                <em style={{ color: '#C4622D', fontStyle: 'italic' }}>{t('services.title2')}</em>
              </h2>
              <p style={{ color: '#9A8F83', fontSize: '1.05rem', lineHeight: 1.7 }}>
                {t('services.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">

              {/* Sole traders / freelancers */}
              <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: '#F8F5F0', border: '1px solid #E8E2DA' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1C1208' }}>
                    <User size={18} color="#FDFCF8" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>{t('services.freelancer.kicker')}</p>
                    <h3 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#1C1208' }}>{t('services.freelancer.title')}</h3>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: FileText,  label: t('services.freelancer.f1Label'), desc: t('services.freelancer.f1Desc') },
                    { icon: Sparkles,  label: t('services.freelancer.f2Label'), desc: t('services.freelancer.f2Desc') },
                    { icon: Landmark,  label: t('services.freelancer.f3Label'), desc: t('services.freelancer.f3Desc') },
                    { icon: Receipt,   label: t('services.freelancer.f4Label'), desc: t('services.freelancer.f4Desc') },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex gap-3 p-4 rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2DA' }}>
                      <Icon size={16} color="#6B8E6E" strokeWidth={2} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#1C1208' }}>{label}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#9A8F83', lineHeight: 1.5 }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Link href={ctaHref} className="inline-block px-5 py-2.5 rounded-full text-sm font-medium" style={{ backgroundColor: '#1C1208', color: '#FDFCF8' }}>
                    {t('services.freelancer.cta')}
                  </Link>
                </div>
              </div>

              {/* Limited companies */}
              <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: '#1C1208', border: '1px solid #2E2418' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#C4622D' }}>
                    <Building2 size={18} color="#FDFCF8" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>{t('services.company.kicker')}</p>
                    <h3 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#FDFCF8' }}>{t('services.company.title')}</h3>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: Receipt,    label: t('services.company.f1Label'), desc: t('services.company.f1Desc') },
                    { icon: Send,       label: t('services.company.f2Label'), desc: t('services.company.f2Desc') },
                    { icon: BarChart2,  label: t('services.company.f3Label'), desc: t('services.company.f3Desc') },
                    { icon: FileText,   label: t('services.company.f4Label'), desc: t('services.company.f4Desc') },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex gap-3 p-4 rounded-xl" style={{ backgroundColor: '#2E2418', border: '1px solid #3D3025' }}>
                      <Icon size={16} color="#C4622D" strokeWidth={2} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#FDFCF8' }}>{label}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#9A8F83', lineHeight: 1.5 }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Link href={ctaHref} className="inline-block px-5 py-2.5 rounded-full text-sm font-medium" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                    {t('services.company.cta')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="py-16 sm:py-24" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
              <div>
                <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#1C1208', marginBottom: '1.25rem' }}>
                  {t('how.title1')}<br />
                  <em style={{ color: '#C4622D', fontStyle: 'italic' }}>{t('how.title2')}</em>
                </h2>
                <p style={{ color: '#4A4035', lineHeight: 1.8, marginBottom: '1.75rem' }}>
                  {t('how.body')}
                </p>
                <div className="flex flex-col gap-2 mb-8">
                  <div className="flex items-baseline gap-2">
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.75rem', fontWeight: 700, color: '#6B8E6E', lineHeight: 1 }}>{t('how.priceLabel')}</span>
                  </div>
                  <p style={{ color: '#9A8F83', fontSize: '0.875rem' }}>{t('how.priceCaption')}</p>
                </div>
                <Link href={ctaHref} className="inline-block px-8 py-3.5 rounded-full font-medium transition-all" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                  {t('how.cta')}
                </Link>
              </div>

              <div className="space-y-4">
                {[
                  { Icon: ShieldCheck,  title: t('how.step1Title'), desc: t('how.step1Desc'), color: '#FF6B35' },
                  { Icon: Sparkles,     title: t('how.step2Title'), desc: t('how.step2Desc'), color: '#7C3AED' },
                  { Icon: CheckCircle2, title: t('how.step3Title'), desc: t('how.step3Desc'), color: '#059669' },
                ].map((step) => (
                  <div key={step.title} className="flex gap-4 p-5 rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2DA' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: step.color + '15' }}>
                      <step.Icon size={18} color={step.color} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>{step.title}</p>
                      <p className="text-sm" style={{ color: '#9A8F83', lineHeight: 1.6 }}>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="py-20 sm:py-28" style={{ backgroundColor: '#FDFCF8' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-center mb-14" style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#1C1208' }}>
              {t('faq.title1')} <em style={{ color: '#C4622D', fontStyle: 'italic' }}>{t('faq.title2')}</em>
            </h2>
            <div style={{ borderTop: '1px solid #DDD5C8' }}>
              {[
                { q: t('faq.q1Q'), a: t('faq.q1A') },
                { q: t('faq.q2Q'), a: t('faq.q2A') },
                { q: t('faq.q3Q'), a: t('faq.q3A') },
                { q: t('faq.q4Q'), a: t('faq.q4A') },
                { q: t('faq.q5Q'), a: t('faq.q5A') },
                { q: t('faq.q6Q'), a: t('faq.q6A') },
              ].map((item) => (
                <details key={item.q} className="group py-5 sm:py-6" style={{ borderBottom: '1px solid #DDD5C8' }}>
                  <summary className="flex justify-between items-center cursor-pointer list-none font-semibold text-sm sm:text-base" style={{ color: '#1C1208' }}>
                    {item.q}
                    <span style={{ color: '#C4622D', fontSize: '1.25rem', lineHeight: 1, flexShrink: 0, marginLeft: '1rem' }}>+</span>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed" style={{ color: '#4A4035' }}>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Tax Tips ── */}
        <section className="py-16 sm:py-24" style={{ backgroundColor: '#FDFCF8', borderTop: '1px solid #E8E2DA' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3" style={{ backgroundColor: '#F0EBE1', color: '#C4622D', border: '1px solid #C4622D30' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ backgroundColor: '#C4622D' }} />
                  {t('tips.kicker')}
                </div>
                <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: '#1C1208', lineHeight: 1.2 }}>
                  {t('tips.title1')}<br />
                  <em style={{ color: '#C4622D', fontStyle: 'italic' }}>{t('tips.title2')}</em>
                </h2>
              </div>
              <Link href="/tax-tips" className="text-sm font-medium flex-shrink-0" style={{ color: '#C4622D', textDecoration: 'none' }}>
                {t('tips.viewAll')}
              </Link>
            </div>

            {latestArticles && latestArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {latestArticles.map((a) => (
                  <Link key={a.slug} href={`/tax-tips/${a.slug}`} style={{ textDecoration: 'none' }}>
                    <div className="h-full p-6 rounded-2xl transition-all hover:shadow-md flex flex-col" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2DA' }}>
                      <div className="flex items-center gap-1.5 mb-3">
                        <Calendar size={12} color="#9A8F83" />
                        <span className="text-xs" style={{ color: '#9A8F83' }}>
                          {new Date(a.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="font-bold mb-2 flex-1" style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1rem', color: '#1C1208', lineHeight: 1.4 }}>
                        {a.title}
                      </h3>
                      <p className="text-xs leading-relaxed mb-4" style={{ color: '#9A8F83' }}>
                        {a.excerpt.slice(0, 100)}…
                      </p>
                      <p className="text-xs font-medium" style={{ color: '#C4622D' }}>{t('tips.readMore')}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center rounded-2xl" style={{ backgroundColor: '#F8F5F0', border: '1px solid #E8E2DA' }}>
                <p className="font-medium" style={{ color: '#4A4035' }}>{t('tips.empty')}</p>
                <Link href="/tax-tips" className="text-sm mt-2 inline-block" style={{ color: '#C4622D' }}>{t('tips.visit')}</Link>
              </div>
            )}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 sm:py-28" style={{ backgroundColor: '#1C1208' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(2rem, 5vw, 3.75rem)', fontWeight: 700, color: '#FDFCF8', lineHeight: 1.1, marginBottom: '1.5rem' }}>
              {t('finalCta.title1')}<br />
              <em style={{ color: '#C4622D', fontStyle: 'italic' }}>{t('finalCta.title2')}</em>
            </h2>
            <p style={{ color: '#9A8F83', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
              {t('finalCta.subtitle')}
            </p>
            <Link href={ctaHref} className="inline-block px-10 py-4 rounded-full font-medium text-lg transition-all" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
              {t('finalCta.button')}
            </Link>
          </div>
        </section>

      </main>

      <footer style={{ borderTop: '1px solid #2E2418', backgroundColor: '#1C1208', padding: '3rem 0' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.1rem', color: '#4A4035' }}>
            {t('footer.tagline')}
          </div>
          <div className="flex gap-6 text-sm" style={{ color: '#4A4035' }}>
            <Link href="/privacy" className="hover:text-[#C4622D] transition-colors">{t('footer.privacy')}</Link>
            <Link href="/terms" className="hover:text-[#C4622D] transition-colors">{t('footer.terms')}</Link>
            <Link href="#" className="hover:text-[#C4622D] transition-colors">{t('footer.twitter')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

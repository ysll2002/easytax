import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { Landmark, Sparkles, Send, CheckCircle2, Clock, ShieldCheck, Calendar, FileText, BarChart2, Receipt, Building2, User } from 'lucide-react';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';

export const revalidate = 3600;

export default async function Home() {
  const session = await auth();
  const ctaHref = session ? '/dashboard' : '/register';

  const { data: latestArticles } = await supabase
    .from('tax_articles')
    .select('title, slug, excerpt, published_at')
    .order('published_at', { ascending: false })
    .limit(3);

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}>

      <SiteHeader />

      <main className="flex-grow">

        {/* ── Hero ── */}
        <section className="relative pt-12 sm:pt-16 pb-16 sm:pb-24 overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #C4622D 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6 sm:mb-10" style={{ border: '1px solid #DDD5C8', color: '#9A8F83', backgroundColor: '#F0EBE1' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ backgroundColor: '#C4622D' }} />
                  Now supporting limited companies
                </div>

                <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', color: '#1C1208', marginBottom: '1.25rem' }}>
                  Self Assessment, VAT &<br />
                  <span style={{ color: '#6B8E6E' }}>Company Accounts,</span>{' '}
                  <em style={{ color: '#C4622D', fontStyle: 'italic' }}>sorted.</em>
                </h1>

                <p className="text-base sm:text-xl leading-relaxed mb-8" style={{ color: '#4A4035', maxWidth: '500px' }}>
                  One platform for UK freelancers and limited companies. File to HMRC in minutes — Self Assessment, VAT returns, CT600, Balance Sheet, and P&amp;L.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={ctaHref} className="inline-block px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-medium text-sm text-center transition-all" style={{ backgroundColor: '#1C1208', color: '#FDFCF8' }}>
                    Get Early Access
                  </Link>
                  <a href="#services" className="inline-block px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-medium text-sm text-center transition-all" style={{ backgroundColor: 'transparent', color: '#1C1208', border: '1px solid #DDD5C8' }}>
                    See what we cover →
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
                { Icon: CheckCircle2, label: 'HMRC Recognised',    color: '#059669' },
                { Icon: ShieldCheck,  label: 'Bank-grade Security', color: '#FF6B35' },
                { Icon: Clock,        label: 'File in 5 Minutes',   color: '#7C3AED' },
                { Icon: Sparkles,     label: 'AI-powered',          color: '#C9963D' },
                { Icon: Building2,    label: 'Limited Companies',   color: '#1C1208' },
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
                Everything covered,<br />
                <em style={{ color: '#C4622D', fontStyle: 'italic' }}>whoever you are.</em>
              </h2>
              <p style={{ color: '#9A8F83', fontSize: '1.05rem', lineHeight: 1.7 }}>
                Whether you&apos;re a freelancer filing Self Assessment or a limited company managing full accounts, EasyTax has you covered.
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
                    <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>For Freelancers & Sole Traders</p>
                    <h3 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#1C1208' }}>Personal & Self-Employment</h3>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: FileText,  label: 'Self Assessment (SA100)',        desc: 'File your annual return directly to HMRC in minutes.' },
                    { icon: Sparkles,  label: 'Making Tax Digital (MTD ITSA)',  desc: 'Quarterly updates to HMRC — stay ahead of the 2026 mandate.' },
                    { icon: Landmark,  label: 'Open Banking',                   desc: 'Connect your bank and auto-import transactions.' },
                    { icon: Receipt,   label: 'Expense Categorisation',         desc: 'AI tags every transaction. You approve in seconds.' },
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
                    Start Self Assessment →
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
                    <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A8F83' }}>For Limited Companies</p>
                    <h3 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#FDFCF8' }}>Company Accounts & Tax</h3>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: Receipt,    label: 'VAT Return',             desc: 'File quarterly or annual VAT returns directly via MTD-compliant API.' },
                    { icon: Send,       label: 'CT600 Company Tax',      desc: 'Corporation Tax return filed to HMRC — no accountant needed.' },
                    { icon: BarChart2,  label: 'Balance Sheet',          desc: 'Automatically generated from your transactions and reconciled accounts.' },
                    { icon: FileText,   label: 'Profit & Loss',          desc: 'Real-time P&L statement, categorised by income and expense type.' },
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
                    Set Up Company Account →
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
                  File in five minutes,<br />
                  <em style={{ color: '#C4622D', fontStyle: 'italic' }}>not five hours.</em>
                </h2>
                <p style={{ color: '#4A4035', lineHeight: 1.8, marginBottom: '1.75rem' }}>
                  Connect your bank and HMRC account once. EasyTax pulls your data, categorises everything with AI, and files — whether it&apos;s a Self Assessment, VAT return, or full company accounts.
                </p>
                <div className="flex flex-col gap-2 mb-8">
                  <div className="flex items-baseline gap-2">
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.75rem', fontWeight: 700, color: '#1C1208', lineHeight: 1 }}>£9.9</span>
                    <span style={{ color: '#9A8F83' }}>+ VAT / Self Assessment</span>
                  </div>
                  <p style={{ color: '#9A8F83', fontSize: '0.875rem' }}>Company accounts from £29 · Founder pricing locked for life</p>
                </div>
                <Link href={ctaHref} className="inline-block px-8 py-3.5 rounded-full font-medium transition-all" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                  Start Filing →
                </Link>
              </div>

              <div className="space-y-4">
                {[
                  { Icon: ShieldCheck,  title: 'Connect your accounts',   desc: 'Link your Government Gateway ID and business bank account. We pull your records automatically — no manual data entry.',  color: '#FF6B35' },
                  { Icon: Sparkles,     title: 'AI does the heavy lifting', desc: 'Our AI categorises every transaction, calculates allowable expenses, and prepares your return or company accounts.', color: '#7C3AED' },
                  { Icon: CheckCircle2, title: 'Review, pay & file',       desc: 'Check a plain-English summary of your return. Pay the flat fee and we submit directly to HMRC — instantly confirmed.',  color: '#059669' },
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
              Questions, <em style={{ color: '#C4622D', fontStyle: 'italic' }}>answered.</em>
            </h2>
            <div style={{ borderTop: '1px solid #DDD5C8' }}>
              {[
                { q: 'Does EasyTax support limited companies?',     a: 'Yes. EasyTax supports both sole traders / freelancers (Self Assessment, MTD ITSA) and limited companies (VAT returns, CT600 Corporation Tax, Balance Sheet, and P&L). Company accounts are available from £29 + VAT.' },
                { q: 'What VAT schemes do you support?',            a: 'We support Standard, Flat Rate, and Annual VAT Accounting schemes, filed directly to HMRC via MTD-compliant APIs.' },
                { q: 'How is the Balance Sheet generated?',         a: 'EasyTax automatically derives your Balance Sheet from your reconciled bank transactions, categorised income and expenses, and opening balances you provide during setup.' },
                { q: 'What is the CT600 and do I need it?',         a: 'CT600 is the Corporation Tax return every UK limited company must file with HMRC each year. EasyTax prepares and submits it based on your P&L and company accounts.' },
                { q: 'Is my HMRC data safe?',                       a: 'Your credentials are never stored. We use them to fetch your records via a secure, encrypted connection and discard them immediately after.' },
                { q: 'What\'s the Self Assessment deadline?',       a: 'Online Self Assessment returns are due 31 January each year. VAT returns are due one month and seven days after each VAT period ends. EasyTax tracks all your deadlines automatically.' },
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
                  Updated daily
                </div>
                <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: '#1C1208', lineHeight: 1.2 }}>
                  What you need to know<br />
                  <em style={{ color: '#C4622D', fontStyle: 'italic' }}>about the tax.</em>
                </h2>
              </div>
              <Link href="/tax-tips" className="text-sm font-medium flex-shrink-0" style={{ color: '#C4622D', textDecoration: 'none' }}>
                All articles →
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
                      <p className="text-xs font-medium" style={{ color: '#C4622D' }}>Read more →</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center rounded-2xl" style={{ backgroundColor: '#F8F5F0', border: '1px solid #E8E2DA' }}>
                <p className="font-medium" style={{ color: '#4A4035' }}>First article coming tomorrow at 8am.</p>
                <Link href="/tax-tips" className="text-sm mt-2 inline-block" style={{ color: '#C4622D' }}>Visit Tax Tips →</Link>
              </div>
            )}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 sm:py-28" style={{ backgroundColor: '#1C1208' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(2rem, 5vw, 3.75rem)', fontWeight: 700, color: '#FDFCF8', lineHeight: 1.1, marginBottom: '1.5rem' }}>
              Stop dreading<br />
              <em style={{ color: '#C4622D', fontStyle: 'italic' }}>the paperwork.</em>
            </h2>
            <p style={{ color: '#9A8F83', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
              Get early access and lock in founder pricing for life — whether you&apos;re a freelancer or running a limited company.
            </p>
            <Link href={ctaHref} className="inline-block px-10 py-4 rounded-full font-medium text-lg transition-all" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
              Get Early Access
            </Link>
          </div>
        </section>

      </main>

      <footer style={{ borderTop: '1px solid #2E2418', backgroundColor: '#1C1208', padding: '3rem 0' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.1rem', color: '#4A4035' }}>
            EasyTax Ltd. Built in London.
          </div>
          <div className="flex gap-6 text-sm" style={{ color: '#4A4035' }}>
            <Link href="/privacy" className="hover:text-[#C4622D] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#C4622D] transition-colors">Terms</Link>
            <Link href="#" className="hover:text-[#C4622D] transition-colors">Twitter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { Landmark, Sparkles, Send, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#FDFCF8', color: '#1C1208', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}>

      {/* Header */}
      <SiteHeader />

      <main className="flex-grow">

        {/* Hero */}
        <section className="relative pt-16 pb-28 overflow-hidden">
          {/* Decorative background shapes */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #C4622D 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-8 pointer-events-none" style={{ background: 'radial-gradient(circle, #C9963D 0%, transparent 70%)', transform: 'translate(-40%, 40%)' }} />

          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-10" style={{ border: '1px solid #DDD5C8', color: '#9A8F83', backgroundColor: '#F0EBE1' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ backgroundColor: '#C4622D' }} />
                Launching for 2025/26 Tax Year
              </div>

              <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#1C1208', marginBottom: '1.5rem' }}>
                Self Assessment,{' '}
                <span style={{ color: '#6B8E6E' }}>Making Tax Digital,</span>
                <br />
                <em style={{ color: '#C4622D', fontStyle: 'italic' }}>sorted.</em>
              </h1>

              <p className="text-xl leading-relaxed mb-10" style={{ color: '#4A4035', maxWidth: '520px' }}>
                The simplest way for UK freelancers and contractors to file tax returns.
                Connect your bank, categorize expenses, file to HMRC in minutes.
              </p>

              <Link href="/register" className="inline-block px-8 py-3.5 rounded-full font-medium text-sm text-center transition-all" style={{ backgroundColor: '#1C1208', color: '#FDFCF8' }}>
                Get Early Access
              </Link>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section style={{ borderTop: '1px solid #E8E2DA', borderBottom: '1px solid #E8E2DA', backgroundColor: '#F8F5F0', padding: '2rem 0' }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap justify-center items-center gap-8">
              {[
                { Icon: CheckCircle2, label: 'HMRC Approved', color: '#059669' },
                { Icon: ShieldCheck,  label: 'Bank-grade Security', color: '#FF6B35' },
                { Icon: Clock,        label: 'File in 5 Minutes', color: '#7C3AED' },
                { Icon: Sparkles,     label: 'AI-powered', color: '#C9963D' },
              ].map(({ Icon, label, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon size={16} color={color} strokeWidth={2} />
                  <span className="text-sm font-medium" style={{ color: '#4A4035' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-28" style={{ backgroundColor: '#FDFCF8' }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-20">
              <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#1C1208', marginBottom: '1rem' }}>
                Everything you need<br />
                <em style={{ color: '#C4622D', fontStyle: 'italic' }}>to file confidently.</em>
              </h2>
              <p style={{ color: '#9A8F83', fontSize: '1.1rem' }}>Replace your spreadsheet with something smarter.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  Icon: Landmark,
                  title: 'Bank Connections',
                  body: "Securely connect your business bank account. We automatically pull in transactions so you don't miss a single expense.",
                  iconColor: '#FF6B35',
                  iconBg: 'linear-gradient(135deg, #FFF0EB 0%, #FFD9CC 100%)',
                },
                {
                  Icon: Sparkles,
                  title: 'Smart Categorisation',
                  body: '"Is a coffee meeting deductible?" Our AI categorises transactions and flags potential tax savings instantly.',
                  iconColor: '#7C3AED',
                  iconBg: 'linear-gradient(135deg, #F5F0FF 0%, #DDD6FE 100%)',
                },
                {
                  Icon: Send,
                  title: 'Direct Filing',
                  body: 'Connect your Government Gateway ID once. Review your return, hit submit, and get your HMRC confirmation instantly.',
                  iconColor: '#059669',
                  iconBg: 'linear-gradient(135deg, #ECFDF5 0%, #A7F3D0 100%)',
                },
              ].map((f) => (
                <div key={f.title} className="p-8 rounded-2xl transition-all hover:shadow-md" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2DA' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: f.iconBg }}>
                    <f.Icon size={22} color={f.iconColor} strokeWidth={1.8} />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.75rem' }}>
                    {f.title}
                  </h3>
                  <p style={{ color: '#4A4035', lineHeight: 1.7, fontSize: '0.95rem' }}>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps */}
        <section id="pricing" className="py-28" style={{ backgroundColor: '#F0EBE1' }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#1C1208', marginBottom: '1.5rem' }}>
                  File in five minutes,<br />
                  <em style={{ color: '#C4622D', fontStyle: 'italic' }}>not five hours.</em>
                </h2>
                <p style={{ color: '#4A4035', lineHeight: 1.8, marginBottom: '2rem' }}>
                  We built EasyTax for people who'd rather spend time on their craft than wrestling with HMRC forms. One flat fee. No surprises.
                </p>
                <div className="inline-flex items-end gap-2 mb-2">
                  <span style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '3.5rem', fontWeight: 700, color: '#1C1208', lineHeight: 1 }}>£20</span>
                  <span style={{ color: '#9A8F83', marginBottom: '0.5rem' }}>+ VAT per return</span>
                </div>
                <p style={{ color: '#9A8F83', fontSize: '0.875rem', marginBottom: '2rem' }}>Founder pricing — locked in for life.</p>
                <Link href="/onboarding" className="inline-block px-8 py-3.5 rounded-full font-medium transition-all" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
                  Start Filing →
                </Link>
              </div>

              <div className="space-y-4">
                {[
                  { Icon: ShieldCheck, title: 'Connect HMRC Gateway', desc: 'Securely link your Government Gateway ID. We fetch your income records automatically.', color: '#FF6B35' },
                  { Icon: Sparkles,    title: 'Review Your Expenses',  desc: 'Our AI categorises transactions. You simply approve or reject in seconds.',            color: '#7C3AED' },
                  { Icon: CheckCircle2, title: 'File & Pay',           desc: 'Review your completed return, pay the £20 fee, and we submit directly to HMRC.',       color: '#059669' },
                ].map((step) => (
                  <div key={step.title} className="flex gap-5 p-5 rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2DA' }}>
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

        {/* FAQ */}
        <section id="faq" className="py-28" style={{ backgroundColor: '#FDFCF8' }}>
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-center mb-16" style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#1C1208' }}>
              Questions, <em style={{ color: '#C4622D', fontStyle: 'italic' }}>answered.</em>
            </h2>
            <div className="space-y-0" style={{ borderTop: '1px solid #DDD5C8' }}>
              {[
                { q: 'Is EasyTax FCA regulated?', a: 'EasyTax is a tax filing tool, not a financial adviser. We file your return based on the data you provide. For complex tax situations, we recommend consulting an accountant.' },
                { q: 'Is my HMRC data safe?', a: 'Your credentials are never stored. We use them to fetch your records via a secure, encrypted connection and discard them immediately after.' },
                { q: 'What if I have multiple income sources?', a: 'EasyTax supports PAYE income, self-employment income, rental income, and more — all in one return.' },
                { q: 'What\'s the filing deadline?', a: 'The deadline for online Self Assessment returns is 31 January each year for the previous tax year. EasyTax helps you file well before the rush.' },
              ].map((item) => (
                <details key={item.q} className="group py-6" style={{ borderBottom: '1px solid #DDD5C8' }}>
                  <summary className="flex justify-between items-center cursor-pointer list-none font-semibold" style={{ color: '#1C1208' }}>
                    {item.q}
                    <span style={{ color: '#C4622D', fontSize: '1.25rem', lineHeight: 1 }}>+</span>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed" style={{ color: '#4A4035' }}>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-28" style={{ backgroundColor: '#1C1208' }}>
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 700, color: '#FDFCF8', lineHeight: 1.1, marginBottom: '1.5rem' }}>
              Stop dreading<br />
              <em style={{ color: '#C4622D', fontStyle: 'italic' }}>January 31st.</em>
            </h2>
            <p style={{ color: '#9A8F83', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
              Get early access and lock in founder pricing for life.
            </p>
            <Link href="/onboarding" className="inline-block px-10 py-4 rounded-full font-medium text-lg transition-all" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
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

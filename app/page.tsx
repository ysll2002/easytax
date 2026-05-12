import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { Landmark, Sparkles, Send, CheckCircle2, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#FFFFFF', color: '#0D0D0D', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}>

      <SiteHeader />

      <main className="flex-grow">

        {/* Hero */}
        <section className="pt-20 pb-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-8" style={{ border: '1px solid #E5E7EB', color: '#6B7280', backgroundColor: '#F9FAFB' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ backgroundColor: '#C4622D' }} />
                Launching for 2025/26 Tax Year
              </div>

              <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(2.75rem, 7vw, 5.5rem)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em', color: '#0D0D0D', marginBottom: '1.5rem' }}>
                Self Assessment,
                <br />
                <em style={{ color: '#C4622D', fontStyle: 'italic' }}>sorted.</em>
              </h1>

              <p className="text-xl leading-relaxed mb-10" style={{ color: '#6B7280', maxWidth: '480px' }}>
                The simplest way for UK freelancers to file tax returns. Connect your bank, categorise expenses, file to HMRC in minutes.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-5 py-3.5 rounded-full text-sm focus:outline-none"
                  style={{ border: '1.5px solid #E5E7EB', backgroundColor: '#FFFFFF', color: '#0D0D0D' }}
                />
                <Link href="/onboarding" className="px-7 py-3.5 rounded-full font-semibold text-sm text-center transition-all flex items-center justify-center gap-2" style={{ backgroundColor: '#C4622D', color: '#FFFFFF' }}>
                  Get Early Access <ArrowRight size={15} />
                </Link>
              </div>
              <p className="mt-4 text-xs" style={{ color: '#9CA3AF' }}>
                Join 600+ freelancers on the waitlist. No spam, ever.
              </p>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section style={{ borderTop: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6', padding: '1.5rem 0' }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap justify-center items-center gap-10">
              {[
                { Icon: CheckCircle2, label: 'HMRC Approved' },
                { Icon: ShieldCheck,  label: 'Bank-grade Security' },
                { Icon: Clock,        label: 'File in 5 Minutes' },
                { Icon: Sparkles,     label: 'AI-powered' },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon size={15} color="#C4622D" strokeWidth={1.8} />
                  <span className="text-sm font-medium" style={{ color: '#6B7280' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-28 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-20">
              <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#0D0D0D', marginBottom: '1rem' }}>
                Everything you need<br />
                <em style={{ color: '#C4622D', fontStyle: 'italic' }}>to file confidently.</em>
              </h2>
              <p style={{ color: '#6B7280', fontSize: '1.1rem' }}>Replace your spreadsheet with something smarter.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-16">
              {[
                {
                  Icon: Landmark,
                  title: 'Bank Connections',
                  body: "Securely connect your business bank account. We automatically pull in transactions so you don't miss a single expense.",
                },
                {
                  Icon: Sparkles,
                  title: 'Smart Categorisation',
                  body: '"Is a coffee meeting deductible?" Our AI categorises transactions and flags potential tax savings instantly.',
                },
                {
                  Icon: Send,
                  title: 'Direct Filing',
                  body: 'Connect your Government Gateway ID once. Review your return, hit submit, and get your HMRC confirmation instantly.',
                },
              ].map((f) => (
                <div key={f.title}>
                  <f.Icon size={36} color="#C4622D" strokeWidth={1.5} style={{ marginBottom: '1.25rem' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0D0D0D', marginBottom: '0.75rem' }}>
                    {f.title}
                  </h3>
                  <p style={{ color: '#6B7280', lineHeight: 1.75, fontSize: '0.95rem' }}>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps */}
        <section id="pricing" className="py-28 px-6" style={{ backgroundColor: '#F9FAFB' }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#0D0D0D', marginBottom: '1.5rem' }}>
                  File in five minutes,<br />
                  <em style={{ color: '#C4622D', fontStyle: 'italic' }}>not five hours.</em>
                </h2>
                <p style={{ color: '#6B7280', lineHeight: 1.8, marginBottom: '2rem' }}>
                  Built for people who'd rather spend time on their craft than wrestling with HMRC forms. One flat fee. No surprises.
                </p>
                <div className="inline-flex items-end gap-2 mb-2">
                  <span style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '3.5rem', fontWeight: 700, color: '#0D0D0D', lineHeight: 1 }}>£20</span>
                  <span style={{ color: '#9CA3AF', marginBottom: '0.5rem' }}>+ VAT per return</span>
                </div>
                <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '2rem' }}>Founder pricing — locked in for life.</p>
                <Link href="/onboarding" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold transition-all" style={{ backgroundColor: '#C4622D', color: '#FFFFFF' }}>
                  Start Filing <ArrowRight size={16} />
                </Link>
              </div>

              <div className="space-y-0" style={{ borderTop: '1px solid #E5E7EB' }}>
                {[
                  { Icon: ShieldCheck,  title: 'Connect HMRC Gateway', desc: 'Securely link your Government Gateway ID. We fetch your income records automatically.' },
                  { Icon: Sparkles,     title: 'Review Your Expenses',  desc: 'Our AI categorises transactions. You simply approve or reject in seconds.' },
                  { Icon: CheckCircle2, title: 'File & Pay',            desc: 'Review your completed return, pay the £20 fee, and we submit directly to HMRC.' },
                ].map((step) => (
                  <div key={step.title} className="flex gap-5 py-6" style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <step.Icon size={22} color="#C4622D" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p className="font-semibold mb-1" style={{ color: '#0D0D0D' }}>{step.title}</p>
                      <p className="text-sm" style={{ color: '#6B7280', lineHeight: 1.6 }}>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-28 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-center mb-16" style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#0D0D0D' }}>
              Questions, <em style={{ color: '#C4622D', fontStyle: 'italic' }}>answered.</em>
            </h2>
            <div style={{ borderTop: '1px solid #E5E7EB' }}>
              {[
                { q: 'Is EasyTax FCA regulated?', a: 'EasyTax is a tax filing tool, not a financial adviser. We file your return based on the data you provide. For complex tax situations, we recommend consulting an accountant.' },
                { q: 'Is my HMRC data safe?', a: 'Your credentials are never stored. We use them to fetch your records via a secure, encrypted connection and discard them immediately after.' },
                { q: 'What if I have multiple income sources?', a: 'EasyTax supports PAYE income, self-employment income, rental income, and more — all in one return.' },
                { q: "What's the filing deadline?", a: 'The deadline for online Self Assessment returns is 31 January each year for the previous tax year. EasyTax helps you file well before the rush.' },
              ].map((item) => (
                <details key={item.q} className="group py-6" style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <summary className="flex justify-between items-center cursor-pointer list-none font-semibold text-base" style={{ color: '#0D0D0D' }}>
                    {item.q}
                    <span style={{ color: '#C4622D', fontSize: '1.25rem', lineHeight: 1, flexShrink: 0, marginLeft: '1rem' }}>+</span>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed" style={{ color: '#6B7280' }}>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-28 px-6" style={{ backgroundColor: '#0D0D0D' }}>
          <div className="max-w-4xl mx-auto text-center">
            <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1, marginBottom: '1.5rem' }}>
              Stop dreading<br />
              <em style={{ color: '#C4622D', fontStyle: 'italic' }}>January 31st.</em>
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
              Get early access and lock in founder pricing for life.
            </p>
            <Link href="/onboarding" className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-semibold text-lg transition-all" style={{ backgroundColor: '#C4622D', color: '#FFFFFF' }}>
              Get Early Access <ArrowRight size={18} />
            </Link>
          </div>
        </section>

      </main>

      <footer style={{ borderTop: '1px solid #1F1F1F', backgroundColor: '#0D0D0D', padding: '3rem 0' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm" style={{ color: '#4B5563' }}>
            EasyTax Ltd. Built in London.
          </div>
          <div className="flex gap-6 text-sm" style={{ color: '#4B5563' }}>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

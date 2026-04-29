import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)] bg-white text-gray-900">
      
      {/* Header / Nav */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-tight text-blue-600 flex items-center gap-2">
          <span>🇬🇧</span> EasyTax
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
          <Link href="#features" className="hover:text-blue-600">How it Works</Link>
          <Link href="#pricing" className="hover:text-blue-600">Pricing</Link>
          <Link href="#faq" className="hover:text-blue-600">FAQ</Link>
        </nav>
        <div className="flex gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 py-2">Log in</Link>
            <Link href="/onboarding" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Get Started
            </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-blue-100 bg-blue-50 text-blue-600 text-xs font-medium mb-6">
              🚀 Launching for 2025/26 Tax Year
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
              Self Assessment, <span className="text-blue-600">sorted.</span><br/>
              <span className="text-gray-400 font-medium text-4xl md:text-6xl block mt-2">Without the headache.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              The simplest way for UK freelancers and contractors to file tax returns. 
              Connect your bank, categorize expenses, and file directly to HMRC in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto w-full">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
              <Link href="/onboarding" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-center">
                Get Started
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Join 600+ freelancers on the list. No spam, ever.
            </p>
          </div>
        </section>

        {/* Social Proof / Trust */}
        <section className="border-y border-gray-100 bg-gray-50 py-10">
            <div className="max-w-7xl mx-auto px-6 text-center">
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Built for modern work</p>
                <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                    {/* Placeholders for logos */}
                    <span className="text-xl font-bold text-gray-400">Freelancers</span>
                    <span className="text-xl font-bold text-gray-400">Contractors</span>
                    <span className="text-xl font-bold text-gray-400">Sole Traders</span>
                    <span className="text-xl font-bold text-gray-400">HMRC Compliant</span>
                </div>
            </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Everything you need to file confidently</h2>
              <p className="text-gray-600 text-lg">Replace your spreadsheet with something smarter.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-100 transition-colors">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl mb-6">🏦</div>
                <h3 className="text-xl font-bold mb-3">Bank Connections</h3>
                <p className="text-gray-600 leading-relaxed">
                  Securely connect your business bank account. We automatically pull in transactions so you don't miss a single expense.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-100 transition-colors">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl mb-6">🤖</div>
                <h3 className="text-xl font-bold mb-3">Smart Categorization</h3>
                <p className="text-gray-600 leading-relaxed">
                  "Is a coffee meeting deductible?" Our AI helper categorizes transactions and flags potential tax savings instantly.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-100 transition-colors">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl mb-6">📤</div>
                <h3 className="text-xl font-bold mb-3">Direct Filing</h3>
                <p className="text-gray-600 leading-relaxed">
                  Connect your Government Gateway ID once. Review your return, hit submit, and get your HMRC confirmation instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing / CTA */}
        <section className="py-24 bg-blue-600 text-white text-center">
            <div className="max-w-4xl mx-auto px-6">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Stop dreading January 31st.</h2>
                <p className="text-blue-100 text-xl mb-10 max-w-2xl mx-auto">
                    Get early access to EasyTax and lock in our founder pricing for life.
                </p>
                <div className="bg-white/10 p-1 rounded-2xl inline-block backdrop-blur-sm">
                    <Link href="/onboarding" className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg">
                        Get Early Access
                    </Link>
                </div>
            </div>
        </section>

      </main>

      <footer className="border-t border-gray-100 py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} EasyTax Ltd. Built in London 🇬🇧
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-blue-600">Terms of Service</Link>
            <Link href="#" className="hover:text-blue-600">Twitter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

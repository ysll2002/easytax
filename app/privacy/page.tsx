'use client';
import Link from 'next/link';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-6 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold tracking-tight text-blue-600 flex items-center gap-2">
            <span>🇬🇧</span> EasyTax
          </Link>
          <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-900">
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <article className="prose prose-blue max-w-none bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: March 7, 2026</p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Introduction</h2>
          <p className="text-gray-600 mb-4">
            EasyTax ("we", "our", or "us") is committed to protecting your privacy. This policy outlines how we collect, use, and safeguard your personal and financial information in compliance with the UK Data Protection Act 2018 and the General Data Protection Regulation (GDPR).
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
          <p className="text-gray-600 mb-4">
            To provide our tax filing service, we collect the following types of data:
          </p>
          <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
            <li><strong>Personal Information:</strong> Name, address, email, phone number, and National Insurance number.</li>
            <li><strong>Financial Data:</strong> Bank account details (via secure open banking APIs), income, expenses, and transaction history.</li>
            <li><strong>Tax Data:</strong> Previous tax returns, HMRC references (UTR), and tax codes.</li>
            <li><strong>Usage Data:</strong> How you interact with our website and app.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. How We Use Your Data</h2>
          <p className="text-gray-600 mb-4">
            We use your data solely for the purpose of:
          </p>
          <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
            <li>Calculating your tax liability accurately.</li>
            <li>Submitting your Self Assessment tax return directly to HMRC.</li>
            <li>Categorizing expenses to maximize legitimate tax deductions.</li>
            <li>Processing your payment for our services.</li>
            <li>Sending you important reminders about filing deadlines.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Data Sharing</h2>
          <p className="text-gray-600 mb-4">
            We do not sell your data to third parties. We only share data with:
          </p>
          <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
            <li><strong>HM Revenue & Customs (HMRC):</strong> To file your tax return (only upon your explicit instruction).</li>
            <li><strong>Service Providers:</strong> Secure payment processors (Stripe) and cloud hosting providers (AWS/Vercel) bound by strict confidentiality agreements.</li>
            <li><strong>Legal Compliance:</strong> If required by law or a valid court order.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Data Security</h2>
          <p className="text-gray-600 mb-4">
            We implement industry-standard security measures, including encryption (SSL/TLS) for data in transit and at rest, secure access controls, and regular security audits. However, no method of transmission over the internet is 100% secure.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">6. Your Rights</h2>
          <p className="text-gray-600 mb-4">
            Under GDPR, you have the right to access, correct, delete, or restrict the processing of your personal data. To exercise these rights, please contact our Data Protection Officer at privacy@easytax.vip.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">7. Contact Us</h2>
          <p className="text-gray-600 mb-4">
            If you have any questions about this Privacy Policy, please contact us at support@easytax.vip.
          </p>
        </article>
      </main>
      
      <footer className="border-t border-gray-100 py-12 bg-gray-50 mt-auto">
        <div className="max-w-4xl mx-auto px-6 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} EasyTax Ltd. Built in London 🇬🇧
        </div>
      </footer>
    </div>
  );
}

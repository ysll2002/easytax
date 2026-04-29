'use client';
import Link from 'next/link';

export default function Terms() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms and Conditions</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: March 7, 2026</p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-600 mb-4">
            By accessing and using EasyTax ("the Service"), you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not use our Service.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
          <p className="text-gray-600 mb-4">
            EasyTax provides a software platform to assist UK sole traders and freelancers in calculating and filing their Self Assessment tax returns with HM Revenue & Customs (HMRC). We are not a chartered accountancy firm and do not provide personalized financial advice.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. User Responsibilities</h2>
          <p className="text-gray-600 mb-4">
            You are responsible for:
          </p>
          <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
            <li>Ensuring the accuracy of all financial data entered into the platform.</li>
            <li>Connecting valid and authorized bank accounts.</li>
            <li>Reviewing your tax return before submission to HMRC.</li>
            <li>Meeting all HMRC filing deadlines and payment obligations.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Limitations of Liability</h2>
          <p className="text-gray-600 mb-4">
            EasyTax is provided "as is". While we strive for accuracy, we cannot guarantee that the Service will be error-free. We are not liable for any penalties, interest, or surcharges imposed by HMRC resulting from incorrect data entry or late filing, unless directly caused by a technical failure of our software.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Payments and Refunds</h2>
          <p className="text-gray-600 mb-4">
            Our service fee (£20 per tax year) allows you to generate and file one Self Assessment return. This fee is non-refundable once the filing has been successfully submitted to HMRC.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">6. Changes to Terms</h2>
          <p className="text-gray-600 mb-4">
            We reserve the right to modify these terms at any time. We will notify users of significant changes via email or a prominent notice on our website.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">7. Contact Us</h2>
          <p className="text-gray-600 mb-4">
            If you have any questions about these Terms, please contact us at support@easytax.vip.
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

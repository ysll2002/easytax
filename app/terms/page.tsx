import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for EasyTax — the Self Assessment and Making Tax Digital filing platform by Finance Panda Limited.',
  alternates: { canonical: 'https://easytax.vip/terms' },
  robots: { index: false },
};

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FDFCF8', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #E8E2DA', backgroundColor: '#FDFCF8' }}>
        <div className="max-w-4xl mx-auto px-6 py-5 flex justify-between items-center">
          <Link href="/" style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#C4622D', textDecoration: 'none' }}>
            EasyTax
          </Link>
          <Link href="/" style={{ fontSize: '0.875rem', color: '#9A8F83', textDecoration: 'none' }}>← Back to Home</Link>
        </div>
      </nav>

      <main className="flex-grow max-w-4xl mx-auto px-6 py-16 w-full">

        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2.5rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
          Terms of Service
        </h1>
        <p style={{ color: '#9A8F83', fontSize: '0.875rem', marginBottom: '3rem' }}>
          Last updated: 12 May 2026 &nbsp;·&nbsp; Effective: 12 May 2026
        </p>

        <div style={{ color: '#4A4035', lineHeight: 1.8 }} className="space-y-10">

          {/* 1 */}
          <section>
            <H2>1. About These Terms</H2>
            <P>
              These Terms of Service ("Terms") form a legally binding agreement between you and <strong>Finance Panda Limited</strong>, a company registered in England and Wales, trading as EasyTax ("EasyTax", "we", "us", "our"). By creating an account or using our platform at easytax.vip, you agree to these Terms in full.
            </P>
            <P>
              If you do not agree, please do not use the Service. We recommend you read these Terms carefully before proceeding.
            </P>
          </section>

          {/* 2 */}
          <section>
            <H2>2. The Service</H2>
            <P>
              EasyTax is a software platform that helps UK-based sole traders, freelancers, and contractors to:
            </P>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }} className="space-y-1">
              <li>Connect their bank account via Open Banking (TrueLayer) to import transactions</li>
              <li>Categorise expenses using AI-assisted tools</li>
              <li>Connect to HMRC via Government Gateway OAuth</li>
              <li>Prepare and submit Self Assessment tax returns directly to HMRC</li>
              <li>View their HMRC obligations, calculations, and VAT returns</li>
            </ul>
            <Callout>
              <strong>Not financial advice.</strong> EasyTax is a tax filing tool, not a regulated financial adviser or chartered accountant. We help you file the return — the accuracy of the underlying data is your responsibility. For complex tax situations, please consult a qualified accountant.
            </Callout>
          </section>

          {/* 3 */}
          <section>
            <H2>3. Eligibility</H2>
            <P>To use EasyTax you must:</P>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }} className="space-y-1">
              <li>Be at least 18 years old</li>
              <li>Be a UK resident or have UK tax obligations</li>
              <li>Be registered for Self Assessment with HMRC</li>
              <li>Have a valid Government Gateway account</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <H2>4. Your Account</H2>
            <P>
              You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately at <a href="mailto:support@easytax.vip" style={{ color: '#C4622D' }}>support@easytax.vip</a> if you suspect unauthorised access.
            </P>
            <P>
              You must provide accurate information when registering. We may suspend or terminate your account if we have reason to believe information you have provided is false or misleading.
            </P>
          </section>

          {/* 5 */}
          <section>
            <H2>5. Your Responsibilities</H2>
            <P>You agree that you are solely responsible for:</P>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }} className="space-y-1">
              <li>The accuracy and completeness of all financial data you provide or that is imported on your behalf</li>
              <li>Reviewing your tax return carefully before authorising submission to HMRC</li>
              <li>Ensuring you meet all HMRC filing deadlines and payment obligations</li>
              <li>Maintaining appropriate records in accordance with HMRC requirements (generally 6 years)</li>
              <li>Any tax, penalties, interest, or surcharges arising from errors in the information you provide</li>
            </ul>
            <Callout type="warning">
              Once you instruct us to submit your return to HMRC, it is treated as your submission. Ensure all figures are correct before confirming.
            </Callout>
          </section>

          {/* 6 */}
          <section>
            <H2>6. HMRC Connection and Data Access</H2>
            <P>
              By connecting your Government Gateway account via our OAuth integration, you authorise EasyTax to access your HMRC Self Assessment data and submit returns on your behalf. This authorisation can be revoked at any time from your dashboard or directly via your HMRC online account.
            </P>
            <P>
              We act strictly on your instruction. We will never submit a return to HMRC without your explicit confirmation.
            </P>
          </section>

          {/* 7 */}
          <section>
            <H2>7. Open Banking Connection</H2>
            <P>
              By connecting a bank account via TrueLayer, you grant read-only access to your transaction data. We cannot and will never initiate payments or move money from your account. You can disconnect your bank at any time from your dashboard.
            </P>
            <P>
              Open Banking connections are subject to TrueLayer's own terms of service and FCA regulations.
            </P>
          </section>

          {/* 8 */}
          <section>
            <H2>8. Fees and Payment</H2>
            <P>
              EasyTax charges a flat fee of <strong>£20 + VAT per tax return</strong>. This is charged when you confirm submission of your return to HMRC. Payment is processed securely by Stripe.
            </P>
            <div style={{ marginTop: '1rem' }} className="space-y-3">
              {[
                ['Founder pricing', 'Users who sign up during our early-access period lock in the £20 price for life, regardless of future price changes.'],
                ['Refunds', 'Once a return has been successfully submitted to HMRC, the fee is non-refundable. If a submission fails due to a technical error on our part, you will not be charged.'],
                ['Failed submissions', 'If HMRC rejects your return due to errors in the data you provided, the fee is non-refundable but we will assist you in correcting and resubmitting at no additional charge.'],
              ].map(([title, desc]) => (
                <div key={title} style={{ padding: '0.875rem 1rem', backgroundColor: '#F5EDDC', borderRadius: '0.75rem', borderLeft: '3px solid #C9963D' }}>
                  <p style={{ fontWeight: 600, color: '#1C1208', marginBottom: '0.25rem', fontSize: '0.9rem' }}>{title}</p>
                  <p style={{ color: '#4A4035', fontSize: '0.875rem' }}>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 9 */}
          <section>
            <H2>9. Acceptable Use</H2>
            <P>You agree not to:</P>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }} className="space-y-1">
              <li>Use the Service for any unlawful purpose, including tax fraud or money laundering</li>
              <li>Attempt to gain unauthorised access to any part of the Service or another user's account</li>
              <li>Submit knowingly false or misleading information to HMRC via our platform</li>
              <li>Reverse engineer, decompile, or otherwise attempt to extract the source code of our software</li>
              <li>Use the Service in a way that could damage, disable, or impair our systems</li>
            </ul>
            <P>
              We reserve the right to suspend or terminate your account immediately if we believe you are in breach of this section.
            </P>
          </section>

          {/* 10 */}
          <section>
            <H2>10. Intellectual Property</H2>
            <P>
              All content, software, trademarks, and design elements of EasyTax are owned by Finance Panda Limited or our licensors. You may not reproduce, distribute, or create derivative works without our express written permission.
            </P>
            <P>
              You retain ownership of all data you submit through the Service. You grant us a limited licence to process that data solely to provide the Service to you.
            </P>
          </section>

          {/* 11 */}
          <section>
            <H2>11. Limitation of Liability</H2>
            <P>
              To the fullest extent permitted by UK law:
            </P>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }} className="space-y-1">
              <li>The Service is provided "as is" without warranties of any kind, express or implied</li>
              <li>We are not liable for any HMRC penalties, interest, or surcharges arising from data you provided</li>
              <li>We are not liable for any indirect, incidental, or consequential loss</li>
              <li>Our total aggregate liability to you shall not exceed the fees paid by you in the 12 months preceding the claim</li>
            </ul>
            <P>
              Nothing in these Terms excludes liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded under English law.
            </P>
          </section>

          {/* 12 */}
          <section>
            <H2>12. Service Availability</H2>
            <P>
              We aim to maintain high availability but do not guarantee uninterrupted access. We will endeavour to schedule maintenance outside of peak filing periods (January). We are not liable for losses arising from downtime.
            </P>
            <P>
              We may modify or discontinue features of the Service with reasonable notice. We will provide at least 30 days' notice before any material reduction in functionality.
            </P>
          </section>

          {/* 13 */}
          <section>
            <H2>13. Termination</H2>
            <P>
              You may close your account at any time by contacting <a href="mailto:support@easytax.vip" style={{ color: '#C4622D' }}>support@easytax.vip</a>. Upon termination, your right to use the Service ceases immediately.
            </P>
            <P>
              We may suspend or terminate your account if you breach these Terms, or if we are required to do so by law. We will give you reasonable notice unless the breach requires immediate action.
            </P>
            <P>
              Following termination, we will retain your data in accordance with our <Link href="/privacy" style={{ color: '#C4622D' }}>Privacy Policy</Link> and applicable legal obligations.
            </P>
          </section>

          {/* 14 */}
          <section>
            <H2>14. Changes to These Terms</H2>
            <P>
              We may update these Terms from time to time. We will notify you of material changes by email at least 14 days before they take effect. Continued use of the Service after that date constitutes acceptance of the revised Terms.
            </P>
          </section>

          {/* 15 */}
          <section>
            <H2>15. Governing Law and Disputes</H2>
            <P>
              These Terms are governed by the laws of England and Wales. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </P>
            <P>
              Before pursuing legal action, we encourage you to contact us at <a href="mailto:support@easytax.vip" style={{ color: '#C4622D' }}>support@easytax.vip</a> so we can attempt to resolve the matter informally.
            </P>
          </section>

          {/* 16 */}
          <section>
            <H2>16. Contact Us</H2>
            <P><strong>Email:</strong> <a href="mailto:support@easytax.vip" style={{ color: '#C4622D' }}>support@easytax.vip</a></P>
            <P><strong>Privacy:</strong> <a href="mailto:privacy@easytax.vip" style={{ color: '#C4622D' }}>privacy@easytax.vip</a></P>
            <P>Finance Panda Limited, London, United Kingdom.</P>
          </section>

        </div>
      </main>

      <footer style={{ borderTop: '1px solid #E8E2DA', backgroundColor: '#FDFCF8', padding: '2rem 0', marginTop: '4rem' }}>
        <div className="max-w-4xl mx-auto px-6 flex justify-between items-center text-sm" style={{ color: '#9A8F83' }}>
          <span>© {new Date().getFullYear()} Finance Panda Limited. Built in London.</span>
          <Link href="/privacy" style={{ color: '#9A8F83', textDecoration: 'none' }}>Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.4rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #E8E2DA' }}>
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ color: '#4A4035', marginBottom: '0.75rem' }}>{children}</p>;
}

function Callout({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'warning' }) {
  const styles = {
    info:    { bg: '#F0EBE1', border: '#C9963D', text: '#4A4035' },
    warning: { bg: '#FEF3F2', border: '#F87171', text: '#4A4035' },
  };
  const s = styles[type];
  return (
    <div style={{ padding: '0.875rem 1rem', backgroundColor: s.bg, borderLeft: `3px solid ${s.border}`, borderRadius: '0 0.5rem 0.5rem 0', margin: '1rem 0', color: s.text, fontSize: '0.9rem', lineHeight: 1.7 }}>
      {children}
    </div>
  );
}

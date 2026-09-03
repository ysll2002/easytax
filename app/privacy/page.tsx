import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How EasyTax (Finance Panda Limited) collects, uses and protects your personal data under UK GDPR.',
  alternates: { canonical: 'https://easytax.vip/privacy' },
  robots: { index: false },
};

export default function Privacy() {
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
          Privacy Policy
        </h1>
        <p style={{ color: '#9A8F83', fontSize: '0.875rem', marginBottom: '3rem' }}>
          Last updated: 12 May 2026 &nbsp;·&nbsp; Effective: 12 May 2026
        </p>

        <div style={{ color: '#4A4035', lineHeight: 1.8 }} className="space-y-10">

          {/* 1 */}
          <section>
            <H2>1. Who We Are</H2>
            <P>
              Finance Panda Limited, trading as EasyTax ("<strong>EasyTax</strong>", "we", "us", "our") is the data controller responsible for your personal data. We are registered in England and Wales.
            </P>
            <Table rows={[
              ['Company name', 'Finance Panda Limited'],
              ['Registered address', 'London, United Kingdom'],
              ['Email', 'privacy@easytax.vip'],
              ['ICO registration', 'ZA540758'],
            ]} />
            <P>
              This Privacy Policy explains what personal data we collect, why we collect it, the legal basis for processing it, how long we keep it, and your rights under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
            </P>
          </section>

          {/* 2 */}
          <section>
            <H2>2. Data We Collect and Why</H2>
            <P>We only collect data that is necessary for the purposes described below.</P>

            <H3>2.1 Account and Identity Data</H3>
            <P>Name, email address, and profile picture (if you sign in via Google).</P>
            <Legal basis="Contract" detail="Necessary to create and manage your account and provide the service." />

            <H3>2.2 Tax and Financial Data</H3>
            <P>National Insurance number (NINO), Unique Taxpayer Reference (UTR), income figures, expense records, and data retrieved from HMRC on your behalf (obligations, calculations, previously submitted returns).</P>
            <Legal basis="Contract" detail="Necessary to calculate and submit your Self Assessment tax return." />

            <H3>2.3 Bank Transaction Data</H3>
            <P>Bank account details and transaction history retrieved via Plaid's Open Banking connection, used to identify and categorise expenses.</P>
            <Legal basis="Consent" detail="You explicitly authorise this connection. You can disconnect at any time from your dashboard." />

            <H3>2.4 HMRC OAuth Connection</H3>
            <P>HMRC access token and refresh token stored securely to allow us to act on your behalf with HMRC.</P>
            <Legal basis="Consent" detail="You explicitly grant this via HMRC's Government Gateway OAuth flow." />

            <H3>2.5 Payment Data</H3>
            <P>Payment is processed by Stripe. We do not store card numbers. We retain transaction references and amounts for invoicing and legal compliance.</P>
            <Legal basis="Contract" detail="Necessary to process payment for our service." />

            <H3>2.6 Device and Fraud Prevention Data</H3>
            <P>IP address, browser type, screen resolution, timezone, and device identifiers. HMRC mandates these "fraud prevention headers" be submitted with every API call.</P>
            <Legal basis="Legal obligation" detail="Required under HMRC's Fraud Prevention Headers specification (TxM standard)." />

            <H3>2.7 Usage Data</H3>
            <P>Pages visited, features used, and error logs. Used solely to improve the product and diagnose issues.</P>
            <Legal basis="Legitimate interests" detail="We have a legitimate interest in maintaining and improving our service. This data is aggregated and not used to profile individuals." />
          </section>

          {/* 3 */}
          <section>
            <H2>3. How Long We Keep Your Data</H2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginTop: '1rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #DDD5C8' }}>
                  {['Data type', 'Retention period', 'Reason'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#1C1208', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Account data', 'Until account deletion + 30 days', 'Service provision'],
                  ['Tax return data', '7 years from filing date', 'HMRC legal requirement (6 years + buffer)'],
                  ['Bank transaction data', '6 years', 'Tax record keeping obligations'],
                  ['HMRC tokens', 'Until disconnected or expired', 'Service provision'],
                  ['Payment records', '7 years', 'Financial record keeping (Companies Act 2006)'],
                  ['Device / fraud prevention data', '13 months', 'HMRC TxM requirement'],
                  ['Usage / error logs', '90 days', 'Operational necessity'],
                ].map(([type, period, reason]) => (
                  <tr key={type} style={{ borderBottom: '1px solid #E8E2DA' }}>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 500, color: '#1C1208' }}>{type}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{period}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#9A8F83', fontSize: '0.825rem' }}>{reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* 4 */}
          <section>
            <H2>4. Your Rights Under UK GDPR</H2>
            <P>You have the following rights regarding your personal data. To exercise any of them, email <a href="mailto:privacy@easytax.vip" style={{ color: '#C4622D' }}>privacy@easytax.vip</a>. We will respond within 30 days.</P>
            <div className="space-y-3" style={{ marginTop: '1rem' }}>
              {[
                ['Right of access', 'Request a copy of all personal data we hold about you (Subject Access Request).'],
                ['Right to rectification', 'Ask us to correct inaccurate or incomplete data.'],
                ['Right to erasure', 'Ask us to delete your data where we have no legal obligation to retain it.'],
                ['Right to restriction', 'Ask us to pause processing your data while a dispute is resolved.'],
                ['Right to data portability', 'Receive your data in a structured, machine-readable format (e.g. JSON/CSV).'],
                ['Right to object', 'Object to processing based on legitimate interests. We will stop unless we can demonstrate compelling legitimate grounds.'],
                ['Right to withdraw consent', 'Where processing is based on consent (e.g. bank connection, HMRC OAuth), you can withdraw at any time via your dashboard without affecting the lawfulness of prior processing.'],
                ['Rights re: automated decisions', 'We do not make solely automated decisions that produce legal or similarly significant effects on you. AI categorisation is always presented for your review and approval.'],
              ].map(([right, desc]) => (
                <div key={right} style={{ padding: '0.875rem 1rem', backgroundColor: '#F5EDDC', borderRadius: '0.75rem', borderLeft: '3px solid #C9963D' }}>
                  <p style={{ fontWeight: 600, color: '#1C1208', marginBottom: '0.25rem', fontSize: '0.9rem' }}>{right}</p>
                  <p style={{ color: '#4A4035', fontSize: '0.875rem' }}>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 5 */}
          <section>
            <H2>5. Cookies</H2>
            <P>We use only technically necessary cookies (session authentication). We do not use advertising or tracking cookies. No cookie consent banner is required for strictly necessary cookies.</P>
          </section>

          {/* 6 */}
          <section>
            <H2>6. Security</H2>
            <P>
              We implement appropriate technical and organisational measures including TLS encryption in transit, encryption at rest, access controls, and token-based authentication. HMRC access tokens are stored encrypted. We do not store Government Gateway passwords.
            </P>
            <P>
              In the event of a personal data breach that poses a risk to your rights and freedoms, we will notify the ICO within 72 hours and affected users without undue delay, as required by UK GDPR Article 33–34.
            </P>
          </section>

          {/* 7 */}
          <section>
            <H2>7. Children</H2>
            <P>Our service is not directed at anyone under the age of 18. We do not knowingly collect data from minors.</P>
          </section>

          {/* 8 */}
          <section>
            <H2>8. Changes to This Policy</H2>
            <P>We may update this policy from time to time. We will notify you of material changes by email or by a prominent notice in the app at least 14 days before changes take effect. The "Last updated" date at the top of this page reflects the most recent revision.</P>
          </section>

          {/* 9 */}
          <section>
            <H2>9. How to Complain</H2>
            <P>
              If you are unhappy with how we handle your data, please contact us first at <a href="mailto:privacy@easytax.vip" style={{ color: '#C4622D' }}>privacy@easytax.vip</a>. If you remain unsatisfied, you have the right to lodge a complaint with the UK's supervisory authority:
            </P>
            <div style={{ padding: '1rem 1.25rem', backgroundColor: '#F0EBE1', borderRadius: '0.75rem', marginTop: '0.75rem', fontSize: '0.9rem' }}>
              <p style={{ fontWeight: 600, color: '#1C1208', marginBottom: '0.25rem' }}>Information Commissioner's Office (ICO)</p>
              <p style={{ color: '#4A4035' }}>Website: <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" style={{ color: '#C4622D' }}>ico.org.uk</a></p>
              <p style={{ color: '#4A4035' }}>Helpline: 0303 123 1113</p>
            </div>
          </section>

          {/* 10 */}
          <section>
            <H2>10. Contact Us</H2>
            <P>For any privacy-related questions or to exercise your rights:</P>
            <P><strong>Email:</strong> <a href="mailto:privacy@easytax.vip" style={{ color: '#C4622D' }}>privacy@easytax.vip</a></P>
            <P>We aim to respond to all requests within <strong>30 days</strong>. For complex requests we may extend this by a further two months, in which case we will notify you.</P>
          </section>

        </div>
      </main>

      <footer style={{ borderTop: '1px solid #E8E2DA', backgroundColor: '#FDFCF8', padding: '2rem 0', marginTop: '4rem' }}>
        <div className="max-w-4xl mx-auto px-6 flex justify-between items-center text-sm" style={{ color: '#9A8F83' }}>
          <span>© {new Date().getFullYear()} Finance Panda Limited. Built in London.</span>
          <Link href="/terms" style={{ color: '#9A8F83', textDecoration: 'none' }}>Terms of Service</Link>
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

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1C1208', marginTop: '1.25rem', marginBottom: '0.4rem' }}>
      {children}
    </h3>
  );
}

function P({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ color: '#4A4035', marginBottom: '0.75rem', ...style }}>{children}</p>;
}

function Legal({ basis, detail }: { basis: string; detail: string }) {
  const colors: Record<string, { bg: string; border: string; label: string }> = {
    'Contract':           { bg: '#EFF6FF', border: '#93C5FD', label: '#1D4ED8' },
    'Consent':            { bg: '#F0FDF4', border: '#86EFAC', label: '#15803D' },
    'Legal obligation':   { bg: '#FEF9C3', border: '#FDE047', label: '#854D0E' },
    'Legitimate interests': { bg: '#FDF4FF', border: '#D8B4FE', label: '#7E22CE' },
  };
  const c = colors[basis] ?? colors['Contract'];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: c.bg, border: `1px solid ${c.border}`, borderRadius: '0.5rem', marginTop: '0.4rem', marginBottom: '0.75rem', fontSize: '0.825rem' }}>
      <span style={{ fontWeight: 700, color: c.label, flexShrink: 0 }}>Legal basis: {basis}</span>
      <span style={{ color: '#4A4035' }}>— {detail}</span>
    </div>
  );
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <table style={{ borderCollapse: 'collapse', fontSize: '0.875rem', marginTop: '0.75rem', marginBottom: '1rem', width: '100%' }}>
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k} style={{ borderBottom: '1px solid #E8E2DA' }}>
            <td style={{ padding: '0.4rem 0.75rem', fontWeight: 600, color: '#1C1208', width: '35%' }}>{k}</td>
            <td style={{ padding: '0.4rem 0.75rem', color: '#4A4035' }}>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

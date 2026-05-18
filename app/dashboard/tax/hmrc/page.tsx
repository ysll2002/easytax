import { auth } from '@/auth';
import Link from 'next/link';

export default async function HmrcConnectPage({ searchParams }: { searchParams: Promise<{ error?: string; detail?: string; status?: string }> }) {
  const session = await auth();
  void session; // used by callback
  const sp = await searchParams;

  const clientId   = process.env.HMRC_CLIENT_ID!;
  const redirectUri = process.env.HMRC_REDIRECT_URI!;
  const scopes = [
    'read:self-assessment',
    'write:self-assessment',
    'read:vat',
    'write:vat',
  ].join('+');

  const authUrl = `https://test-api.service.hmrc.gov.uk/oauth/authorize?response_type=code&client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return (
    <div className="p-4 sm:p-8 max-w-xl">
      <Link href="/dashboard/tax" className="text-sm mb-6 inline-block" style={{ color: '#9A8F83' }}>← Back</Link>

      <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
        Connect HMRC
      </h1>
      <p style={{ color: '#9A8F83', marginBottom: '2rem', lineHeight: 1.6 }}>
        You&apos;ll be redirected to HMRC&apos;s secure website to sign in with your Government Gateway credentials and authorise EasyTax to access your Self Assessment data.
      </p>

      <div className="p-5 rounded-2xl mb-6 space-y-2" style={{ backgroundColor: '#F5EDDC', border: '1px solid #C9963D30' }}>
        <p className="text-sm font-semibold" style={{ color: '#1C1208' }}>What we access</p>
        {['Your Self Assessment obligations and deadlines', 'VAT obligations and return submissions', 'Income and employment records (P60, P45)', 'Previously submitted returns'].map(item => (
          <div key={item} className="flex items-start gap-2 text-sm" style={{ color: '#4A4035' }}>
            <span style={{ color: '#C9963D', marginTop: '2px' }}>✓</span> {item}
          </div>
        ))}
      </div>

      {sp.error && (
        <div className="p-4 rounded-xl mb-4 text-xs font-mono break-all" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
          <p className="font-bold mb-1">Error: {sp.error} {sp.status ? `(HTTP ${sp.status})` : ''}</p>
          {sp.detail && <p>{decodeURIComponent(sp.detail)}</p>}
        </div>
      )}

      <a href={authUrl}
        className="inline-block w-full text-center py-3.5 rounded-xl font-medium text-sm"
        style={{ backgroundColor: '#C4622D', color: '#FDFCF8', textDecoration: 'none' }}>
        Sign in with HMRC Government Gateway →
      </a>

      <p className="text-xs text-center mt-4" style={{ color: '#9A8F83' }}>
        Your credentials are entered directly on HMRC&apos;s site — EasyTax never sees your password.
      </p>
    </div>
  );
}

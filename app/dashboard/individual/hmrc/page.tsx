import { auth } from '@/auth';
import Link from 'next/link';
import { HMRC_API_BASE } from '@/lib/hmrc-env';

export default async function HmrcConnectPage({ searchParams }: { searchParams: Promise<{ error?: string; detail?: string; status?: string }> }) {
  const session = await auth();
  void session; // used by callback
  const sp = await searchParams;

  const clientId    = (process.env.HMRC_CLIENT_ID ?? '').trim();
  const redirectUri = (process.env.HMRC_REDIRECT_URI ?? '').trim();
  const scopes = [
    'hello',
    'read:self-assessment',
    'write:self-assessment',
    'read:vat',
    'write:vat',
    // Produce Report needs read:, Acknowledge Report needs write: (HMRC's
    // Self Assessment Assist 1.0 OAS). Without write: Acknowledge returns
    // 403 INVALID_SCOPE.
    'read:self-assessment-assist',
    'write:self-assessment-assist',
  ].join('+');

  // HMRC_API_BASE, not a literal. This line said
  // 'https://test-api.service.hmrc.gov.uk' until 2026-11-11, when production
  // access was granted and HMRC_CLIENT_ID became the production application's
  // id: a production client_id sent to the sandbox authorize endpoint is
  // answered with `{"error":"invalid_request","error_description":"client_id
  // is invalid"}`, and because every other HMRC call had already switched to
  // production, the only symptom was that nobody could connect. See
  // lib/hmrc-env.ts.
  const authUrl = `${HMRC_API_BASE}/oauth/authorize?response_type=code&client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return (
    <div className="p-4 sm:p-8 max-w-xl">
      <Link href="/dashboard/individual" className="text-sm mb-6 inline-block" style={{ color: '#6B6256' }}>← Back</Link>

      <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
        Connect HMRC
      </h1>
      <p style={{ color: '#6B6256', marginBottom: '2rem', lineHeight: 1.6 }}>
        You&apos;ll be redirected to HMRC&apos;s secure website to sign in with your Government Gateway credentials and authorise EasyTax to access your Self Assessment data.
      </p>

      <div className="p-5 rounded-2xl mb-6 space-y-2" style={{ backgroundColor: '#F5EDDC', border: '1px solid #C9963D30' }}>
        <p className="text-sm font-semibold" style={{ color: '#1C1208' }}>What we access</p>
        {['Your Self Assessment obligations and deadlines', 'VAT obligations and return submissions', 'Income and employment records (P60, P45)', 'Previously submitted returns'].map(item => (
          <div key={item} className="flex items-start gap-2 text-sm" style={{ color: '#4A4035' }}>
            <span style={{ color: '#8A6418', marginTop: '2px' }}>✓</span> {item}
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
        style={{ backgroundColor: '#A04E1C', color: '#FDFCF8', textDecoration: 'none' }}>
        Sign in with HMRC Government Gateway →
      </a>

      <p className="text-xs text-center mt-4" style={{ color: '#6B6256' }}>
        Your credentials are entered directly on HMRC&apos;s site — EasyTax never sees your password.
      </p>
    </div>
  );
}

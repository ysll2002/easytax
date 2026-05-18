import { auth } from '@/auth';
import Link from 'next/link';

export default async function BankingPage() {
  const session = await auth();
  void session;

  const clientId   = process.env.TRUELAYER_CLIENT_ID!;
  const redirectUri = process.env.TRUELAYER_REDIRECT_URI!;
  const authBase   = process.env.TRUELAYER_AUTH_URL ?? 'https://auth.truelayer-sandbox.com';
  const isSandbox  = authBase.includes('sandbox');
  const providers  = isSandbox ? 'mock' : 'uk-ob-all+uk-oauth-all';

  const authUrl = `${authBase}/?response_type=code&client_id=${clientId}&scope=accounts+transactions+balance+offline_access&redirect_uri=${encodeURIComponent(redirectUri)}&providers=${providers}`;

  return (
    <div className="p-4 sm:p-8 max-w-xl">
      <Link href="/dashboard/tax" className="text-sm mb-6 inline-block" style={{ color: '#9A8F83' }}>← Back</Link>

      <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
        Connect Bank Account
      </h1>
      <p style={{ color: '#9A8F83', marginBottom: '2rem', lineHeight: 1.6 }}>
        Link your business bank account via Open Banking to automatically import transactions and identify allowable expenses.
      </p>

      <div className="p-5 rounded-2xl mb-6 space-y-2" style={{ backgroundColor: '#E2EDE2', border: '1px solid #6B8E6E30' }}>
        <p className="text-sm font-semibold" style={{ color: '#1C1208' }}>Supported banks</p>
        {['Monzo Business', 'Starling Bank', 'Barclays', 'HSBC', 'NatWest', 'Lloyds', '+ 50 more UK banks'].map(b => (
          <div key={b} className="flex items-center gap-2 text-sm" style={{ color: '#4A4035' }}>
            <span style={{ color: '#6B8E6E' }}>✓</span> {b}
          </div>
        ))}
      </div>

      <a href={authUrl}
        className="inline-block w-full text-center py-3.5 rounded-xl font-medium text-sm"
        style={{ backgroundColor: '#1C1208', color: '#FDFCF8', textDecoration: 'none' }}>
        Connect via Open Banking →
      </a>

      <p className="text-xs text-center mt-4" style={{ color: '#9A8F83' }}>
        Read-only access. We can never move money. Powered by TrueLayer.
      </p>
    </div>
  );
}

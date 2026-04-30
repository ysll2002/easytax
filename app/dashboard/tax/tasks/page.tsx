import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default async function TasksPage() {
  const session = await auth();
  const profileId = session!.user.profileId;

  const [{ data: hmrc }, { data: bank }] = await Promise.all([
    supabase.from('hmrc_connections').select('*').eq('user_id', profileId).single(),
    supabase.from('bank_connections').select('*').eq('user_id', profileId).single(),
  ]);

  if (!hmrc || !bank) {
    return (
      <div className="p-8 max-w-xl">
        <p style={{ color: '#9A8F83' }}>Please connect HMRC and your bank first.</p>
        <Link href="/dashboard/tax" style={{ color: '#C4622D', fontWeight: 600 }}>← Go back</Link>
      </div>
    );
  }

  // Fetch obligations from HMRC
  let obligations: { periodStartDate: string; periodEndDate: string; due: string; status: string }[] = [];
  try {
    const apiBase = 'https://test-api.service.hmrc.gov.uk';
    // For sandbox, we use a test NINO
    const nino = hmrc.nino ?? 'AA000003D';
    const res = await fetch(`${apiBase}/individuals/self-assessment/obligations/details/${nino}`, {
      headers: {
        Authorization: `Bearer ${hmrc.access_token}`,
        Accept: 'application/vnd.hmrc.1.0+json',
      },
    });
    if (res.ok) {
      const data = await res.json();
      obligations = data.obligations?.flatMap((o: { obligationDetails: unknown[] }) => o.obligationDetails) ?? [];
    }
  } catch { /* use mock if HMRC unreachable */ }

  // Fallback mock obligations for sandbox demo
  if (obligations.length === 0) {
    obligations = [
      { periodStartDate: '2024-04-06', periodEndDate: '2025-04-05', due: '2026-01-31', status: 'Open' },
    ];
  }

  // Fetch transactions from TrueLayer
  let transactions: { transaction_id: string; timestamp: string; description: string; amount: number; currency: string }[] = [];
  try {
    const dataBase = process.env.TRUELAYER_DATA_URL ?? 'https://api.truelayer-sandbox.com/data/v1';
    const txRes = await fetch(`${dataBase}/accounts/${bank.account_id}/transactions`, {
      headers: { Authorization: `Bearer ${bank.access_token}` },
    });
    if (txRes.ok) {
      const { results } = await txRes.json();
      transactions = (results ?? []).slice(0, 20);
    }
  } catch { /* non-blocking */ }

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/dashboard/tax" className="text-sm mb-6 inline-block" style={{ color: '#9A8F83' }}>← Back</Link>

      <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
        Your Tax Tasks
      </h1>
      <p style={{ color: '#9A8F83', marginBottom: '2.5rem' }}>Based on your HMRC obligations and bank transactions.</p>

      {/* HMRC Obligations */}
      <section className="mb-8">
        <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#1C1208', marginBottom: '1rem' }}>
          HMRC Obligations
        </h2>
        <div className="space-y-3">
          {obligations.map((ob, i) => (
            <div key={i} className="flex items-center justify-between p-5 rounded-2xl" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8', borderLeft: `4px solid ${ob.status === 'Open' ? '#C4622D' : '#6B8E6E'}` }}>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#1C1208' }}>
                  Self Assessment {ob.periodStartDate?.slice(0, 4)}/{ob.periodEndDate?.slice(0, 4)}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#9A8F83' }}>
                  Period: {ob.periodStartDate} → {ob.periodEndDate}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: ob.status === 'Open' ? '#F5E4D8' : '#E2EDE2', color: ob.status === 'Open' ? '#C4622D' : '#6B8E6E' }}>
                  {ob.status}
                </span>
                <p className="text-xs mt-1" style={{ color: '#9A8F83' }}>Due {ob.due}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Transactions */}
      <section>
        <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#1C1208', marginBottom: '1rem' }}>
          Recent Transactions — {bank.account_name}
        </h2>
        {transactions.length === 0 ? (
          <p style={{ color: '#9A8F83', fontSize: '0.9rem' }}>No transactions available.</p>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #DDD5C8' }}>
            {transactions.map((tx, i) => (
              <div key={tx.transaction_id ?? i} className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: '#FDFCF8', borderTop: i > 0 ? '1px solid #DDD5C8' : 'none' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#1C1208' }}>{tx.description}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9A8F83' }}>{tx.timestamp?.slice(0, 10)}</p>
                </div>
                <p className="font-semibold text-sm" style={{ color: tx.amount < 0 ? '#C4622D' : '#6B8E6E' }}>
                  {tx.amount < 0 ? '−' : '+'}£{Math.abs(tx.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8">
        <Link href="/payment" className="inline-block px-8 py-3.5 rounded-full font-medium text-sm" style={{ backgroundColor: '#C4622D', color: '#FDFCF8' }}>
          File & Pay Now →
        </Link>
      </div>
    </div>
  );
}

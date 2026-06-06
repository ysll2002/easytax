import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ReconcileClient from './ReconcileClient';

export default async function ReconcilePage() {
  const session = await auth();
  const profileId = session!.user.profileId;

  const { data: bank } = await supabase
    .from('bank_connections')
    .select('*')
    .eq('user_id', profileId)
    .single();

  if (!bank) {
    return (
      <div className="p-4 sm:p-8 max-w-xl">
        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
          Reconcile Transactions
        </h1>
        <p style={{ color: '#9A8F83', marginBottom: '2rem', lineHeight: 1.7 }}>
          Reconciliation pulls your bank transactions and lets you categorise each one as business income, business expense, or personal — so your accounts are always accurate.
        </p>

        <div className="p-6 rounded-2xl" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: '#F5EDDC' }}>
              🏦
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>No bank account connected</p>
              <p className="text-sm mb-4" style={{ color: '#9A8F83', lineHeight: 1.6 }}>
                Connect your business bank account via Open Banking to start reconciling transactions. We use Plaid — read-only access, we can never move money.
              </p>
              <Link
                href="/dashboard/tax/banking"
                className="inline-block px-5 py-2.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: '#C4622D', color: '#FDFCF8', textDecoration: 'none' }}
              >
                Connect Bank Account →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <ReconcileClient accountName={bank.account_name} accountId={bank.account_id} />;
}

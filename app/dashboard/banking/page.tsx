import { redirect } from 'next/navigation';

// Bank connection (Open Banking via Plaid) was removed: EasyTax has no AISP
// permission. Records are now entered by hand or imported from a CSV
// statement on the Records page; old links land there.
export default function BankingPage() {
  redirect('/dashboard/reconcile');
}

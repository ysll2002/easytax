import { getTranslations } from 'next-intl/server';
import RecordsClient from './RecordsClient';

// Business records — the customer's digital record for MTD. The route keeps
// its old /dashboard/reconcile path so existing links and navigation work.
export default async function RecordsPage() {
  const t = await getTranslations('dashboard.reconcile');
  return <RecordsClient title={t('title')} intro={t('intro')} />;
}

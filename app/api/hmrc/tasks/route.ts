import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getValidToken, getObligations, getVatObligations, getSaBalanceAndTransactions } from '@/lib/hmrc';
import { IS_HMRC_PRODUCTION } from '@/lib/hmrc-env';
import { taxYearFor, paymentReminders, paymentTasksFromHmrc } from '@/lib/tax-tasks';

export type TaskType =
  | 'quarterly_mtd'
  | 'sa_filing'
  | 'payment_balancing'
  | 'payment_poa1'
  | 'payment_poa2'
  | 'payment_other'
  | 'vat_return';

export type TaskStatus = 'completed' | 'overdue' | 'due_soon' | 'upcoming';

export type Task = {
  id: string;
  type: TaskType;
  title: string;
  subtitle: string;
  dueDate: string;
  status: TaskStatus;
  completedDate?: string;
  actionHref?: string;
  periodStart?: string;
  periodEnd?: string;
  periodKey?: string;
  taxYear?: string;
  // Payments: the amount HMRC says is outstanding ('hmrc'), or a date
  // reminder with no amount when MTD Buddy cannot see the account ('reminder').
  amount?: number;
  source?: 'hmrc' | 'reminder';
};

// Self Assessment Accounts is used against the live API only once HMRC has
// approved it for MTD Buddy (add self-assessment-accounts-api to
// HMRC_PRODUCTION_EOY_APIS); until then the dashboard shows date reminders.
function saAccountsAvailable() {
  if (!IS_HMRC_PRODUCTION) return true;
  return (process.env.HMRC_PRODUCTION_EOY_APIS ?? '').split(',').map(x => x.trim()).includes('self-assessment-accounts-api');
}


function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function taskStatus(dueDate: string, completed: boolean): TaskStatus {
  if (completed) return 'completed';
  const days = daysUntil(dueDate);
  if (days < 0) return 'overdue';
  if (days <= 14) return 'due_soon';
  return 'upcoming';
}

function fmtPeriod(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const e = new Date(end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${s} – ${e}`;
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = session.user.profileId;

  const { data: hmrc } = await supabase
    .from('hmrc_connections')
    .select('nino, vrn, access_token')
    .eq('user_id', profileId)
    .single();

  if (!hmrc?.access_token) return NextResponse.json({ error: 'No HMRC connection' }, { status: 404 });

  const nino = hmrc.nino ?? (process.env.HMRC_ENV !== 'production' ? 'GW460330D' : null);
  const tasks: Task[] = [];
  let paymentsSource: 'hmrc' | 'reminder' = 'reminder';

  try {
    const token = await getValidToken(profileId);

    // ── MTD quarterly obligations ────────────────────────────────────────────
    if (nino) {
      const obligations = await getObligations(nino, token);
      for (const ob of obligations) {
        const isFinal = ob.periodKey === '#001';
        const completed = ob.status === 'Fulfilled';
        const taxYear = taxYearFor(new Date(ob.periodEndDate));

        if (isFinal) {
          tasks.push({
            id:            `sa-filing-${taxYear}`,
            type:          'sa_filing',
            title:         'Self Assessment Final Declaration',
            subtitle:      `Tax year ${taxYear} · Due ${new Date(ob.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
            dueDate:       ob.dueDate,
            status:        taskStatus(ob.dueDate, completed),
            completedDate: ob.receivedDate,
            actionHref:    `/dashboard/individual/tasks`,
            taxYear,
          });
        } else {
          tasks.push({
            id:            `quarterly-${ob.periodKey}-${taxYear}`,
            type:          'quarterly_mtd',
            title:         `Quarterly Update · ${fmtPeriod(ob.periodStartDate, ob.periodEndDate)}`,
            subtitle:      `MTD ITSA · Tax year ${taxYear}`,
            dueDate:       ob.dueDate,
            status:        taskStatus(ob.dueDate, completed),
            completedDate: ob.receivedDate,
            actionHref:    `/dashboard/individual/quarter?start=${ob.periodStartDate}&end=${ob.periodEndDate}&key=${ob.periodKey}`,
            periodStart:   ob.periodStartDate,
            periodEnd:     ob.periodEndDate,
            periodKey:     ob.periodKey,
            taxYear,
          });
        }
      }
    }

    // ── VAT return obligations ───────────────────────────────────────────────
    if (hmrc.vrn) {
      try {
        const vatObs = await getVatObligations(hmrc.vrn, token);
        for (const ob of vatObs) {
          const completed = ob.status === 'F';
          tasks.push({
            id:            `vat-${ob.periodKey}`,
            type:          'vat_return',
            title:         `VAT Return · ${fmtPeriod(ob.start, ob.end)}`,
            subtitle:      `Making Tax Digital · VAT · Due ${new Date(ob.due).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
            dueDate:       ob.due,
            status:        taskStatus(ob.due, completed),
            completedDate: ob.received,
            actionHref:    `/dashboard/individual/vat`,
            periodStart:   ob.start,
            periodEnd:     ob.end,
            periodKey:     ob.periodKey,
          });
        }
      } catch { /* VAT may not be set up */ }
    }

    // ── Self Assessment payments ─────────────────────────────────────────────
    // What HMRC says is owed, when we can ask; otherwise date reminders.
    let payments: 'hmrc' | 'reminder' = 'reminder';
    if (nino && saAccountsAvailable()) {
      try {
        tasks.push(...paymentTasksFromHmrc(await getSaBalanceAndTransactions(nino, token)));
        payments = 'hmrc';
      } catch (err) {
        console.warn('[tasks] Self Assessment Accounts unavailable:', err instanceof Error ? err.message.slice(0, 200) : err);
      }
    }
    if (payments === 'reminder') tasks.push(...paymentReminders());
    paymentsSource = payments;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Deduplicate and sort by due date
  const seen = new Set<string>();
  const unique = tasks.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
  unique.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // payments: 'hmrc' means the payment tasks are what HMRC says is owed, so
  // none of them means nothing to pay.
  return NextResponse.json({ tasks: unique, payments: paymentsSource });
}

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';
import { getValidToken, getObligations, getVatObligations } from '@/lib/hmrc';

export type TaskType =
  | 'quarterly_mtd'
  | 'sa_filing'
  | 'payment_balancing'
  | 'payment_poa1'
  | 'payment_poa2'
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
};

function taxYearFor(date: Date): string {
  const y = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return `${y}-${String(y + 1).slice(2)}`;
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

// Generate SA payment deadlines for a given tax year end (e.g. 2026 for 2025/26)
function paymentTasks(taxYearEndYear: number): Task[] {
  const jan31 = `${taxYearEndYear + 1}-01-31`;
  const jul31 = `${taxYearEndYear + 1}-07-31`;
  const taxYear = `${taxYearEndYear - 1}-${String(taxYearEndYear).slice(2)}`;

  return [
    {
      id:        `poa1-${taxYearEndYear}`,
      type:      'payment_poa1',
      title:     '1st Payment on Account',
      subtitle:  `Self Assessment ${taxYear} · Due 31 Jan ${taxYearEndYear + 1}`,
      dueDate:   jan31,
      status:    taskStatus(jan31, false),
      taxYear,
    },
    {
      id:        `poa2-${taxYearEndYear}`,
      type:      'payment_poa2',
      title:     '2nd Payment on Account',
      subtitle:  `Self Assessment ${taxYear} · Due 31 Jul ${taxYearEndYear + 1}`,
      dueDate:   jul31,
      status:    taskStatus(jul31, false),
      taxYear,
    },
    {
      id:        `balancing-${taxYearEndYear + 1}`,
      type:      'payment_balancing',
      title:     'Balancing Payment',
      subtitle:  `Self Assessment ${taxYear} · Due 31 Jan ${taxYearEndYear + 1}`,
      dueDate:   jan31,
      status:    taskStatus(jan31, false),
      taxYear,
    },
  ];
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
            actionHref:    `/dashboard/tax/tasks`,
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
            actionHref:    `/dashboard/tax/quarter?start=${ob.periodStartDate}&end=${ob.periodEndDate}&key=${ob.periodKey}`,
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
            actionHref:    `/dashboard/tax/vat`,
            periodStart:   ob.start,
            periodEnd:     ob.end,
            periodKey:     ob.periodKey,
          });
        }
      } catch { /* VAT may not be set up */ }
    }

    // ── Payment on account deadlines ─────────────────────────────────────────
    // Show for current and next tax year if they are within ±1 year
    const now = new Date();
    const currentTaxYearEndYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const oneYearAgo = new Date(now); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAhead = new Date(now); oneYearAhead.setFullYear(oneYearAhead.getFullYear() + 1);

    for (const year of [currentTaxYearEndYear - 1, currentTaxYearEndYear, currentTaxYearEndYear + 1]) {
      for (const pt of paymentTasks(year)) {
        const d = new Date(pt.dueDate);
        if (d >= oneYearAgo && d <= oneYearAhead) {
          // Avoid duplicate if SA filing task already covers this period
          tasks.push(pt);
        }
      }
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Deduplicate and sort by due date
  const seen = new Set<string>();
  const unique = tasks.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
  unique.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return NextResponse.json({ tasks: unique });
}

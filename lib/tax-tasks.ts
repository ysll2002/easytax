import type { Task, TaskStatus, TaskType } from '@/app/api/hmrc/tasks/route';
import type { SaBalance } from '@/lib/hmrc';

// Helpers for the dashboard tax task list (/api/hmrc/tasks).

function taskStatus(dueDate: string, now: Date): TaskStatus {
  const days = Math.ceil((new Date(dueDate).getTime() - now.getTime()) / 86400000);
  if (days < 0) return 'overdue';
  if (days <= 14) return 'due_soon';
  return 'upcoming';
}

// UK tax year a date falls in. The tax year starts on 6 April, so 1–5 April
// still belong to the previous year (a period ending 5 April 2019 is 2018-19).
export function taxYearFor(date: Date): string {
  const m = date.getUTCMonth(), d = date.getUTCDate();
  const y = m > 3 || (m === 3 && d >= 6) ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
  return `${y}-${String(y + 1).slice(2)}`;
}

const label = (startYear: number) => `${startYear}-${String(startYear + 1).slice(2)}`;

// Self Assessment payment dates as reminders, for when EasyTax cannot see what
// the customer owes (no HMRC answer from Self Assessment Accounts, or that API
// not yet approved for the live service). They are never marked overdue or
// done, and carry no amount: only dates still ahead, within the next 12
// months, labelled with the tax year each payment is for. The dashboard shows
// them as reminders with a link to check the HMRC account, not as bills.
//   31 January Y : balancing payment for the tax year ending 5 April Y-1,
//                  and the 1st payment on account for the year ending 5 April Y
//   31 July Y    : the 2nd payment on account for the year ending 5 April Y
export function paymentReminders(now: Date = new Date()): Task[] {
  const today = now.toISOString().slice(0, 10);
  const horizon = new Date(now); horizon.setUTCFullYear(horizon.getUTCFullYear() + 1);
  const until = horizon.toISOString().slice(0, 10);
  const out: Task[] = [];
  for (const y of [now.getUTCFullYear(), now.getUTCFullYear() + 1]) {
    const jan31 = `${y}-01-31`, jul31 = `${y}-07-31`;
    const items: Task[] = [
      { id: `balancing-${y}`, type: 'payment_balancing', title: 'Balancing Payment', subtitle: '', dueDate: jan31, status: taskStatus(jan31, now), taxYear: label(y - 2), source: 'reminder' },
      { id: `poa1-${y}`,      type: 'payment_poa1',      title: '1st Payment on Account', subtitle: '', dueDate: jan31, status: taskStatus(jan31, now), taxYear: label(y - 1), source: 'reminder' },
      { id: `poa2-${y}`,      type: 'payment_poa2',      title: '2nd Payment on Account', subtitle: '', dueDate: jul31, status: taskStatus(jul31, now), taxYear: label(y - 1), source: 'reminder' },
    ];
    for (const t of items) {
      if (t.dueDate >= today && t.dueDate <= until) {
        t.subtitle = `Self Assessment ${t.taxYear} · Due ${t.dueDate}`;
        out.push(t);
      }
    }
  }
  return out;
}


/** Which payment a Self Assessment charge is, from HMRC's document description ("ITSA- POA 1", "ITSA- Bal Charge", "TRM New Charge"…). */
function chargeType(description: string): TaskType {
  if (/POA\s*1/i.test(description)) return 'payment_poa1';
  if (/POA\s*2/i.test(description)) return 'payment_poa2';
  if (/Bal(ancing)?\s*Charge|TRM\s*(New|Amend)/i.test(description)) return 'payment_balancing';
  return 'payment_other';
}

/**
 * What the customer actually owes, from HMRC's Self Assessment Accounts:
 * one task per open charge with an amount still outstanding. Nothing owed,
 * no tasks.
 */
export function paymentTasksFromHmrc(balance: SaBalance | null, now: Date = new Date()): Task[] {
  const out: Task[] = [];
  for (const d of balance?.documentDetails ?? []) {
    const amount = Number(d.outstandingAmount ?? 0);
    const due = d.documentDueDate;
    if (!(amount > 0) || !due) continue;
    const description = d.documentDescription ?? d.documentText ?? 'Self Assessment charge';
    const type = chargeType(description);
    out.push({
      id:       `charge-${d.documentId ?? `${type}-${due}`}`,
      type,
      // The title is EasyTax's own, translated (TasksTimeline). HMRC's
      // description is free text that can be a code or, in the sandbox, a
      // placeholder ("document Description"), so it goes in the detail line.
      title:    '',
      subtitle: `Self Assessment ${d.taxYear ?? ''}${type === 'payment_other' && description ? ` · ${description}` : ''} · £${amount.toFixed(2)} to pay`,
      dueDate:  due,
      status:   taskStatus(due, now),
      taxYear:  d.taxYear,
      amount,
      source:   'hmrc',
    });
  }
  return out;
}

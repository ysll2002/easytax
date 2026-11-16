import type { Task, TaskStatus } from '@/app/api/hmrc/tasks/route';

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

// Self Assessment payment dates as reminders. EasyTax cannot see what the
// customer owes or has paid (that needs HMRC's Self Assessment Accounts API),
// so these are never marked overdue or done: only dates still ahead, within
// the next 12 months, are shown, labelled with the tax year each payment is for.
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
      { id: `balancing-${y}`, type: 'payment_balancing', title: 'Balancing Payment', subtitle: '', dueDate: jan31, status: taskStatus(jan31, now), taxYear: label(y - 2) },
      { id: `poa1-${y}`,      type: 'payment_poa1',      title: '1st Payment on Account', subtitle: '', dueDate: jan31, status: taskStatus(jan31, now), taxYear: label(y - 1) },
      { id: `poa2-${y}`,      type: 'payment_poa2',      title: '2nd Payment on Account', subtitle: '', dueDate: jul31, status: taskStatus(jul31, now), taxYear: label(y - 1) },
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


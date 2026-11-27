import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// The growth plan's north star (agent/GROWTH_PLAN_10K_FILERS.md, stg-016):
// how many different people filed with HMRC through MTD Buddy in the current
// filing window.
//
// MTD quarterly updates are due on 7 Feb, 7 May, 7 Aug and 7 Nov, so a window
// runs from the day after one deadline to the next deadline, inclusive.
//
// A "person" is:
//   - ITSA: an individual's own filings (sa_filings.user_id), or an agent's
//     client (sa_filings.client_id), so an agent filing for 50 clients counts 50;
//   - VAT: a VAT number with a successful return submission. VAT returns are
//     not saved in sa_filings; they appear in hmrc_api_log (individuals) and
//     agent_api_log (agents), and the VRN is in the path.
// Someone who files both ITSA and VAT counts once per tax, which is the best
// we can do without joining VRNs to people.

const DEADLINES: [number, number][] = [[1, 7], [4, 7], [7, 7], [10, 7]]; // month index, day

/** The deadline on or after `d` (UTC date), and the one before it. */
export function windowFor(d: Date): { from: Date; deadline: Date; previousDeadline: Date } {
  const y = d.getUTCFullYear();
  const candidates: Date[] = [];
  for (const yr of [y - 1, y, y + 1]) for (const [m, day] of DEADLINES) candidates.push(new Date(Date.UTC(yr, m, day)));
  candidates.sort((a, b) => a.getTime() - b.getTime());
  const today = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const i = candidates.findIndex(c => c.getTime() >= today.getTime());
  const deadline = candidates[i];
  const previousDeadline = candidates[i - 1];
  const from = new Date(previousDeadline.getTime() + 24 * 60 * 60 * 1000);
  return { from, deadline, previousDeadline };
}

const day = (d: Date) => d.toISOString().slice(0, 10);
const VAT_RETURN_PATH = /\/organisations\/vat\/(\d{9,12})\/returns\/?$/;

type Counts = { filers: number; itsa: number; vat: number; firstTime: number };

/** Distinct filers between `from` (inclusive) and `toExclusive`. */
async function countFilers(from: Date, toExclusive: Date): Promise<Counts | null> {
  const fromIso = from.toISOString();
  const toIso = toExclusive.toISOString();

  const [itsa, earlier, vatInd, vatAgent] = await Promise.all([
    supabase.from('sa_filings').select('user_id, client_id').gte('created_at', fromIso).lt('created_at', toIso).limit(100_000),
    supabase.from('sa_filings').select('user_id, client_id').lt('created_at', fromIso).limit(100_000),
    supabase.from('hmrc_api_log').select('path, http_status, method').eq('method', 'POST').like('path', '%/returns')
      .gte('created_at', fromIso).lt('created_at', toIso).limit(100_000),
    supabase.from('agent_api_log').select('path, http_status, method').eq('method', 'POST').like('path', '%/returns')
      .gte('created_at', fromIso).lt('created_at', toIso).limit(100_000),
  ]);
  if (itsa.error || earlier.error) return null;

  const who = (r: { user_id: string; client_id: string | null }) => r.client_id ? `c:${r.client_id}` : `u:${r.user_id}`;
  const itsaSet = new Set((itsa.data ?? []).map(who));
  const before = new Set((earlier.data ?? []).map(who));

  const vatSet = new Set<string>();
  for (const r of [...(vatInd.data ?? []), ...(vatAgent.data ?? [])] as { path: string | null; http_status: number | null }[]) {
    if (!r.path || !r.http_status || r.http_status < 200 || r.http_status >= 300) continue;
    const m = r.path.match(VAT_RETURN_PATH);
    if (m) vatSet.add(m[1]);
  }

  return {
    filers: itsaSet.size + vatSet.size,
    itsa: itsaSet.size,
    vat: vatSet.size,
    // First-time ITSA filers: filed in this window and never before it.
    firstTime: [...itsaSet].filter(k => !before.has(k)).length,
  };
}

export async function filingWindowMetrics(now = new Date()) {
  const w = windowFor(now);
  const end = new Date(w.deadline.getTime() + 24 * 60 * 60 * 1000);
  const prev = windowFor(new Date(w.previousDeadline.getTime()));
  const prevEnd = new Date(prev.deadline.getTime() + 24 * 60 * 60 * 1000);

  const [current, previous] = await Promise.all([countFilers(w.from, end), countFilers(prev.from, prevEnd)]);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  return {
    note: 'Distinct people who filed with HMRC in the quarterly window ending on the deadline. ITSA counts individuals and agent clients; VAT counts VAT numbers. Growth plan target: 10,000 in the window ending 2027-11-07.',
    window:       { from: day(w.from), deadline: day(w.deadline), days_left: Math.round((w.deadline.getTime() - today.getTime()) / 86_400_000) },
    filers:            current?.filers ?? null,
    itsa_filers:       current?.itsa ?? null,
    vat_filers:        current?.vat ?? null,
    first_time_filers: current?.firstTime ?? null,
    previous_window: { deadline: day(prev.deadline), filers: previous?.filers ?? null },
  };
}

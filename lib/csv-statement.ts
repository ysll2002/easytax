// Parsing CSV bank statements the customer downloads from their own bank.
// Runs in the browser; nothing is uploaded until the customer confirms the
// preview.

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(f => f.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some(f => f.trim() !== '')) rows.push(row);
  return rows.map(r => r.map(f => f.trim()));
}

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

function iso(y: number, m: number, d: number): string | null {
  if (y < 100) y += 2000;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// UK banks export day-first dates. ISO dates are also accepted.
export function parseStatementDate(s: string): string | null {
  const t = s.trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = t.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/);
  if (m) return iso(+m[3], +m[2], +m[1]);
  m = t.match(/^(\d{1,2})[\s\-]([A-Za-z]{3})[A-Za-z]*[\s\-](\d{2,4})$/);
  if (m && MONTHS[m[2].toLowerCase()]) return iso(+m[3], MONTHS[m[2].toLowerCase()], +m[1]);
  return null;
}

// "£1,234.56", "-12.00", "(12.00)", "12.00 CR", "12.00 DR"
export function parseAmount(s: string): number | null {
  let t = s.trim();
  if (!t) return null;
  let sign = 1;
  if (/^\(.*\)$/.test(t)) { sign = -1; t = t.slice(1, -1); }
  if (/\bDR$/i.test(t)) { sign = -1; t = t.replace(/\s*DR$/i, ''); }
  t = t.replace(/\s*CR$/i, '');
  t = t.replace(/[£$€,\s]/g, '');
  if (!/^[+-]?\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t) * sign;
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

export type ColumnMap = {
  date: number;
  description: number;
  // Either one signed amount column, or separate money-in / money-out columns.
  amount: number;
  moneyIn: number;
  moneyOut: number;
};

const has = (h: string, ...words: string[]) => words.some(w => h.includes(w));

// Best guess from the header row; the customer can change every column.
export function guessColumns(header: string[]): ColumnMap {
  const h = header.map(x => x.toLowerCase());
  const find = (pred: (x: string) => boolean) => h.findIndex(pred);
  const moneyIn  = find(x => has(x, 'paid in', 'money in', 'credit', 'in (£)', 'deposit'));
  const moneyOut = find(x => has(x, 'paid out', 'money out', 'debit', 'out (£)', 'withdrawal'));
  return {
    date:        find(x => has(x, 'date')),
    description: find(x => has(x, 'description', 'details', 'narrative', 'merchant', 'name', 'reference', 'payee', 'memo')),
    amount:      moneyIn >= 0 && moneyOut >= 0 ? -1 : find(x => has(x, 'amount', 'value')),
    moneyIn,
    moneyOut,
  };
}

export type StatementRow = { date: string; description: string; amount: number };

export function extractRows(rows: string[][], map: ColumnMap): { ok: StatementRow[]; skipped: number } {
  const ok: StatementRow[] = [];
  let skipped = 0;
  for (const r of rows) {
    const date = map.date >= 0 ? parseStatementDate(r[map.date] ?? '') : null;
    const description = map.description >= 0 ? (r[map.description] ?? '').slice(0, 200) : '';
    let amount: number | null = null;
    if (map.amount >= 0) amount = parseAmount(r[map.amount] ?? '');
    else if (map.moneyIn >= 0 || map.moneyOut >= 0) {
      const inn = map.moneyIn >= 0 ? parseAmount(r[map.moneyIn] ?? '') : null;
      const out = map.moneyOut >= 0 ? parseAmount(r[map.moneyOut] ?? '') : null;
      if (inn != null || out != null) amount = (inn ?? 0) - Math.abs(out ?? 0);
    }
    if (!date || amount == null || amount === 0 || !description) { skipped++; continue; }
    ok.push({ date, description, amount });
  }
  return { ok, skipped };
}

'use client';
// Browser-side helpers for business records, shared by the Records page and
// the quarterly update page.

export const recordsUrl = (clientId?: string | null) =>
  clientId ? `/api/records?clientId=${encodeURIComponent(clientId)}` : '/api/records';
const aiUrl = (clientId?: string | null) =>
  clientId ? `/api/records/ai-classify?clientId=${encodeURIComponent(clientId)}` : '/api/records/ai-classify';

const AI_BATCH = 100;   // records per AI call (the route's limit)
const AI_PARALLEL = 3;  // AI calls in flight at once

// Sort the given unreviewed records with AI. Records the AI is not sure about
// stay unreviewed. Returns how many were sorted and how many could not be
// sent because the AI could not be reached.
export async function aiSortIds(
  clientId: string | null | undefined,
  ids: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ sorted: number; failed: number }> {
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += AI_BATCH) batches.push(ids.slice(i, i + AI_BATCH));
  let done = 0, sorted = 0, failed = 0;
  onProgress?.(0, ids.length);
  const run = async () => {
    for (let b = batches.shift(); b; b = batches.shift()) {
      try {
        const res = await fetch(aiUrl(clientId), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: b }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error);
        sorted += data.sorted ?? 0;
      } catch { failed += b.length; }
      done += b.length;
      onProgress?.(done, ids.length);
    }
  };
  await Promise.all(Array.from({ length: AI_PARALLEL }, run));
  return { sorted, failed };
}

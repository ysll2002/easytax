// IndexNow submission.
//
// Why this and not "wait for the crawler": the archive gains a page a day and
// gets roughly three article page views a week. Two of the three referrers we
// see at all are search engines, and one of them is Bing — which, with Yandex
// and Seznam, honours IndexNow. A ping costs one HTTP request and moves
// discovery from "whenever a crawler next visits a low-authority domain" to
// minutes.
//
// The key is public by design: the protocol authenticates a submission by
// requiring the same key to be readable at https://<host>/<key>.txt, which is
// why it is committed to /public rather than held as a secret. Rotating it
// means changing both this constant and the file name.

export const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY || '755f842c2f5b70b46ea93245998017ed';

const HOST = 'easytax.vip';
const ENDPOINT = 'https://api.indexnow.org/IndexNow';

/** IndexNow accepts at most 10,000 URLs per submission. */
const MAX_URLS = 10_000;

export type IndexNowResult = {
  submitted: number;
  ok: boolean;
  status: number | null;
  skipped?: string;
  error?: string;
};

/**
 * Submits URLs to IndexNow.
 *
 * Never throws. A failed ping is a missed optimisation, not an error worth
 * failing a publish or a cron over — the caller has already done the thing
 * that mattered.
 *
 * No-ops outside production: a preview deployment submitting easytax.vip URLs
 * would be telling search engines that pages changed when they have not, and
 * repeated false signals are how a host gets its submissions ignored.
 */
export async function submitToIndexNow(urls: string[]): Promise<IndexNowResult> {
  const unique = [...new Set(urls.filter(u => u.startsWith(`https://${HOST}/`) || u === `https://${HOST}`))];

  if (unique.length === 0) {
    return { submitted: 0, ok: true, status: null, skipped: 'no valid URLs' };
  }

  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return {
      submitted: 0,
      ok: true,
      status: null,
      skipped: `non-production environment (${process.env.VERCEL_ENV})`,
    };
  }

  const urlList = unique.slice(0, MAX_URLS);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });

    // 200 accepted, 202 accepted but key still being validated. Both are fine.
    const ok = res.status === 200 || res.status === 202;
    if (!ok) {
      console.warn(`[indexnow] submission rejected with ${res.status}`);
    }
    return { submitted: ok ? urlList.length : 0, ok, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[indexnow] submission failed', message);
    return { submitted: 0, ok: false, status: null, error: message };
  }
}

/** Convenience for the single-page case, e.g. an article going live. */
export function articleUrl(slug: string): string {
  return `https://${HOST}/tax-tips/${slug}`;
}

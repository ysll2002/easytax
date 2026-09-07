import sitemap from '@/app/sitemap';

// IndexNow submission.
//
// Why this and not "wait for the crawler": the archive gains a page a day, the
// site publishes 150+ URLs, and two of the three referrers we see at all are
// search engines — one of them Bing, which with Yandex, Seznam and Naver
// honours IndexNow. A ping costs one HTTP request and moves discovery from
// "whenever a crawler next visits a low-authority domain" to minutes.
//
// Google does not participate. This does nothing for our larger search
// referrer, and being crawled is not being ranked — it removes a discovery
// bottleneck, it does not create demand.
//
// The key is public by design: the protocol authenticates a submission by
// requiring the same key to be readable at https://<host>/<key>.txt, which is
// why it is committed to /public rather than held as a secret. Rotating it
// means changing both this constant and the file in /public — and the file has
// to be live before the next submission, or every ping comes back 403.

export const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY || '55251a02303938bd113be2863f9c7b6c';

export const INDEXNOW_HOST = 'easytax.vip';

const ENDPOINT = 'https://api.indexnow.org/indexnow';

/** IndexNow accepts at most 10,000 URLs per submission. */
const MAX_URLS = 10_000;

export type IndexNowResult = {
  submitted: number;
  ok: boolean;
  status: number | null;
  skipped?: string;
  error?: string;
  body?: string;
};

/** Every URL we publish, taken from the sitemap so the two cannot drift.
 *  Submitting a URL the sitemap does not list would be telling a crawler about
 *  a page we do not ourselves claim exists. */
export async function publishedUrls(): Promise<string[]> {
  const entries = await sitemap();
  return [...new Set(entries.map(e => (typeof e.url === 'string' ? e.url : String(e.url))))];
}

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
  // Exact host match rather than a prefix test, so a lookalike host in the
  // input cannot be submitted under our key.
  const unique = [
    ...new Set(
      urls.filter(u => u.startsWith(`https://${INDEXNOW_HOST}/`) || u === `https://${INDEXNOW_HOST}`),
    ),
  ];

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
        host: INDEXNOW_HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });

    // 200 accepted, 202 accepted but key validation still pending. Anything
    // else is worth surfacing rather than swallowing — a 403 means the key
    // file is not reachable, which is otherwise completely silent.
    const ok = res.status === 200 || res.status === 202;
    const body = await res.text().catch(() => '');
    if (!ok) console.warn(`[indexnow] submission rejected with ${res.status}`);

    return {
      submitted: ok ? urlList.length : 0,
      ok,
      status: res.status,
      ...(body ? { body: body.slice(0, 500) } : {}),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[indexnow] submission failed', message);
    return { submitted: 0, ok: false, status: null, error: message };
  }
}

/** Convenience for the single-page case, e.g. an article going live. */
export function articleUrl(slug: string): string {
  return `https://${INDEXNOW_HOST}/tax-tips/${slug}`;
}

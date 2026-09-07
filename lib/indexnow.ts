import sitemap from '@/app/sitemap';

// IndexNow submission.
//
// The site publishes 130+ URLs — 109 articles, the topic hubs, the free tools
// and the comparison pages — and took 2 organic search visits in the whole of
// the last 7 days. Crawl budget is the constraint: a page a crawler has not
// fetched cannot rank, and passive discovery of a low-authority site runs in
// weeks. IndexNow inverts that. It is a single POST that tells Bing, Yandex,
// Seznam and Naver which URLs changed; they fetch in hours rather than
// waiting to rediscover them. Google does not participate — this does nothing
// for Google, and the daily-article cron is the thing that keeps giving it a
// reason to come back.
//
// The key is not a secret. IndexNow authenticates a submission by fetching
// https://<host>/<key>.txt and checking it contains the key, which proves the
// submitter controls the host — so the same value has to be in the repo under
// public/ and here. What must stay secret is CRON_SECRET, which is what stops
// anyone from making us submit on demand.

export const INDEXNOW_KEY = '55251a02303938bd113be2863f9c7b6c';

export const INDEXNOW_HOST = 'easytax.vip';

const ENDPOINT = 'https://api.indexnow.org/indexnow';

/** IndexNow caps a single submission at 10,000 URLs. We are far under that,
 *  but the guard keeps a runaway article table from silently truncating. */
const MAX_URLS = 10_000;

/** Every URL we publish, taken from the sitemap so the two cannot drift.
 *  Submitting a URL the sitemap does not list would be telling a crawler about
 *  a page we do not ourselves claim exists. */
export async function publishedUrls(): Promise<string[]> {
  const entries = await sitemap();
  const urls = entries
    .map(e => (typeof e.url === 'string' ? e.url : String(e.url)))
    .filter(u => u.startsWith(`https://${INDEXNOW_HOST}`));
  return Array.from(new Set(urls)).slice(0, MAX_URLS);
}

export interface SubmitResult {
  submitted: number;
  status: number;
  ok: boolean;
  body: string;
}

export async function submitToIndexNow(urlList: string[]): Promise<SubmitResult> {
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

  // 200 accepted, 202 accepted but key validation still pending. Anything else
  // is worth surfacing in the response rather than swallowing — a 403 means
  // the key file is not reachable, which is silent otherwise.
  const body = await res.text().catch(() => '');
  return {
    submitted: urlList.length,
    status: res.status,
    ok: res.status === 200 || res.status === 202,
    body: body.slice(0, 500),
  };
}

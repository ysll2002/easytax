'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';

// The two buttons that release an article, and the two that resolve a staged
// rewrite. They post to /api/admin/article-review — the endpoint that already
// stamps the reviewer, sets reviewed_at and pings IndexNow — rather than
// reimplementing any of that here.
//
// The key travels from the page's own URL. That is the existing convention for
// everything under /api/admin, and it is worth being plain about the trade:
// anyone holding it can publish a page to the live site, so it belongs in a
// password manager and not in a bookmark bar on a shared machine.

type Action = 'publish' | 'reject' | 'promote' | 'discard';

const LABELS: Record<Action, string> = {
  publish: 'Publish',
  reject:  'Reject',
  promote: 'Promote rewrite',
  discard: 'Discard rewrite',
};

export default function ReviewActions({
  slug,
  adminKey,
  reviewer,
  kind,
}: {
  slug: string;
  adminKey: string;
  /** Stamped into reviewed_by, and shown on the article as who checked it. */
  reviewer: string;
  kind: 'draft' | 'upgrade';
}) {
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const run = async (action: Action) => {
    if (state === 'working') return;
    // Publishing puts a page on the public site under our name. A stray click
    // on a trackpad should not be able to do that silently.
    if (!confirm(`${LABELS[action]} “${slug}”?`)) return;

    setState('working');
    setMessage('');
    try {
      const res = await fetch(`/api/admin/article-review?key=${encodeURIComponent(adminKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, action, reviewer }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState('error');
        setMessage(data.error ?? `Request failed (${res.status}).`);
        return;
      }
      setState('done');
      setMessage(
        action === 'publish'
          ? 'Published and submitted to IndexNow.'
          : action === 'promote'
            ? 'Rewrite promoted and resubmitted to IndexNow.'
            : 'Done.',
      );
      // The queue this row belongs to has changed, so the listing behind it is
      // now wrong. Reload rather than patch the DOM: the page is a server
      // component reading Supabase, and a reload is the honest refresh.
      setTimeout(() => window.location.reload(), 900);
    } catch {
      setState('error');
      setMessage('Network error. Nothing was changed.');
    }
  };

  const [accept, reject]: [Action, Action] =
    kind === 'draft' ? ['publish', 'reject'] : ['promote', 'discard'];

  if (state === 'done') {
    return (
      <p className="text-sm flex items-center gap-1.5 m-0" style={{ color: '#6B8E6E' }}>
        <Check size={15} strokeWidth={2.5} /> {message}
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => run(accept)}
          disabled={state === 'working'}
          className="inline-flex items-center justify-center gap-1.5"
          style={{
            minHeight: 44,
            padding: '0.6rem 1.3rem',
            borderRadius: 50,
            border: 'none',
            backgroundColor: state === 'working' ? '#6B8E6E99' : '#6B8E6E',
            color: '#FDFCF8',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: state === 'working' ? 'default' : 'pointer',
          }}
        >
          <Check size={15} strokeWidth={2.5} />
          {state === 'working' ? 'Working…' : LABELS[accept]}
        </button>
        <button
          type="button"
          onClick={() => run(reject)}
          disabled={state === 'working'}
          className="inline-flex items-center justify-center gap-1.5"
          style={{
            minHeight: 44,
            padding: '0.6rem 1.3rem',
            borderRadius: 50,
            border: '1.5px solid #DDD5C8',
            backgroundColor: 'transparent',
            color: '#4A4035',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: state === 'working' ? 'default' : 'pointer',
          }}
        >
          <X size={15} strokeWidth={2.5} />
          {LABELS[reject]}
        </button>
      </div>
      {state === 'error' && (
        <p className="text-sm mt-2 m-0" role="alert" style={{ color: '#B3261E' }}>
          {message}
        </p>
      )}
    </div>
  );
}

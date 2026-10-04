'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { trackClient } from './PageViewTracker';

// The copy-paste block on /tools/embed.
//
// A visible copy button rather than "select the text below": the snippet is
// eight lines of HTML with an attribute per line, and a manual selection on a
// phone reliably loses the closing tag. The number of copies is also the only
// leading indicator we get — an embed shows up in `embed_served` only once
// somebody has actually published the page they pasted it into, which can be
// days later.

export default function EmbedSnippet({ snippet }: { snippet: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    trackClient('share_copy', { tool: 'mtd_deadline', channel: 'embed_snippet' });
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard access is refused in some browsers without a secure context.
      // The snippet is on screen and selectable either way, so say so rather
      // than leaving a button that appears to do nothing.
      window.alert('Copy is blocked in this browser — select the code above instead.');
    }
  };

  return (
    <div>
      <pre
        className="rounded-2xl p-4 sm:p-5 text-xs sm:text-sm"
        style={{
          backgroundColor: '#1C1208',
          color: '#F0EBE1',
          // The snippet is wider than a phone. Scrolling it inside its own box
          // is the alternative to the whole page scrolling sideways.
          overflowX: 'auto',
          lineHeight: 1.6,
        }}
      >
        <code>{snippet}</code>
      </pre>

      <button
        type="button"
        onClick={copy}
        className="mt-3 inline-flex items-center gap-2 px-5 rounded-full text-sm font-semibold transition-all"
        style={{
          minHeight: 44,
          backgroundColor: copied ? '#3F7D5C' : '#C4622D',
          color: '#FDFCF8',
        }}
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? 'Copied' : 'Copy the code'}
      </button>
    </div>
  );
}

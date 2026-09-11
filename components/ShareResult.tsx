'use client';

import { useState } from 'react';
import { Link2, Check, MessageCircle, Mail } from 'lucide-react';
import { trackClient } from './PageViewTracker';

// "Copy this answer as a link."
//
// The three calculators answer a question a stranger is actively asking, for
// free and without an email gate — which is exactly the shape of page that
// earns a link. But until now the answer existed only in React state, so the
// most natural way for it to spread was impossible: someone helping a friend
// in a forum thread could link the *tool* and say "put your numbers in". They
// could not link the answer.
//
// Two deliberate choices about the reader's data:
//
//  1. The figures go into a URL only when the reader presses one of these
//     controls. We never write them into the address bar on calculation, so a
//     calculation that is merely performed leaves nothing in browser history
//     and nothing in the `Referer` header of any outbound link they click next.
//  2. The event we record carries the tool and the destination. It does not
//     carry the query string, and so does not carry their tax position.

export type ShareChannel = 'copy' | 'whatsapp' | 'email' | 'x';

export interface ShareResultProps {
  /** Matches the `tool` prop on the other tool events. */
  tool: string;
  /** Path of the tool page, e.g. `/self-assessment-penalty-calculator`. */
  path: string;
  /** Encoded result, from lib/share-results — the query string only. */
  query: string;
  /** One line describing the answer, used as the message body when sharing. */
  summary: string;
}

export default function ShareResult({ tool, path, query, summary }: ShareResultProps) {
  const [copied, setCopied] = useState(false);

  // Built at click time from the live origin rather than a constant, so the
  // link a reader copies on staging points at staging and the link they copy
  // on production points at production.
  const url = () =>
    typeof window === 'undefined' ? '' : `${window.location.origin}${path}?${query}`;

  const record = (channel: ShareChannel) =>
    trackClient(channel === 'copy' ? 'share_copy' : 'share_click', { tool, channel });

  const copy = async () => {
    const link = url();
    record('copy');
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard is refused without a user gesture in some browsers and over
      // plain HTTP. Fall back to opening the link so the reader can copy it
      // out of the address bar themselves, rather than a control that silently
      // does nothing.
      window.prompt('Copy this link:', link);
    }
  };

  const text = `${summary} — worked out on EasyTax`;

  const links: { channel: ShareChannel; label: string; href: () => string; icon: React.ReactNode }[] = [
    {
      channel: 'whatsapp',
      label: 'WhatsApp',
      icon: <MessageCircle size={15} />,
      href: () => `https://wa.me/?text=${encodeURIComponent(`${text}: ${url()}`)}`,
    },
    {
      channel: 'email',
      label: 'Email',
      icon: <Mail size={15} />,
      href: () =>
        `mailto:?subject=${encodeURIComponent(summary)}&body=${encodeURIComponent(`${text}:\n\n${url()}`)}`,
    },
  ];

  return (
    <div
      className="mt-6 rounded-2xl p-4 sm:p-5"
      style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}
    >
      <p className="text-sm font-semibold mb-1" style={{ color: '#1C1208' }}>
        Send this answer to someone
      </p>
      <p className="text-xs mb-4" style={{ color: '#8A7F73' }}>
        The link opens this page with your figures already filled in. Nothing is
        saved on our side, and the numbers only leave your browser if you share it.
      </p>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center justify-center gap-2 px-5 rounded-full text-sm font-semibold transition-all"
          style={{
            minHeight: 44,
            backgroundColor: copied ? '#3F7D5C' : '#C4622D',
            color: '#FDFCF8',
          }}
        >
          {copied ? <Check size={15} /> : <Link2 size={15} />}
          {copied ? 'Link copied' : 'Copy link'}
        </button>

        {links.map(l => (
          <a
            key={l.channel}
            href={l.href()}
            target={l.channel === 'email' ? undefined : '_blank'}
            rel="noopener noreferrer"
            onClick={() => record(l.channel)}
            className="inline-flex items-center justify-center gap-2 px-5 rounded-full text-sm font-medium transition-all"
            style={{
              minHeight: 44,
              backgroundColor: '#FDFCF8',
              border: '1px solid #DDD5C8',
              color: '#1C1208',
            }}
          >
            {l.icon}
            {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}

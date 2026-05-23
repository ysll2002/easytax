'use client';
import { useEffect, useRef, useState } from 'react';
import type { ReconcileAction, Tx } from '@/app/api/ai/reconcile/route';

type Message = { role: 'user' | 'assistant'; content: string };

export default function ReconcileChat({
  transactions,
  onActions,
  onUndo,
  canUndo,
}: {
  transactions: Tx[];
  onActions: (actions: ReconcileAction[]) => void;
  onUndo: () => void;
  canUndo: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I can help you categorise transactions. Try "mark all Stripe payments as business income" or "everything from Amazon is a business expense".' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (data.actions?.length) onActions(data.actions);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Done.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#FDFCF8' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#DDD5C8' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: '#1C1208', color: '#FDFCF8' }}>✦</div>
          <span className="font-semibold text-sm" style={{ color: '#1C1208' }}>AI Assistant</span>
        </div>
        {canUndo && (
          <button
            onClick={onUndo}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: '#F0EBE1', color: '#9A8F83', border: '1px solid #DDD5C8' }}
          >
            ↩ Undo
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] px-3 py-2 rounded-2xl text-sm"
              style={{
                backgroundColor: m.role === 'user' ? '#1C1208' : '#F0EBE1',
                color: m.role === 'user' ? '#FDFCF8' : '#1C1208',
                borderBottomRightRadius: m.role === 'user' ? '4px' : undefined,
                borderBottomLeftRadius: m.role === 'assistant' ? '4px' : undefined,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-2xl text-sm" style={{ backgroundColor: '#F0EBE1', color: '#9A8F83', borderBottomLeftRadius: '4px' }}>
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t" style={{ borderColor: '#DDD5C8' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="e.g. mark all Monzo payments as personal…"
            disabled={loading}
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
            style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8', color: '#1C1208' }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: loading || !input.trim() ? '#DDD5C8' : '#1C1208',
              color: '#FDFCF8',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            ↑
          </button>
        </div>
        <p className="text-xs mt-2 text-center" style={{ color: '#BDB5AA' }}>
          Powered by Claude · Changes apply instantly
        </p>
      </div>
    </div>
  );
}

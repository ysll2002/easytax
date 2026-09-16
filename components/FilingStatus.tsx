'use client';

import { useState } from 'react';
import { Clock, Check, Bell } from 'lucide-react';

// Where the user stands, said plainly, inside the product.
//
// Written on 2026-09-16 after reading what a real user actually did. Someone
// found the site through Google on the evening of the 15th, registered, and
// spent about an hour moving through eight dashboard pages — company, P&L,
// banking, reconcile, profile, HMRC — then came back the next morning and did
// it again. 108 engaged events. She is the first genuinely new user in nearly
// three weeks.
//
// There was nothing for her to find. Filing is not possible until HMRC grants
// production access, which is pending, and no screen in the product said so.
// 48 accounts have now been through some version of that, 17 of them far
// enough to connect HMRC, and none of them has ever been told when the thing
// they signed up for will work.
//
// Two rules held while writing this.
//
// It does not oversell. The copy says approval is pending and does not name a
// date, because we do not have one, and a date we miss costs more trust than
// the uncertainty does. This is the same rule `llms.txt` holds to for answer
// engines and the `/trust` page holds to for visitors; it should not be weaker
// for the people who actually signed up.
//
// And the ask is one tap, on an address we already have. Anyone seeing this is
// signed in, so making them type their email into a capture form — the thing
// the public pages do, which has converted nobody in thirteen days — would be
// asking a customer to re-introduce themselves.

export default function FilingStatus({ initiallySubscribed = false }: { initiallySubscribed?: boolean }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>(
    initiallySubscribed ? 'done' : 'idle',
  );

  const subscribe = async () => {
    if (state === 'loading' || state === 'done') return;
    setState('loading');
    try {
      const res = await fetch('/api/filing-waitlist', { method: 'POST' });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  };

  return (
    <div
      className="p-4 sm:p-5 rounded-2xl mb-6"
      style={{ backgroundColor: '#FBF0E6', border: '1px solid #E8C9A8' }}
    >
      <div className="flex items-start gap-3">
        <Clock size={18} color="#C4622D" strokeWidth={2} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm mb-1" style={{ color: '#7A4A1E' }}>
            Filing to HMRC is not open yet
          </p>
          <p className="text-xs mb-3" style={{ color: '#7A4A1E', lineHeight: 1.6 }}>
            Everything here works against HMRC&apos;s test systems today. Submitting a real
            return needs HMRC to grant production access, and that review is still in
            progress — we have not been given a date. You can connect HMRC, link a bank
            and reconcile in the meantime, and none of that has to be redone afterwards.
          </p>

          {state === 'done' ? (
            <p
              className="text-xs inline-flex items-center gap-1.5 rounded-lg px-3 py-2"
              style={{ color: '#1C1208', backgroundColor: '#F0EBE1', minHeight: 36 }}
            >
              <Check size={14} color="#6B8E6E" strokeWidth={2.5} />
              We&apos;ll email you the day filing opens.
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={subscribe}
                disabled={state === 'loading'}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold"
                // 44px is the minimum comfortable touch target, and this is the
                // one action on the screen — it is not going to be a 28px link.
                style={{
                  minHeight: 44,
                  backgroundColor: '#C4622D',
                  color: '#FDFCF8',
                  border: 'none',
                  cursor: state === 'loading' ? 'default' : 'pointer',
                  opacity: state === 'loading' ? 0.7 : 1,
                }}
              >
                <Bell size={15} strokeWidth={2} />
                {state === 'loading' ? 'Saving…' : 'Email me when filing opens'}
              </button>
              {state === 'error' && (
                <p className="text-xs mt-2" style={{ color: '#B3261E' }}>
                  That didn&apos;t save. Please try again.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

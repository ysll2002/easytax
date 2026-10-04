// The answer, before the explanation.
//
// Every page on this site that targets a question currently opens by telling
// the reader what the page is going to do for them — "Enter three things and
// you will see exactly which bands you are in". That is a fine second
// paragraph and a bad first one, for two audiences at once:
//
//   - A search engine builds a featured snippet out of a passage that answers
//     the query directly. A paragraph describing a form does not answer
//     "how much is the fine for filing self assessment late", so the snippet
//     goes to whoever did answer it. On a domain that is not going to outrank
//     GOV.UK on the blue link, the snippet is the realistic prize.
//   - An answer engine quotes the passage that contains the answer. Over the
//     48 hours to 2026-09-12, ClaudeBot, GPTBot, PerplexityBot and
//     meta-externalagent fetched this site 20 times while organic search sent
//     nothing for three days. They are the channel with a pulse, and they lift
//     whatever the page says first.
//
// So: a short, self-contained, factual answer in its own block, phrased so it
// survives being cut out of the page and pasted somewhere else. That last
// constraint is the whole discipline — "it depends on which band you are in"
// reads fine in context and is useless out of it.
//
// Deliberately not a `<blockquote>` or an aside: it is the substance of the
// page, and marking it as an aside invites a crawler to treat it as one.

export default function ShortAnswer({
  children,
  label = 'Short answer',
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <div
      className="p-5 sm:p-6 rounded-2xl mb-8"
      style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E8E2DA', maxWidth: 660 }}
    >
      <p
        className="text-xs uppercase mb-2"
        style={{ color: '#9A8F83', letterSpacing: '0.08em' }}
      >
        {label}
      </p>
      <p className="text-base sm:text-lg" style={{ color: '#4A4035', lineHeight: 1.7 }}>
        {children}
      </p>
    </div>
  );
}

/**
 * Parsing the model's article JSON without losing the day to one character.
 *
 * On 2026-09-17 the daily run recorded `mode: "none", written: 0` and this
 * error:
 *
 *     Expected ',' or '}' after property value in JSON at position 6196
 *     (line 4 column 5970)
 *
 * Line 4 is `content`. Position 6196 is five thousand characters into a
 * 2,500-word HTML body. The model had emitted one `"` inside the string
 * without escaping it, the parser closed the string there, found prose where
 * it wanted a comma, and threw — and because `parseDraft` was called from
 * `callModel` with nothing between it and the handler's outer catch, the throw
 * propagated past the retry, past the rest of the batch, and out of the run.
 * A whole day of the only pipeline that adds pages to this site, lost to a
 * quotation mark.
 *
 * Two defences, in order of preference:
 *
 *  1. `parseDraft` — strict parse first, then one *content-preserving* repair
 *     for the failure actually observed. The repair does not guess: it locates
 *     the four known keys and takes each value between its opening quote and
 *     the quote that closes it, which is the last one before the next key. A
 *     stray `"` in the middle is then simply part of the value, which is what
 *     the model meant. If the object does not have that shape, the repair
 *     declines rather than returning something plausible.
 *
 *  2. `DraftParseError` — when the repair declines, the caller regenerates.
 *     A second sample from the model is a better bet than a cleverer parser,
 *     and it cannot corrupt anything.
 *
 * The repair is allowed to be the last word only because everything it
 * produces still goes to `/admin/review` before a reader sees it. If drafts
 * were ever auto-published this would have to fail closed instead.
 */

/** Thrown when neither a strict parse nor the repair could read the response.
 *  Carries enough to tell a truncation from a syntax slip in the daily run's
 *  recorded outcome, which is the only place anybody will see it. */
export class DraftParseError extends Error {
  constructor(
    readonly reason: string,
    readonly rawLength: number,
    readonly repairAttempted: boolean,
  ) {
    super(
      `could not parse the model's JSON (${reason}); ${rawLength} characters received` +
        (repairAttempted ? ', field recovery declined' : ''),
    );
    this.name = 'DraftParseError';
  }
}

/** The keys the generator prompt asks for, in the order it asks for them.
 *  The repair uses the *set* rather than the order — a model that reorders
 *  them is still recoverable — but `sources` is last in the prompt and is the
 *  only one allowed to be absent. */
const STRING_KEYS = ['title', 'excerpt', 'content'] as const;

export type ParsedDraft = {
  title: string;
  excerpt: string;
  content: string;
  sources?: unknown;
};

/** Index of the first character after `"<key>"` and its colon, or -1. */
function valueStart(text: string, key: string): number {
  const at = text.indexOf(`"${key}"`);
  if (at < 0) return -1;
  let i = at + key.length + 2;
  while (i < text.length && /\s/.test(text[i])) i++;
  if (text[i] !== ':') return -1;
  i++;
  while (i < text.length && /\s/.test(text[i])) i++;
  return text[i] === '"' ? i + 1 : -1;
}

/** Every key the prompt can produce, used to recognise where one value ends
 *  and the next pair begins. */
const ALL_KEYS: readonly string[] = [...STRING_KEYS, 'sources'];

/**
 * Read one string value that may contain unescaped quotes.
 *
 * The hard part is deciding which `"` ends the value, because by assumption
 * some of them do not. "The first quote followed by a comma" is not good
 * enough — an article containing `He said "go", then left` ends its value at
 * the wrong place and silently truncates the body, which is a worse outcome
 * than the parse error this exists to avoid.
 *
 * So a terminator has to be followed by something only a real terminator can
 * be followed by:
 *
 *   - `,` then the *opening of another known key* (`"content":`), or
 *   - `}` then the end of the object.
 *
 * `"go", then left` fails the first test (no quoted key after the comma) and
 * is correctly read as text. A body that manages to contain the exact string
 * `", "content":` would still fool it; that is a sentence no article writes,
 * and if one ever does the quality gate sees a short body rather than a
 * corrupted one.
 */
function readLooseString(text: string, from: number): { value: string; end: number } | null {
  for (let i = from; i < text.length; i++) {
    if (text[i] !== '"') continue;
    // A properly escaped quote is part of the value, never a terminator.
    let backslashes = 0;
    for (let b = i - 1; b >= from && text[b] === '\\'; b--) backslashes++;
    if (backslashes % 2 === 1) continue;

    const rest = text.slice(i + 1);
    const afterComma = rest.match(/^\s*,\s*"([A-Za-z_][A-Za-z0-9_]*)"\s*:/);
    if (afterComma && ALL_KEYS.includes(afterComma[1])) {
      return { value: text.slice(from, i), end: i + 1 };
    }
    if (/^\s*\}\s*$/.test(rest)) {
      return { value: text.slice(from, i), end: i + 1 };
    }
  }
  return null;
}

/** Undo the escapes JSON would have undone, and nothing else. A value read by
 *  `readLooseString` has never been through `JSON.parse`, so `\n` in it is
 *  still two characters. */
function unescape(s: string): string {
  return s.replace(/\\(["\\/bfnrt]|u[0-9a-fA-F]{4})/g, (whole, code: string) => {
    switch (code[0]) {
      case '"': return '"';
      case '\\': return '\\';
      case '/': return '/';
      case 'b': return '\b';
      case 'f': return '\f';
      case 'n': return '\n';
      case 'r': return '\r';
      case 't': return '\t';
      case 'u': return String.fromCharCode(parseInt(code.slice(1), 16));
      default: return whole;
    }
  });
}

/**
 * Recover the fields from a response that is nearly JSON.
 *
 * Returns null — never a partial draft — when anything is missing or empty.
 * A draft with an empty body would fail the quality gate anyway, but it would
 * fail it as "too short" and send the reviewer looking for a writing problem
 * rather than a parsing one.
 */
export function repairDraft(text: string): ParsedDraft | null {
  const out: Record<string, string> = {};

  for (const key of STRING_KEYS) {
    const start = valueStart(text, key);
    if (start < 0) return null;
    const read = readLooseString(text, start);
    if (!read) return null;
    const value = unescape(read.value).trim();
    if (!value) return null;
    out[key] = value;
  }

  // `sources` is an array, so it is left to JSON.parse on its own slice: an
  // unescaped quote inside a URL or a label would be recovered wrongly by the
  // scan above, and a missing citation list costs a quality-gate failure
  // rather than a corrupted page.
  let sources: unknown;
  const sourcesAt = text.indexOf('"sources"');
  if (sourcesAt >= 0) {
    const open = text.indexOf('[', sourcesAt);
    const close = text.lastIndexOf(']');
    if (open >= 0 && close > open) {
      try {
        sources = JSON.parse(text.slice(open, close + 1));
      } catch {
        sources = undefined;
      }
    }
  }

  return {
    title: out.title,
    excerpt: out.excerpt,
    content: out.content,
    ...(sources === undefined ? {} : { sources }),
  };
}

/**
 * Strict parse, then repair, then give up loudly.
 *
 * The fence strip stays: a stray ```json wrapper is the one deviation that
 * shows up in practice and is cheap to tolerate.
 */
export function parseDraft(text: string): ParsedDraft {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  try {
    return JSON.parse(cleaned) as ParsedDraft;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    const repaired = repairDraft(cleaned);
    if (repaired) return repaired;
    throw new DraftParseError(reason, cleaned.length, true);
  }
}

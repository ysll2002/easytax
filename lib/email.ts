import { Resend } from 'resend';

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await getResend().emails.send({
    from: 'EasyTax <hello@easytax.vip>',
    to,
    subject: 'Reset your EasyTax password',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0EBE1;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EBE1;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FDFCF8;border-radius:16px;border:1px solid #DDD5C8;overflow:hidden">
        <tr>
          <td style="background:#1C1208;padding:28px 40px">
            <p style="margin:0;font-size:22px;font-weight:700;color:#C4622D;font-family:Georgia,serif">EasyTax</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1C1208;font-family:Georgia,serif">
              Reset your password
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#9A8F83;line-height:1.6">
              Click the button below to set a new password. This link expires in 1 hour.
            </p>
            <a href="${resetUrl}"
              style="display:inline-block;background:#C4622D;color:#FDFCF8;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:50px">
              Reset password →
            </a>
            <p style="margin:24px 0 0;font-size:12px;color:#9A8F83;line-height:1.6">
              If you didn't request this, you can ignore this email — your password won't change.<br>
              Link: ${resetUrl}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #F0EBE1">
            <p style="margin:0;font-size:12px;color:#9A8F83">
              EasyTax · Self Assessment, Sorted.<br>
              <a href="https://easytax.vip" style="color:#9A8F83">easytax.vip</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendWelcomeEmail(to: string, name: string) {
  const firstName = name.split(' ')[0];

  await getResend().emails.send({
    from: 'EasyTax <hello@easytax.vip>',
    to,
    subject: 'Welcome to EasyTax',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0EBE1;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EBE1;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FDFCF8;border-radius:16px;border:1px solid #DDD5C8;overflow:hidden">

        <!-- Header -->
        <tr>
          <td style="background:#1C1208;padding:28px 40px">
            <p style="margin:0;font-size:22px;font-weight:700;color:#C4622D;font-family:Georgia,serif">EasyTax</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px">
            <p style="margin:0 0 8px;font-size:26px;font-weight:700;color:#1C1208;font-family:Georgia,serif">
              Welcome, ${firstName}.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#9A8F83;line-height:1.6">
              Your EasyTax account is ready. Here's what you can do next:
            </p>

            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px">
              ${[
                ['📋', 'Connect your HMRC account', 'Link your Government Gateway to fetch your tax obligations automatically.'],
                ['🏦', 'Connect your bank', 'Import transactions via Open Banking — read-only, we can never move money.'],
                ['📊', 'File your Self Assessment', 'Submit quarterly updates and your final declaration directly to HMRC.'],
              ].map(([icon, title, desc]) => `
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #F0EBE1;vertical-align:top">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:22px;padding-right:14px;vertical-align:top;padding-top:2px">${icon}</td>
                      <td>
                        <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#1C1208">${title}</p>
                        <p style="margin:0;font-size:13px;color:#9A8F83;line-height:1.5">${desc}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`).join('')}
            </table>

            <a href="https://easytax.vip/dashboard"
              style="display:inline-block;background:#C4622D;color:#FDFCF8;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:50px">
              Go to Dashboard →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #F0EBE1">
            <p style="margin:0;font-size:12px;color:#9A8F83">
              EasyTax · Self Assessment, Sorted.<br>
              <a href="https://easytax.vip" style="color:#9A8F83">easytax.vip</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

// ───────────────────────────────────────────────────────────────────────────
// Internal notices
//
// These go to the operator, not to a customer, so they carry no unsubscribe
// link and no marketing footer — PECR's opt-out requirement is about direct
// marketing, and a queue notification to the person who runs the service is
// neither. Everything customer-facing must still go through a sender that
// includes the unsubscribe link (see lib/unsubscribe.ts).
// ───────────────────────────────────────────────────────────────────────────

function ownerEmail(): string {
  return process.env.OWNER_EMAIL || 'lilin.gabriel@gmail.com';
}

/** Sends an operator notice. Never throws: an internal email is not worth
 *  failing a cron over. Returns whether it was accepted. */
export async function sendInternalNotice(subject: string, html: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping internal notice:', subject);
    return false;
  }
  try {
    await getResend().emails.send({
      from: 'EasyTax <hello@easytax.vip>',
      to: ownerEmail(),
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('[email] internal notice failed', err);
    return false;
  }
}

/** Tells the operator that generated drafts are waiting.
 *
 *  Drafts are invisible to readers by design, which means nothing surfaces them
 *  on its own — without this the queue silently grows and the archive quietly
 *  stops gaining pages.
 *
 *  It grew silently anyway, for five days, and this is the rewrite. The old
 *  version of this email did two things wrong and both are fixed here.
 *
 *  1. **It gave instructions instead of a link.** The call to action was
 *     `GET /api/admin/article-review?key=<AGENT_METRICS_KEY>`, i.e. "open a
 *     terminal, find the secret, write a curl command with a JSON body". No
 *     draft was ever released. /admin/review (2026-09-12) is a page that does
 *     the same job with a button, so the email now links straight at it, and
 *     at each individual draft.
 *  2. **It only fired on the days new drafts were written.** A queue that
 *     stops being added to stops being mentioned, which is precisely backwards
 *     — the longer nothing is published, the quieter it got. The caller now
 *     decides with `reviewEmailIsDue()` below, which fires on a freeze whether
 *     or not anything new was generated.
 *
 *  The admin key travels in the link. That is a secret in an inbox, and it is
 *  a deliberate trade: the alternative is the status quo, where the control is
 *  technically available and practically unreachable. The key only opens the
 *  editorial queue, it is already checked server-side before any content
 *  renders, and it is rotatable.
 */
export type ReviewEmailInput = {
  /** Written by this cron run. May be empty on a freeze-alarm send. */
  newDrafts: { title: string; slug: string }[];
  /** Everything waiting, oldest first. */
  queue: { title: string; slug: string }[];
  /** Whole days since the archive last gained a public page. Null = unknown,
   *  which is reported as unknown rather than flattened to zero. */
  daysSinceLastPublish: number | null;
  /** Hours the longest-waiting draft has been waiting. */
  oldestDraftAgeHours: number | null;
};

/** The freeze threshold, in days since the archive last gained a page.
 *
 *  One day is normal: the cron writes at 08:19 and a draft released the same
 *  evening still reads as one. Two means a day's output never reached a
 *  reader. The observed failure ran to five. */
export const PUBLISH_FREEZE_DAYS = 2;

/** Whether this run should mail the owner at all.
 *
 *  Something new to look at, or nothing getting through — and in the second
 *  case it sends every day the freeze lasts, because the whole failure mode
 *  was a queue nobody was reminded about. */
export function reviewEmailIsDue(input: ReviewEmailInput): boolean {
  if (input.newDrafts.length > 0) return true;
  if (input.queue.length === 0) return false;
  return (input.daysSinceLastPublish ?? 0) >= PUBLISH_FREEZE_DAYS;
}

function reviewUrl(slug?: string): string {
  const key = process.env.AGENT_METRICS_KEY;
  const base = 'https://easytax.vip/admin/review';
  const params = new URLSearchParams();
  // No key configured is not a reason to send a broken link: the page says so
  // itself, and a bare URL is still one click closer than a curl command.
  if (key) params.set('key', key);
  if (slug) params.set('slug', slug);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

function button(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}"
     style="display:inline-block;padding:12px 22px;border-radius:999px;background:#1C1208;color:#FDFCF8;
            font-size:14px;font-weight:600;text-decoration:none;line-height:20px">${escapeHtml(label)}</a>`;
}

export async function sendArticleReviewEmail(input: ReviewEmailInput): Promise<boolean> {
  const { newDrafts, queue, daysSinceLastPublish, oldestDraftAgeHours } = input;
  const frozen = (daysSinceLastPublish ?? 0) >= PUBLISH_FREEZE_DAYS;
  const depth = queue.length;

  const rows = queue
    .map(
      d => `<tr><td style="padding:0 0 14px">
              <div style="font-size:14px;font-weight:700;color:#1C1208;line-height:1.4;margin:0 0 4px">
                ${escapeHtml(d.title)}
              </div>
              <a href="${escapeHtml(reviewUrl(d.slug))}"
                 style="font-size:13px;color:#C4622D;text-decoration:none">Read it and decide →</a>
            </td></tr>`,
    )
    .join('');

  // The subject line is the only part that reliably gets read, so the freeze
  // goes in it. "2 drafts awaiting review" was true for five days and told
  // nobody anything was wrong.
  const subject = frozen
    ? `EasyTax: nothing has been published for ${daysSinceLastPublish} days — ${depth} draft${depth === 1 ? '' : 's'} waiting`
    : `EasyTax: ${depth} article draft${depth === 1 ? '' : 's'} awaiting review`;

  const alarm = frozen
    ? `<p style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:#FBF0E6;border:1px solid #E8C9A8;
                 font-size:14px;color:#7A4A1E;line-height:1.6">
         <strong>The archive has stopped moving.</strong> The last article a reader could see went up
         ${daysSinceLastPublish} days ago. The cron has kept writing since; none of it is on the site,
         in the sitemap, or linked from anywhere.
       </p>`
    : '';

  const waited =
    oldestDraftAgeHours === null
      ? ''
      : `<p style="margin:0 0 20px;font-size:13px;color:#9A8F83;line-height:1.6">
           Longest wait in the queue: ${
             oldestDraftAgeHours < 48
               ? `${Math.round(oldestDraftAgeHours)} hours`
               : `${Math.round(oldestDraftAgeHours / 24)} days`
           }.
         </p>`;

  return sendInternalNotice(
    subject,
    `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#F0EBE1;font-family:Arial,sans-serif">
  <table width="560" cellpadding="0" cellspacing="0" align="center" style="background:#FDFCF8;border-radius:16px;border:1px solid #DDD5C8">
    <tr><td style="padding:32px">
      <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#1C1208;font-family:Georgia,serif">
        ${depth} draft${depth === 1 ? '' : 's'} waiting${newDrafts.length > 0 ? ` · ${newDrafts.length} new today` : ''}
      </p>
      <p style="margin:0 0 18px;font-size:14px;color:#9A8F83;line-height:1.6">
        Nothing here is visible to a reader until you release it.
      </p>
      ${alarm}
      ${waited}
      <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      <p style="margin:6px 0 20px">${button(reviewUrl(), 'Open the review queue')}</p>
      <p style="margin:0;font-size:12px;color:#9A8F83;line-height:1.6">
        Each link opens the draft with its quality report, and publishes or rejects it in one click.
        The link carries the admin key — treat this email as a credential.
      </p>
    </td></tr>
  </table>
</body></html>`,
  );
}

/** Minimal escaping for the few model-authored strings that reach an email
 *  body. Titles come from an LLM, so they are not trusted markup. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ───────────────────────────────────────────────────────────────────────────
// Deadline schedule
//
// The launch waitlist asked for an address and offered nothing back until an
// unknown future date, and converted nobody. This offers something the product
// can actually deliver today — the reader's own MTD quarterly dates, worked out
// from the income they entered — and the address arrives attached to a known
// filing obligation rather than to a vague interest.
//
// It is a marketing email under PECR reg. 22, so it carries a working
// unsubscribe link in the body and a List-Unsubscribe header. Both come from
// lib/unsubscribe.ts, which fails closed without a signing secret — an email
// with a broken opt-out is worse than no email.
// ───────────────────────────────────────────────────────────────────────────

export type ScheduleRow = { label: string; period: string; due: string };

export async function sendDeadlineScheduleEmail(params: {
  to: string;
  taxYearLabel: string | null;
  rows: ScheduleRow[];
  summary: string;
  unsubscribeUrl: string;
  unsubscribeApiUrl: string;
}): Promise<boolean> {
  const { to, taxYearLabel, rows, summary, unsubscribeUrl, unsubscribeApiUrl } = params;

  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — cannot send deadline schedule');
    return false;
  }

  const tableRows = rows
    .map(
      r => `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #F0EBE1;font-size:14px;color:#1C1208;font-weight:600">${escapeHtml(r.label)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F0EBE1;font-size:13px;color:#9A8F83">${escapeHtml(r.period)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F0EBE1;font-size:14px;color:#C4622D;font-weight:600;white-space:nowrap">${escapeHtml(r.due)}</td>
      </tr>`,
    )
    .join('');

  await getResend().emails.send({
    from: 'EasyTax <hello@easytax.vip>',
    to,
    subject: taxYearLabel
      ? `Your Making Tax Digital deadlines for ${taxYearLabel}`
      : 'Your UK tax filing deadlines',
    headers: {
      'List-Unsubscribe': `<${unsubscribeApiUrl}>, <mailto:hello@easytax.vip?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0EBE1;font-family:'DM Sans',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EBE1;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FDFCF8;border-radius:16px;border:1px solid #DDD5C8;overflow:hidden">
        <tr><td style="background:#1C1208;padding:24px 32px">
          <p style="margin:0;font-size:22px;font-weight:700;color:#C4622D;font-family:Georgia,serif">EasyTax</p>
        </td></tr>

        <tr><td style="padding:32px">
          <p style="margin:0 0 10px;font-size:22px;font-weight:700;color:#1C1208;font-family:Georgia,serif">
            Your filing deadlines
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#4A4035;line-height:1.65">${escapeHtml(summary)}</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E2DA;border-radius:12px;overflow:hidden">
            <tr style="background:#F0EBE1">
              <th align="left" style="padding:10px 12px;font-size:12px;color:#9A8F83;font-weight:600;text-transform:uppercase;letter-spacing:.04em">Return</th>
              <th align="left" style="padding:10px 12px;font-size:12px;color:#9A8F83;font-weight:600;text-transform:uppercase;letter-spacing:.04em">Period</th>
              <th align="left" style="padding:10px 12px;font-size:12px;color:#9A8F83;font-weight:600;text-transform:uppercase;letter-spacing:.04em">Due</th>
            </tr>
            ${tableRows}
          </table>

          <p style="margin:24px 0 8px;font-size:13px;color:#4A4035;line-height:1.65">
            Put these in your calendar now — the late-submission penalty regime charges points per
            missed deadline, not per year.
          </p>
          <p style="margin:0 0 24px;font-size:13px;color:#9A8F83;line-height:1.65">
            These dates are the statutory deadlines for the income figure you entered. They are not
            tax advice, and they do not take account of anything specific to your circumstances.
          </p>

          <a href="https://easytax.vip/tools"
             style="display:inline-block;background:#C4622D;color:#FDFCF8;text-decoration:none;font-size:14px;font-weight:600;padding:13px 26px;border-radius:50px">
            See our free tax calculators →
          </a>
        </td></tr>

        <tr><td style="padding:20px 32px;border-top:1px solid #F0EBE1">
          <p style="margin:0 0 8px;font-size:12px;color:#9A8F83;line-height:1.6">
            You asked us for these dates at easytax.vip. We will email you before each deadline
            above, and once when MTD filing opens in EasyTax. Nothing else.
          </p>
          <p style="margin:0;font-size:12px;color:#9A8F83;line-height:1.6">
            EasyTax is a product of Finance Panda Limited · ICO reference ZA540758<br>
            <a href="${unsubscribeUrl}" style="color:#9A8F83">Unsubscribe in one click</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  });

  return true;
}

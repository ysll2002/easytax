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
 *  stops gaining pages. */
export async function sendArticleReviewEmail(
  drafts: { title: string; slug: string }[],
  queueDepth: number,
): Promise<boolean> {
  const rows = drafts
    .map(
      d => `<li style="margin:0 0 10px;font-size:14px;color:#4A4035;line-height:1.5">
              <strong style="color:#1C1208">${escapeHtml(d.title)}</strong><br>
              <span style="color:#9A8F83;font-size:12px">${escapeHtml(d.slug)}</span>
            </li>`,
    )
    .join('');

  return sendInternalNotice(
    `EasyTax: ${drafts.length} article draft${drafts.length === 1 ? '' : 's'} awaiting review (${queueDepth} in queue)`,
    `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#F0EBE1;font-family:Arial,sans-serif">
  <table width="560" cellpadding="0" cellspacing="0" align="center" style="background:#FDFCF8;border-radius:16px;border:1px solid #DDD5C8">
    <tr><td style="padding:32px">
      <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#1C1208;font-family:Georgia,serif">
        ${drafts.length} draft${drafts.length === 1 ? '' : 's'} waiting
      </p>
      <p style="margin:0 0 20px;font-size:14px;color:#9A8F83;line-height:1.6">
        These are not on the site, not in the sitemap and not linked from anywhere until you publish
        them. ${queueDepth} draft${queueDepth === 1 ? '' : 's'} in the queue in total.
      </p>
      <ul style="margin:0 0 24px;padding-left:18px">${rows}</ul>
      <p style="margin:0;font-size:12px;color:#9A8F83;line-height:1.6">
        Review them with <code>GET /api/admin/article-review?key=&lt;AGENT_METRICS_KEY&gt;</code>,
        publish with <code>POST</code> and <code>{"slug":"…","action":"publish"}</code>.
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

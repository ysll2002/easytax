import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { Resend } from 'resend';
import { nextQuarterDeadline, daysUntil } from '@/lib/mtd-dates';
import { unsubscribeUrl, unsubscribeApiUrl } from '@/lib/unsubscribe';

// Reminder for the upcoming MTD ITSA quarterly update.
//
// Previously this route hardcoded the deadlines as the 5th of the month. The
// statutory deadline is the **7th** (one month and two days after quarter end),
// so every reminder it sent named a date two days early. Dates now come from
// lib/mtd-dates.ts, which is the single source of truth shared with the
// homepage countdown and the timetable page.
//
// Three other things this route now does that it did not before:
//   1. Skips anyone who has opted out (PECR reg. 22 / UK GDPR art. 21).
//   2. Carries a working unsubscribe link in every message.
//   3. Refuses to send the same campaign to the same address twice, so an
//      at-least-once cron delivery cannot double-mail the list.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Send when the next deadline is this close. Vercel cron entries in
 *  vercel.json are scheduled to land inside this window; the check here is
 *  what actually decides, so a slightly-off schedule cannot mail the list on
 *  a random day. */
const REMIND_WINDOW_DAYS = { min: 10, max: 18 };

// Postgres unique-violation. Our dedupe guard relies on it.
const UNIQUE_VIOLATION = '23505';
const MISSING_RELATION = new Set(['PGRST205', '42P01', '42703']);

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const quarter = nextQuarterDeadline();
  if (!quarter) {
    return NextResponse.json({ skipped: true, reason: 'No upcoming deadline' });
  }

  const days = daysUntil(quarter.deadline);
  if (days < REMIND_WINDOW_DAYS.min || days > REMIND_WINDOW_DAYS.max) {
    return NextResponse.json({
      skipped: true,
      reason: `Next deadline (${quarter.deadlineLabel}) is ${days} days away, outside the reminder window`,
    });
  }

  // Scoped to the exact quarter, so next quarter's reminder is a fresh
  // campaign and is not blocked by this one's rows.
  const campaign = `mtd-reminder:${quarter.taxYearStart}-${quarter.key}`;

  // `reminder_opt_out` may not exist yet if the 20260904 migration has not
  // been run. Fall back to an unfiltered query rather than failing the run —
  // but only after logging loudly, because in that state we cannot honour
  // opt-outs and must not send.
  let profiles: Array<{ email: string | null; name: string | null }> | null = null;
  const filtered = await supabase
    .from('profiles')
    .select('email, name')
    .eq('reminder_opt_out', false)
    .not('email', 'is', null);

  if (filtered.error) {
    if (MISSING_RELATION.has(filtered.error.code ?? '')) {
      console.error(
        '[mtd-reminder] profiles.reminder_opt_out missing — run supabase/migrations/20260904_email_compliance.sql. Refusing to send.',
      );
      return NextResponse.json(
        { error: 'Opt-out column missing; refusing to send without it' },
        { status: 503 },
      );
    }
    console.error('[mtd-reminder] failed to fetch profiles', filtered.error);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }
  profiles = filtered.data;

  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const profile of profiles ?? []) {
    const email = profile.email?.trim();
    if (!email) continue;

    // Claim the send first. If the row already exists this address has had
    // this campaign, so skip it. Doing this before the send means a crash
    // mid-run cannot produce a duplicate on the next run.
    const claim = await supabase
      .from('email_sends')
      .insert({ email, campaign, status: 'sent' });

    if (claim.error) {
      if (claim.error.code === UNIQUE_VIOLATION) {
        skipped++;
        continue;
      }
      if (MISSING_RELATION.has(claim.error.code ?? '')) {
        console.error(
          '[mtd-reminder] email_sends missing — run supabase/migrations/20260904_email_compliance.sql. Refusing to send.',
        );
        return NextResponse.json(
          { error: 'Send log missing; refusing to send without dedupe' },
          { status: 503 },
        );
      }
      console.error('[mtd-reminder] could not claim send', claim.error);
      failed++;
      continue;
    }

    let optOutUrl: string;
    let optOutPostUrl: string;
    try {
      optOutUrl = unsubscribeUrl(email);
      optOutPostUrl = unsubscribeApiUrl(email);
    } catch (err) {
      // No signing secret configured — an email without a working opt-out is
      // not one we are willing to send.
      console.error('[mtd-reminder] cannot build unsubscribe link', err);
      return NextResponse.json(
        { error: 'UNSUBSCRIBE_SECRET not configured; refusing to send' },
        { status: 503 },
      );
    }

    const firstName = (profile.name ?? email).split(' ')[0];

    try {
      const result = await resend.emails.send({
        from: 'EasyTax <hello@easytax.vip>',
        to: email,
        subject: `Your MTD ITSA ${quarter.key} update is due ${quarter.deadlineLabel}`,
        headers: {
          // One-click unsubscribe, which Gmail and Outlook surface in their own
          // UI. Materially improves deliverability as well as being good practice.
          'List-Unsubscribe': `<${optOutPostUrl}>, <mailto:hello@easytax.vip?subject=Unsubscribe>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
        html: reminderHtml({ firstName, quarter, days, optOutUrl }),
      });
      if (result.error) throw new Error(result.error.message);
      sent++;
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[mtd-reminder] send failed for ${email}: ${message}`);
      // Mark the claimed row failed so a later run can retry this address
      // without unblocking the ones that did go out.
      await supabase
        .from('email_sends')
        .update({ status: 'failed', error: message.slice(0, 500) })
        .eq('email', email)
        .eq('campaign', campaign);
    }
  }

  return NextResponse.json({
    ok: true,
    campaign,
    quarter: quarter.key,
    period: quarter.periodLabel,
    deadline: quarter.deadlineLabel,
    daysUntilDeadline: days,
    sent,
    skipped,
    failed,
  });
}

function reminderHtml({
  firstName,
  quarter,
  days,
  optOutUrl,
}: {
  firstName: string;
  quarter: NonNullable<ReturnType<typeof nextQuarterDeadline>>;
  days: number;
  optOutUrl: string;
}): string {
  return `<!DOCTYPE html>
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
              Hi ${firstName}, your MTD update is due in ${days} days.
            </p>
            <p style="margin:0 0 8px;font-size:15px;color:#4A4035;line-height:1.6">
              Your <strong>${quarter.key}</strong> quarterly update (${quarter.periodLabel})
              must reach HMRC by <strong>${quarter.deadlineLabel}</strong>.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#9A8F83;line-height:1.6">
              Quarterly updates report your cumulative income and expenses since 6 April.
              You can check your figures and deadlines in your EasyTax dashboard.
            </p>
            <a href="https://easytax.vip/dashboard/individual"
              style="display:inline-block;background:#C4622D;color:#FDFCF8;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:50px">
              Open my dashboard →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #F0EBE1">
            <p style="margin:0 0 6px;font-size:12px;color:#9A8F83">
              EasyTax is a product of Finance Panda Limited · <a href="https://easytax.vip" style="color:#9A8F83">easytax.vip</a>
            </p>
            <p style="margin:0;font-size:12px;color:#9A8F83">
              You are receiving this because you have an EasyTax account.
              <a href="${optOutUrl}" style="color:#9A8F83;text-decoration:underline">Unsubscribe from deadline reminders</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

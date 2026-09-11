import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getMtdStatus } from '@/lib/mtd-status';
import { escapeHtml } from '@/lib/email';
import { unsubscribeUrl, unsubscribeApiUrl } from '@/lib/unsubscribe';

// The people who already signed up, and have never heard from us.
//
// The numbers on 2026-09-09, read straight from the database:
//
//   45  registered accounts, the newest of them 2026-08-27
//   15  of those connected their HMRC account
//    1  connected a bank
//    0  have ever filed anything
//    0  have ever received an email from EasyTax that was not a password reset
//       or a welcome message
//
// Signups ran at 28 in June, 10 in July, 3 in August and none at all in
// September. Five consecutive rounds of growth work have gone into attracting
// strangers to a site that gets six organic visits a week, while the warmest
// audience this product will have for months sat untouched. Fifteen people
// went as far as authorising HMRC access — that is not idle interest — and
// then nothing happened to them.
//
// Two things follow, and only one of them is code.
//
// The code is here: the segments, the copy, the opt-out, the dedupe, and a dry
// run that renders exactly what would be sent to exactly whom without sending
// anything. All of it is safe to deploy and safe to run.
//
// The other thing is that sending is a decision for the owner, not for an
// autonomous agent. It is forty-five real people, it is irreversible, and
// under PECR reg. 22 it has to be a decision someone can account for. So the
// send path in /api/admin/reactivation refuses to run without an explicit
// confirmation token typed by a human, and nothing in this repository or its
// crons calls it.

export type Segment = 'connected_never_filed' | 'never_connected';

export type Recipient = {
  email: string;
  name: string | null;
  segment: Segment;
  signedUpAt: string;
};

export type SegmentPlan = {
  segment: Segment;
  /** Scoped to the segment so the two mails are independently repeatable, and
   *  dated so a later campaign is a different key rather than a suppressed
   *  duplicate of this one. */
  campaign: string;
  subject: string;
  eligible: Recipient[];
  suppressed: { opted_out: number; already_sent: number };
};

const CAMPAIGN_DATE = '2026-09';

export function campaignKey(segment: Segment): string {
  return `reactivation:${segment}:${CAMPAIGN_DATE}`;
}

/** First name only, and only when it looks like one. The greeting is the most
 *  visible place a bad row shows up, so anything unexpected falls back to a
 *  greeting that reads fine with no name at all. */
export function firstName(name: string | null): string | null {
  const first = (name ?? '').trim().split(/\s+/)[0];
  if (!first || first.length > 40 || /[<>@]/.test(first)) return null;
  return first;
}

/**
 * Splits the account base into the two groups that need different things said
 * to them, drops anyone who has opted out, and drops anyone this campaign has
 * already reached.
 *
 * Everything degrades to "nobody is eligible" rather than to "send to
 * everyone": a missing `reminder_opt_out` column means we cannot prove someone
 * has not opted out, and a missing `email_sends` table means we cannot prove we
 * have not already written to them. Both are reasons not to send.
 */
export async function planCampaign(): Promise<{
  plans: SegmentPlan[];
  warnings: string[];
  totals: { accounts: number; connected: number; filed: number };
}> {
  const warnings: string[] = [];

  const { data: profileRows, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, name, created_at, reminder_opt_out');
  if (profileError) {
    if (profileError.code === '42703' || profileError.code === 'PGRST204') {
      throw new Error(
        'profiles.reminder_opt_out is missing — run supabase/migrations/20260904_email_compliance.sql. ' +
          'Refusing to build a recipient list that cannot honour opt-outs.',
      );
    }
    throw new Error(profileError.message);
  }

  const [{ data: hmrcRows }, { data: filingRows }] = await Promise.all([
    supabase.from('hmrc_connections').select('user_id'),
    supabase.from('sa_filings').select('user_id'),
  ]);

  const connected = new Set((hmrcRows ?? []).map(r => r.user_id));
  const filed = new Set((filingRows ?? []).map(r => r.user_id));

  const profiles = (profileRows ?? []) as {
    id: string; email: string | null; name: string | null;
    created_at: string; reminder_opt_out: boolean | null;
  }[];

  const optedOut = { connected_never_filed: 0, never_connected: 0 };
  const candidates: Recipient[] = [];

  for (const p of profiles) {
    if (!p.email || !p.email.includes('@')) continue;
    // Someone who has filed does not need reactivating; they need the product
    // to keep working. Both segments exclude them.
    if (filed.has(p.id)) continue;

    const segment: Segment = connected.has(p.id) ? 'connected_never_filed' : 'never_connected';
    if (p.reminder_opt_out) {
      optedOut[segment] += 1;
      continue;
    }
    candidates.push({
      email: p.email.trim().toLowerCase(),
      name: p.name,
      segment,
      signedUpAt: p.created_at,
    });
  }

  // Already-sent suppression. A failure to read the log is a reason to stop,
  // not a reason to send twice.
  const sentKeys = new Set<string>();
  const { data: sendRows, error: sendError } = await supabase
    .from('email_sends')
    .select('email, campaign')
    .in('campaign', [campaignKey('connected_never_filed'), campaignKey('never_connected')]);
  if (sendError) {
    if (sendError.code === '42P01' || sendError.code === 'PGRST205') {
      throw new Error(
        'email_sends is missing — run supabase/migrations/20260904_email_compliance.sql. ' +
          'Refusing to send without a dedupe guard.',
      );
    }
    throw new Error(sendError.message);
  }
  for (const r of sendRows ?? []) sentKeys.add(`${String(r.email).toLowerCase()}|${r.campaign}`);

  const plans: SegmentPlan[] = (['connected_never_filed', 'never_connected'] as Segment[]).map(
    segment => {
      const campaign = campaignKey(segment);
      const inSegment = candidates.filter(c => c.segment === segment);
      const eligible = inSegment.filter(c => !sentKeys.has(`${c.email}|${campaign}`));
      return {
        segment,
        campaign,
        subject: subjectFor(segment),
        eligible,
        suppressed: {
          opted_out: optedOut[segment],
          already_sent: inSegment.length - eligible.length,
        },
      };
    },
  );

  if (profiles.length === 0) warnings.push('No profiles found.');

  return {
    plans,
    warnings,
    totals: {
      accounts: profiles.length,
      connected: profiles.filter(p => connected.has(p.id)).length,
      filed: profiles.filter(p => filed.has(p.id)).length,
    },
  };
}

export function subjectFor(segment: Segment): string {
  const status = getMtdStatus();
  const due = status.dueQuarter?.deadlineLabel;
  return segment === 'connected_never_filed'
    ? due
      ? `Your next MTD quarterly update is due ${due}`
      : 'Your MTD quarterly update deadline'
    : due
      ? `MTD ITSA has started — your next deadline is ${due}`
      : 'Making Tax Digital for Income Tax has started';
}

/**
 * The email body.
 *
 * Two rules it is written to. First, it says what is true today: HMRC
 * production approval is still pending, so it cannot promise that a filing can
 * be made through us this week, and it does not. Claiming otherwise to fifteen
 * people who authorised HMRC access is how you lose the only warm audience
 * there is. Second, everything it offers — the deadline, the calendar feed, the
 * checker — works right now without approval, so the mail is useful even if the
 * reader does nothing else.
 */
export function renderEmail(recipient: Recipient, base = 'https://easytax.vip'): {
  subject: string;
  html: string;
  text: string;
  unsubscribe: string;
  unsubscribeApi: string;
} {
  const status = getMtdStatus();
  const name = firstName(recipient.name);
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi,';
  const optOut = unsubscribeUrl(recipient.email, base);
  const optOutApi = unsubscribeApiUrl(recipient.email, base);

  const deadline = status.dueQuarter
    ? `Your next quarterly update covers ${escapeHtml(status.dueQuarter.periodLabel)} and must reach HMRC by <strong>${escapeHtml(status.dueQuarter.deadlineLabel)}</strong>.`
    : 'The next quarterly update deadline is on your dashboard.';

  const body =
    recipient.segment === 'connected_never_filed'
      ? `<p style="margin:0 0 16px">${greeting}</p>
         <p style="margin:0 0 16px">You connected your HMRC account to EasyTax and then we went quiet. That was our mistake, and this is the one thing worth telling you.</p>
         <p style="margin:0 0 16px">${deadline}</p>
         <p style="margin:0 0 16px">Being straight with you about where we are: our HMRC production approval is still pending, so you cannot yet submit through EasyTax. We are not going to pretend otherwise. What does work today, without an account and without us:</p>
         <ul style="margin:0 0 16px;padding-left:20px">
           <li style="margin:0 0 8px">Your own deadline dates, as a calendar you can subscribe to: <a href="${base}/timetable">${base}/timetable</a></li>
           <li style="margin:0 0 8px">A check of which quarters apply to you: <a href="${base}/mtd-deadline-checker">${base}/mtd-deadline-checker</a></li>
         </ul>
         <p style="margin:0 0 16px">We will email you once — once — when approval lands and you can file. Nothing else.</p>`
      : `<p style="margin:0 0 16px">${greeting}</p>
         <p style="margin:0 0 16px">You created an EasyTax account and never came back. Fair enough. Here is the part that may have changed since.</p>
         <p style="margin:0 0 16px">Making Tax Digital for Income Tax started on 6 April 2026. If your 2024/25 return showed qualifying income over £50,000, you are in it — and since September 2026 HMRC has been signing people up automatically whether or not they asked. ${deadline}</p>
         <p style="margin:0 0 16px">Our HMRC production approval is still pending, so we are not asking you to file with us today. These work now:</p>
         <ul style="margin:0 0 16px;padding-left:20px">
           <li style="margin:0 0 8px">Are you actually in scope, and when: <a href="${base}/mtd-deadline-checker">${base}/mtd-deadline-checker</a></li>
           <li style="margin:0 0 8px">Every MTD and Self Assessment date, as a calendar feed: <a href="${base}/timetable">${base}/timetable</a></li>
         </ul>
         <p style="margin:0 0 16px">If the deadline has already passed you, the penalty position is worth reading: <a href="${base}/self-assessment-penalty-calculator">${base}/self-assessment-penalty-calculator</a></p>`;

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#F0EBE1;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#FDFCF8;border-radius:16px;border:1px solid #DDD5C8">
    <tr><td style="padding:32px 24px">
      <p style="margin:0 0 24px;font-size:18px;font-weight:700;color:#1C1208;font-family:Georgia,serif">EasyTax</p>
      <div style="font-size:15px;color:#4A4035;line-height:1.7">${body}</div>
      <p style="margin:24px 0 0;font-size:12px;color:#9A8F83;line-height:1.6">
        Finance Panda Limited · You are receiving this because you created an EasyTax account.<br>
        <a href="${optOut}" style="color:#9A8F83;text-decoration:underline">Unsubscribe</a>
      </p>
    </td></tr>
  </table>
</body></html>`;

  return {
    subject: subjectFor(recipient.segment),
    html,
    text: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    unsubscribe: optOut,
    unsubscribeApi: optOutApi,
  };
}

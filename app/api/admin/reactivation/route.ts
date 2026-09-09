import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { EVENTS, trackAsync } from '@/lib/analytics';
import {
  planCampaign,
  renderEmail,
  type Recipient,
  type Segment,
} from '@/lib/reactivation';

// The reactivation campaign: 45 accounts, 15 of them HMRC-connected, 0 filings,
// and not one marketing email ever sent to any of them.
//
//   GET  /api/admin/reactivation?key=<AGENT_METRICS_KEY>
//        The dry run. Who would receive what, and a rendered sample of each
//        email. Sends nothing. Safe to call as often as you like.
//
//   POST /api/admin/reactivation?key=<AGENT_METRICS_KEY>
//        { "confirm": "SEND-<segment>-<eligible count>", "segment": "..." }
//        Sends. See below.
//
// Why the confirmation string rather than a plain flag. Sending is irreversible
// and lands in forty-five real inboxes, and the person who has to be able to
// account for it under PECR reg. 22 is the owner, not an automated run. A
// boolean is something a script can set; a token that has to contain the
// segment name and the exact number of people currently eligible is something
// you can only produce by reading the dry run first — and it stops being valid
// the moment that number changes underneath you.
//
// Nothing in this repository calls the POST. No cron references it. The daily
// agent that wrote this endpoint did not send the campaign and must not.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const FROM = 'EasyTax <hello@easytax.vip>';

function unauthorised(req: NextRequest): NextResponse | null {
  const expected = process.env.AGENT_METRICS_KEY;
  if (!expected) {
    return NextResponse.json({ error: 'AGENT_METRICS_KEY is not configured.' }, { status: 503 });
  }
  if (req.nextUrl.searchParams.get('key') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/** Addresses are the one thing in this payload that is PII, so the dry run
 *  shows enough to recognise a row and not enough to be a mailing list. */
function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  const head = user.slice(0, 2);
  return `${head}${'*'.repeat(Math.max(1, user.length - 2))}@${domain}`;
}

export async function GET(req: NextRequest) {
  const denied = unauthorised(req);
  if (denied) return denied;

  let plan: Awaited<ReturnType<typeof planCampaign>>;
  try {
    plan = await planCampaign();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 503 },
    );
  }

  const base = `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  return NextResponse.json({
    ok: true,
    dry_run: true,
    sent: 0,
    note:
      'Nothing was sent. This endpoint never sends on GET. To send one segment, ' +
      'POST with the confirm token shown against it — which encodes the eligible ' +
      'count, so it stops matching if the list changes.',
    resend_configured: Boolean(process.env.RESEND_API_KEY),
    audience: plan.totals,
    warnings: plan.warnings,
    segments: plan.plans.map(p => {
      const sample = p.eligible[0]
        ? renderEmail(p.eligible[0], base)
        : null;
      return {
        segment: p.segment,
        campaign: p.campaign,
        subject: p.subject,
        eligible: p.eligible.length,
        suppressed: p.suppressed,
        confirm_token: `SEND-${p.segment}-${p.eligible.length}`,
        recipients: p.eligible.map(r => ({
          email: maskEmail(r.email),
          signed_up: r.signedUpAt.slice(0, 10),
        })),
        // The rendered article as the first eligible recipient would receive
        // it, unsubscribe link included. Read this before sending anything.
        sample_html: sample?.html ?? null,
        sample_unsubscribe: sample?.unsubscribe ?? null,
      };
    }),
  });
}

/** One send, with the log row written first.
 *
 *  Insert-then-send, not send-then-insert: a duplicate-key error means someone
 *  else already has this address for this campaign, and the cost of stopping on
 *  a false positive is one missed email, against the cost of a double send —
 *  which is the one mistake a reactivation campaign cannot take back. */
async function sendOne(
  resend: Resend,
  recipient: Recipient,
  campaign: string,
  base: string,
): Promise<{ email: string; ok: boolean; reason?: string }> {
  const { error: claimError } = await supabase
    .from('email_sends')
    .insert({ email: recipient.email, campaign, status: 'sent' });

  if (claimError) {
    // 23505 = unique violation, i.e. already claimed.
    return {
      email: recipient.email,
      ok: false,
      reason: claimError.code === '23505' ? 'already_sent' : claimError.message,
    };
  }

  const mail = renderEmail(recipient, base);
  try {
    await resend.emails.send({
      from: FROM,
      to: recipient.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      headers: {
        // Mailbox providers surface this as a one-click unsubscribe button.
        'List-Unsubscribe': `<${mail.unsubscribeApi}>, <mailto:hello@easytax.vip?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    return { email: recipient.email, ok: true };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    // Record the failure against the claim so it can be retried deliberately
    // rather than silently re-sent by the next run.
    await supabase
      .from('email_sends')
      .update({ status: 'failed', error: reason.slice(0, 500) })
      .eq('email', recipient.email)
      .eq('campaign', campaign);
    return { email: recipient.email, ok: false, reason };
  }
}

export async function POST(req: NextRequest) {
  const denied = unauthorised(req);
  if (denied) return denied;

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not configured.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const segment = b.segment as Segment;
  const confirm = typeof b.confirm === 'string' ? b.confirm : '';

  if (segment !== 'connected_never_filed' && segment !== 'never_connected') {
    return NextResponse.json(
      { error: 'segment must be "connected_never_filed" or "never_connected".' },
      { status: 400 },
    );
  }

  let plan: Awaited<ReturnType<typeof planCampaign>>;
  try {
    plan = await planCampaign();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 503 },
    );
  }

  const target = plan.plans.find(p => p.segment === segment);
  if (!target) {
    return NextResponse.json({ error: 'Unknown segment.' }, { status: 400 });
  }

  const expectedToken = `SEND-${segment}-${target.eligible.length}`;
  if (confirm !== expectedToken) {
    return NextResponse.json(
      {
        error:
          'Confirmation token does not match the current eligible list. Nothing was sent. ' +
          'Run the GET dry run, read who would receive this, and use the token it returns.',
        expected: expectedToken,
        received: confirm || null,
        eligible: target.eligible.length,
      },
      { status: 409 },
    );
  }

  if (target.eligible.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, note: 'Nobody is eligible.' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const base = 'https://easytax.vip';
  const results = [];
  for (const recipient of target.eligible) {
    results.push(await sendOne(resend, recipient, target.campaign, base));
  }

  const sent = results.filter(r => r.ok).length;
  trackAsync({
    name: EVENTS.reactivationSent,
    props: { segment, campaign: target.campaign, sent, attempted: results.length },
  });

  return NextResponse.json({
    ok: true,
    segment,
    campaign: target.campaign,
    attempted: results.length,
    sent,
    failed: results.filter(r => !r.ok).map(r => ({ email: maskEmail(r.email), reason: r.reason })),
  });
}

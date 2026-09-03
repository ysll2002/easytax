import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// POST /api/waitlist — "notify me when live HMRC filing opens / lock in the
// founder price". This is the pre-revenue pipeline: everyone on this list is a
// warm lead to email the day HMRC production approval lands.
//
// Storage: Supabase table `launch_waitlist` (see docs/agent/2026-09-03-daily-plan.md
// for the CREATE TABLE). If the table doesn't exist yet the lead is still
// captured by emailing the owner, so nothing is lost while the migration is
// pending.

export const runtime = 'nodejs';

const OWNER = 'lilin.gabriel@gmail.com';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SOURCES = new Set(['pricing', 'dashboard', 'mtd-checker', 'homepage', 'other']);

export async function POST(req: NextRequest) {
  let body: { email?: unknown; source?: unknown; name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const source = typeof body.source === 'string' && SOURCES.has(body.source) ? body.source : 'other';
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : null;

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Please enter a valid email address.', code: 'invalid_email' }, { status: 400 });
  }

  const session = await auth().catch(() => null);
  const userId = session?.user?.profileId ?? null;

  let stored: 'db' | 'email' = 'db';
  let alreadyOnList = false;

  const { error } = await supabase
    .from('launch_waitlist')
    .upsert({ email, source, name, user_id: userId }, { onConflict: 'email', ignoreDuplicates: true });

  if (error) {
    // Most likely the table hasn't been created yet. Don't drop the lead.
    console.error('[waitlist] insert failed, falling back to owner email', { code: error.code, message: error.message });
    stored = 'email';
    try {
      await getResend().emails.send({
        from: 'EasyTax <hello@easytax.vip>',
        to: OWNER,
        subject: `Launch-list signup (DB fallback) · ${email}`,
        text: `New launch-list signup that could NOT be written to launch_waitlist (${error.code ?? 'unknown'}: ${error.message}).\n\nEmail: ${email}\nName: ${name ?? '-'}\nSource: ${source}\nUser ID: ${userId ?? '-'}\n\nCreate the table (see docs/agent/2026-09-03-daily-plan.md) to stop these fallbacks.`,
      });
    } catch (e) {
      console.error('[waitlist] owner fallback email failed', e);
      return NextResponse.json({ error: 'Could not save your email right now. Please try again.', code: 'store_failed' }, { status: 500 });
    }
  } else {
    // ignoreDuplicates means a second signup is a silent no-op; check so the UI
    // can say "you're already on the list" rather than pretending it's new.
    const { data } = await supabase.from('launch_waitlist').select('created_at').eq('email', email).maybeSingle();
    if (data?.created_at && Date.now() - new Date(data.created_at).getTime() > 60_000) alreadyOnList = true;
  }

  if (!alreadyOnList) {
    sendConfirmation(email, name).catch(err => console.error('[waitlist] confirmation email failed', err));
  }

  return NextResponse.json({ ok: true, stored, already_on_list: alreadyOnList });
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

async function sendConfirmation(to: string, name: string | null) {
  const firstName = name ? name.split(' ')[0] : null;
  await getResend().emails.send({
    from: 'EasyTax <hello@easytax.vip>',
    to,
    subject: "You're on the EasyTax launch list — founder price locked",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0EBE1;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EBE1;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FDFCF8;border-radius:16px;border:1px solid #DDD5C8;overflow:hidden;max-width:100%">
        <tr>
          <td style="background:#1C1208;padding:28px 40px">
            <p style="margin:0;font-size:22px;font-weight:700;color:#C4622D;font-family:Georgia,serif">EasyTax</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1C1208;font-family:Georgia,serif">
              ${firstName ? `Thanks, ${firstName}.` : "You're on the list."}
            </p>
            <p style="margin:0 0 16px;font-size:15px;color:#4A4035;line-height:1.6">
              We've reserved the founder price for you: <strong>£20 + VAT (£24) per HMRC submission, for life</strong>, no subscription.
            </p>
            <p style="margin:0 0 16px;font-size:15px;color:#4A4035;line-height:1.6">
              Where things stand: EasyTax is fully built and tested against HMRC's test environment. HMRC is completing its production review of our software. The moment live filing opens, you'll get one email from us — nothing else in between.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#4A4035;line-height:1.6">
              In the meantime you can create a free account, connect your bank and let AI categorise your transactions, so you're ready to file on day one.
            </p>
            <a href="https://easytax.vip/register?ref=waitlist"
              style="display:inline-block;background:#C4622D;color:#FDFCF8;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:50px">
              Set up my free account →
            </a>
            <p style="margin:24px 0 0;font-size:12px;color:#9A8F83;line-height:1.6">
              Didn't sign up? Ignore this email and we won't contact you again.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #F0EBE1">
            <p style="margin:0;font-size:12px;color:#9A8F83">
              EasyTax · Finance Panda Limited · <a href="https://easytax.vip" style="color:#9A8F83">easytax.vip</a>
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

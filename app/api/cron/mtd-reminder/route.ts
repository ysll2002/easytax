import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { Resend } from 'resend';

// MTD ITSA quarterly deadlines: 5 Aug, 5 Nov, 5 Feb, 5 May
// This cron fires 14 days before each deadline.

const MTD_DEADLINES: Record<string, { quarter: string; deadline: string }> = {
  '7-22': { quarter: 'Q1 (6 Apr – 5 Jul)', deadline: '5 August' },
  '10-22': { quarter: 'Q2 (6 Jul – 5 Oct)', deadline: '5 November' },
  '1-22': { quarter: 'Q3 (6 Oct – 5 Jan)', deadline: '5 February' },
  '4-21': { quarter: 'Q4 (6 Jan – 5 Apr)', deadline: '5 May' },
};

function todayDeadlineKey(): string | null {
  const now = new Date();
  const key = `${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
  return MTD_DEADLINES[key] ? key : null;
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = todayDeadlineKey();
  if (!key) {
    return NextResponse.json({ skipped: true, reason: 'Not a reminder day' });
  }

  const { quarter, deadline } = MTD_DEADLINES[key];

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('email, name')
    .not('email', 'is', null);

  if (error || !profiles) {
    console.error('[mtd-reminder] failed to fetch profiles', error);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;

  for (const profile of profiles) {
    if (!profile.email) continue;
    const firstName = (profile.name ?? profile.email).split(' ')[0];

    await resend.emails.send({
      from: 'EasyTax <hello@easytax.vip>',
      to: profile.email,
      subject: `Reminder: MTD ITSA ${quarter} update due ${deadline}`,
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
              Hi ${firstName}, your MTD update is due in 14 days.
            </p>
            <p style="margin:0 0 8px;font-size:15px;color:#4A4035;line-height:1.6">
              Your <strong>${quarter}</strong> MTD ITSA quarterly update must be submitted to HMRC by <strong>${deadline}</strong>.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#9A8F83;line-height:1.6">
              It takes less than 5 minutes in EasyTax — your bank transactions are already imported and categorised.
            </p>
            <a href="https://easytax.vip/dashboard/individual"
              style="display:inline-block;background:#C4622D;color:#FDFCF8;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:50px">
              File quarterly update →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #F0EBE1">
            <p style="margin:0;font-size:12px;color:#9A8F83">
              EasyTax · Self Assessment, Sorted. · <a href="https://easytax.vip" style="color:#9A8F83">easytax.vip</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }).catch(() => {});
    sent++;
  }

  return NextResponse.json({ ok: true, quarter, deadline, sent });
}

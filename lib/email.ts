import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(to: string, name: string) {
  const firstName = name.split(' ')[0];

  await resend.emails.send({
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

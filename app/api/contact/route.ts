import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json();

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  try {
    await resend.emails.send({
      from: 'EasyTax <hello@easytax.vip>',
      to: 'lilin.gabriel@gmail.com',
      replyTo: email,
      subject: `New message from ${name} · EasyTax`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
          <div style="background:#1C1208;padding:20px 28px;border-radius:12px 12px 0 0">
            <p style="margin:0;color:#C4622D;font-size:18px;font-weight:700;font-family:Georgia,serif">EasyTax</p>
            <p style="margin:4px 0 0;color:#9A8F83;font-size:13px">New contact message</p>
          </div>
          <div style="background:#FDFCF8;padding:28px;border:1px solid #E8E2DA;border-top:none;border-radius:0 0 12px 12px">
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
              <tr><td style="padding:8px 0;color:#9A8F83;width:80px">Name</td><td style="padding:8px 0;color:#1C1208;font-weight:600">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#9A8F83">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#C4622D">${email}</a></td></tr>
            </table>
            <div style="background:#F0EBE1;border-radius:8px;padding:16px;font-size:14px;color:#1C1208;line-height:1.7;white-space:pre-wrap">${message}</div>
            <p style="margin:20px 0 0;font-size:12px;color:#9A8F83">Reply directly to this email to respond to ${name}.</p>
          </div>
        </div>
      `,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

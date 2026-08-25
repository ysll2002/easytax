import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { sendPasswordResetEmail } from '@/lib/email';

const key = () => new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, password_hash')
    .eq('email', email.toLowerCase().trim())
    .single();

  // Always return 200 to avoid email enumeration
  if (!profile || !profile.password_hash) {
    return NextResponse.json({ ok: true });
  }

  const token = await new SignJWT({ email: email.toLowerCase().trim(), purpose: 'password-reset' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key());

  const resetUrl = `${process.env.NEXTAUTH_URL ?? 'https://easytax.vip'}/reset-password?token=${token}`;

  sendPasswordResetEmail(email.toLowerCase().trim(), resetUrl).catch(() => {});

  return NextResponse.json({ ok: true });
}

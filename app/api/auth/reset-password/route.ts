import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

const key = () => new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: 'Token and password are required.' }, { status: 400 });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  let email: string;
  try {
    const { payload } = await jwtVerify(token, key());
    if (payload.purpose !== 'password-reset' || typeof payload.email !== 'string') {
      throw new Error('invalid token');
    }
    email = payload.email;
  } catch {
    return NextResponse.json({ error: 'This link is invalid or has expired. Please request a new one.' }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { error } = await supabase
    .from('profiles')
    .update({ password_hash })
    .eq('email', email);

  if (error) {
    return NextResponse.json({ error: 'Failed to update password. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required', code: 'missing_fields' }, { status: 400 });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters', code: 'pwd_too_short' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'This email is already registered. Try logging in instead.', code: 'email_exists' }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 12);
  const finalName = (typeof name === 'string' && name.trim()) || email.split('@')[0];

  const { error } = await supabase.from('profiles').insert({ name: finalName, email, password_hash });

  if (error) {
    console.error('[register] supabase insert failed', { code: error.code, message: error.message });
    return NextResponse.json({ error: 'Registration failed. Please try again.', code: error.code || 'db_error' }, { status: 500 });
  }

  sendWelcomeEmail(email, finalName).catch(() => {}); // non-blocking

  return NextResponse.json({ ok: true });
}

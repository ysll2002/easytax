import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { error } = await supabase.from('profiles').insert({ name, email, password_hash });

  if (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }

  sendWelcomeEmail(email, name).catch(() => {}); // non-blocking

  return NextResponse.json({ ok: true });
}

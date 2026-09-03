import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { sendWelcomeEmail } from '@/lib/email';
import { trackAsync, EVENTS } from '@/lib/analytics';

export async function POST(req: NextRequest) {
  // anonId is optional — it lets a completed registration be stitched back to
  // the anonymous page views that preceded it.
  const { name, email, password, anonId } = await req.json();

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

  const { data: created, error } = await supabase
    .from('profiles')
    .insert({ name: finalName, email, password_hash })
    .select('id')
    .single();

  if (error) {
    console.error('[register] supabase insert failed', { code: error.code, message: error.message });
    return NextResponse.json({ error: 'Registration failed. Please try again.', code: error.code || 'db_error' }, { status: 500 });
  }

  sendWelcomeEmail(email, finalName).catch(() => {}); // non-blocking

  // Recorded server-side rather than from the browser: this is the conversion
  // event the whole funnel is measured against, and a client beacon would be
  // lost to ad-blockers on a meaningful share of visitors.
  trackAsync({
    name:   EVENTS.registerCompleted,
    userId: created?.id ?? null,
    anonId: typeof anonId === 'string' ? anonId.slice(0, 64) : null,
    path:   '/register',
    props:  { method: 'password' },
  });

  return NextResponse.json({ ok: true });
}

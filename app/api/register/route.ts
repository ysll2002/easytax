import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { sendWelcomeEmail } from '@/lib/email';
import { track, trackAsync, EVENTS } from '@/lib/analytics';
import { asAccountType } from '@/lib/account-type';

// Every refusal is recorded server-side with its code (register_failed), so a
// visitor who tries five times and gives up shows up in our own numbers with
// the reason. The browser's GA event carries the reason too, but GA drops
// event parameters that are not registered as custom dimensions, and Vercel's
// logs are gone within a day. No email address goes into the event.
async function refuse(
  code: string, status: number, error: string,
  ctx: { accountType?: string; anonId?: unknown },
) {
  await track({
    name:   EVENTS.registerFailed,
    anonId: typeof ctx.anonId === 'string' ? ctx.anonId.slice(0, 64) : null,
    path:   ctx.accountType === 'agent' ? '/agent/register' : '/register',
    props:  { method: 'password', code, status, accountType: ctx.accountType ?? null },
  });
  return NextResponse.json({ error, code }, { status });
}

export async function POST(req: NextRequest) {
  let input: Record<string, unknown>;
  try {
    input = await req.json();
  } catch {
    input = null as never;
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return refuse('bad_request', 400, 'Registration failed. Please try again.', {});
  }
  try {
    return await register(input);
  } catch (err) {
    // An unexpected throw used to surface as a bare 500 with no code.
    console.error('[register] unexpected error', err instanceof Error ? err.message : err);
    return refuse('server_error', 500, 'Registration failed. Please try again.', {
      accountType: asAccountType(input.accountType), anonId: input.anonId,
    });
  }
}

async function register(input: Record<string, unknown>) {
  // anonId is optional — it lets a completed registration be stitched back to
  // the anonymous page views that preceded it.
  const { name, email, password, anonId, accountType: rawType, firmName: rawFirm } = input as {
    name?: unknown; email?: unknown; password?: unknown; anonId?: unknown; accountType?: unknown; firmName?: unknown;
  };
  // Fixed at sign-up: /register makes an individual account, /agent/register an agent one.
  const accountType = asAccountType(rawType);
  const ctx = { accountType, anonId };
  // Agents give the name of their accounting firm.
  const firmName = typeof rawFirm === 'string' ? rawFirm.trim().replace(/\s+/g, ' ') : '';
  if (accountType === 'agent' && (firmName.length < 2 || firmName.length > 120)) {
    return refuse('missing_firm_name', 400, 'Enter your accounting firm\'s name.', ctx);
  }

  if (typeof email !== 'string' || !email.trim() || !password) {
    return refuse('missing_fields', 400, 'Email and password are required', ctx);
  }
  if (typeof password !== 'string' || password.length < 8) {
    return refuse('pwd_too_short', 400, 'Password must be at least 8 characters', ctx);
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    return refuse('email_exists', 409, 'This email is already registered. Try logging in instead.', ctx);
  }

  const password_hash = await bcrypt.hash(password, 12);
  const finalName = (typeof name === 'string' && name.trim()) || email.split('@')[0];

  const { data: created, error } = await supabase
    .from('profiles')
    .insert({ name: finalName, email, password_hash, account_type: accountType, firm_name: accountType === 'agent' ? firmName : null })
    .select('id')
    .single();

  if (error) {
    console.error('[register] supabase insert failed', { code: error.code, message: error.message });
    return refuse(error.code || 'db_error', 500, 'Registration failed. Please try again.', ctx);
  }

  sendWelcomeEmail(email, finalName).catch(() => {}); // non-blocking

  // Recorded server-side rather than from the browser: this is the conversion
  // event the whole funnel is measured against, and a client beacon would be
  // lost to ad-blockers on a meaningful share of visitors.
  trackAsync({
    name:   EVENTS.registerCompleted,
    userId: created?.id ?? null,
    anonId: typeof anonId === 'string' ? anonId.slice(0, 64) : null,
    path:   accountType === 'agent' ? '/agent/register' : '/register',
    props:  { method: 'password', accountType },
  });

  return NextResponse.json({ ok: true });
}

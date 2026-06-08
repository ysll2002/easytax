import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('hmrc_connections')
    .select('nino')
    .eq('user_id', session.user.profileId)
    .single();

  return NextResponse.json({
    nino: data?.nino ?? '',
    user: session.user,
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { nino } = await req.json();

  const { error } = await supabase
    .from('hmrc_connections')
    .upsert(
      { user_id: session.user.profileId, nino: nino || null },
      { onConflict: 'user_id' },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

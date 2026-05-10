import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('hmrc_connections')
    .select('nino, utr')
    .eq('user_id', session.user.profileId)
    .single();

  return NextResponse.json({
    nino: data?.nino ?? '',
    utr:  data?.utr  ?? '',
    user: session.user,
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { nino, utr } = await req.json();

  const { error } = await supabase
    .from('hmrc_connections')
    .upsert(
      { user_id: session.user.profileId, nino: nino || null, utr: utr || null },
      { onConflict: 'user_id' },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

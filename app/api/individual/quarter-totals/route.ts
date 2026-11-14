import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { summarise, ISO_DATE } from '@/lib/records';

// Compliant with HMRC MTD-ITSA production checklist In-Year #6:
//   "Quarterly submission data is populated from the customer's digital record
//    and no manual keying is permitted in the submission itself."
//
// Digital record here = the customer's business records (entered by hand or
// imported from a CSV bank statement on the Records page). Only records the
// customer has marked as business income or expense are counted; each
// expense is counted in the HMRC category chosen on the Records page.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.profileId) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end   = searchParams.get('end');
  if (!start || !end || !ISO_DATE.test(start) || !ISO_DATE.test(end)) {
    return NextResponse.json({ error: 'missing_period' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('business_records')
    .select('description, amount, category, expense_bucket')
    .eq('user_id', session.user.profileId)
    .gte('txn_date', start)
    .lte('txn_date', end);
  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 });

  const records = data ?? [];
  if (records.length === 0) {
    return NextResponse.json({
      error: 'no_records',
      detail: 'There are no records for this period yet. Add or import your income and expenses on the Records page first.',
    }, { status: 404 });
  }

  const { turnover, expenses, unreviewed } = summarise(records);
  return NextResponse.json({
    period:   { start, end },
    turnover,
    expenses,
    unreviewed,
    source:   'business_records',
    notice:   'These figures are added up from your business records for the period. To change them, edit or re-categorise records on the Records page.',
  });
}

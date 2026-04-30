import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default async function TaxPage() {
  const session = await auth();
  const profileId = session!.user.profileId;

  const [{ data: hmrc }, { data: bank }] = await Promise.all([
    supabase.from('hmrc_connections').select('utr, nino, connected_at').eq('user_id', profileId).single(),
    supabase.from('bank_connections').select('account_name, connected_at').eq('user_id', profileId).single(),
  ]);

  const steps = [
    {
      n: '01',
      title: 'Connect HMRC',
      desc: hmrc
        ? `Connected · UTR ${hmrc.utr ?? '—'}`
        : 'Link your HMRC Government Gateway account to fetch your tax obligations.',
      done: !!hmrc,
      href: '/dashboard/tax/hmrc',
      cta: hmrc ? 'Reconnect' : 'Connect HMRC →',
    },
    {
      n: '02',
      title: 'Connect Bank Account',
      desc: bank
        ? `Connected · ${bank.account_name}`
        : 'Link your business bank via Open Banking to import transactions.',
      done: !!bank,
      href: '/dashboard/tax/banking',
      cta: bank ? 'Manage' : 'Connect Bank →',
    },
    {
      n: '03',
      title: 'Review & File',
      desc: 'Review your tax obligations, confirm expenses, and submit your Self Assessment.',
      done: false,
      href: hmrc && bank ? '/dashboard/tax/tasks' : '#',
      cta: 'View Tasks →',
      disabled: !hmrc || !bank,
    },
  ];

  return (
    <div className="p-8 max-w-2xl">
      <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
        Tax Filing
      </h1>
      <p style={{ color: '#9A8F83', marginBottom: '2.5rem' }}>Complete the steps below to file your Self Assessment.</p>

      <div className="space-y-4">
        {steps.map(step => (
          <div key={step.n} className="p-6 rounded-2xl" style={{ backgroundColor: step.done ? '#F0EBE1' : '#FDFCF8', border: `1px solid ${step.done ? '#C4622D40' : '#DDD5C8'}`, borderLeft: `4px solid ${step.done ? '#C4622D' : '#DDD5C8'}` }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4 items-start">
                <span style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: step.done ? '#C4622D' : '#DDD5C8', lineHeight: 1, flexShrink: 0 }}>{step.n}</span>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#1C1208' }}>{step.title}</p>
                  <p className="text-sm" style={{ color: '#9A8F83', lineHeight: 1.5 }}>{step.desc}</p>
                </div>
              </div>
              {!step.disabled && (
                <Link href={step.href} className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium"
                  style={{ backgroundColor: step.done ? '#F5E4D8' : '#1C1208', color: step.done ? '#C4622D' : '#FDFCF8' }}>
                  {step.cta}
                </Link>
              )}
              {step.disabled && (
                <span className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium" style={{ backgroundColor: '#F0EBE1', color: '#9A8F83' }}>
                  Complete steps above first
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

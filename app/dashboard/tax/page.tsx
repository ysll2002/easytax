import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import NinoForm from '@/components/NinoForm';
import { CheckCircle2, ChevronRight, History, Edit2 } from 'lucide-react';

export default async function TaxPage() {
  const session   = await auth();
  const profileId = session!.user.profileId;

  const [{ data: hmrc }, { data: bank }] = await Promise.all([
    supabase.from('hmrc_connections').select('nino, utr, vrn, access_token, connected_at').eq('user_id', profileId).single(),
    supabase.from('bank_connections').select('account_name, connected_at').eq('user_id', profileId).single(),
  ]);

  const hasNino  = !!hmrc?.nino;
  const hasHmrc  = !!hmrc?.access_token;
  const hasSA    = hasNino && hasHmrc;

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
        Self Assessment
      </h1>
      <p style={{ color: '#9A8F83', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
        Complete the steps below to file your Self Assessment with HMRC.
      </p>

      <div className="space-y-4">

        {/* Step 1: NINO */}
        <Step n={1} title="National Insurance Number" done={hasNino}>
          <NinoForm initialNino={hmrc?.nino ?? ''} />
        </Step>

        {/* Step 2: Connect HMRC */}
        <Step n={2} title="Connect HMRC" done={hasHmrc} locked={!hasNino}>
          {hasHmrc ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} color="#6B8E6E" />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1C1208' }}>HMRC connected</p>
                  <p className="text-xs" style={{ color: '#9A8F83' }}>
                    {hmrc?.utr ? `UTR: ${hmrc.utr}` : 'Government Gateway authorised'}
                    {hmrc?.connected_at ? ` · Connected ${new Date(hmrc.connected_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                  </p>
                </div>
              </div>
              <Link href="/dashboard/tax/hmrc"
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-semibold"
                style={{ border: '1px solid #1C1208', color: '#1C1208', textDecoration: 'none', backgroundColor: 'transparent' }}>
                <Edit2 size={12} /> Reconnect
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-sm mb-3" style={{ color: '#4A4035' }}>
                Link your Government Gateway account so EasyTax can fetch your tax obligations and submit returns on your behalf.
              </p>
              <Link href="/dashboard/tax/hmrc"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold"
                style={{ backgroundColor: '#1C1208', color: '#FDFCF8', textDecoration: 'none' }}>
                Connect HMRC <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </Step>

        {/* Step 3: Self Assessment */}
        <Step n={3} title="Self Assessment" done={false} locked={!hasSA}>
          {hasSA ? (
            <div className="space-y-3">
              <ActionLink
                href="/dashboard/tax/tasks"
                label="Quarterly Updates & Filing"
                desc="Submit quarterly income & expense updates and complete your annual declaration"
                primary
              />
              <ActionLink
                href="/dashboard/tax/banking"
                label="Connect Bank Account"
                desc={bank ? `Connected · ${bank.account_name}` : 'Import transactions via Open Banking'}
                done={!!bank}
              />
              {hmrc?.vrn && (
                <ActionLink
                  href="/dashboard/tax/vat"
                  label="VAT Return"
                  desc={`VRN: ${hmrc.vrn} · File quarterly VAT returns via Making Tax Digital`}
                />
              )}
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#9A8F83' }}>
              Complete Steps 1 and 2 to unlock Self Assessment filing.
            </p>
          )}
        </Step>

      </div>

      {hasSA && (
        <div className="mt-8 pt-6 flex items-center gap-2" style={{ borderTop: '1px solid #E8E2DA' }}>
          <History size={14} color="#9A8F83" />
          <Link href="/dashboard/tax/history" style={{ color: '#9A8F83', textDecoration: 'none', fontSize: '0.875rem' }}>
            View filing history
          </Link>
        </div>
      )}
    </div>
  );
}

function Step({ n, title, done, locked, children }: {
  n: number; title: string; done: boolean; locked?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{
      border: `1.5px solid ${done ? '#6B8E6E40' : locked ? '#E8E2DA' : '#DDD5C8'}`,
      opacity: locked ? 0.4 : 1,
    }}>
      <div className="flex items-center gap-3 px-5 py-3.5" style={{
        backgroundColor: done ? '#F0F5F0' : locked ? '#FAFAF8' : '#F8F7F5',
        borderBottom: `1px solid ${done ? '#6B8E6E20' : '#E8E2DA'}`,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
          backgroundColor: done ? '#6B8E6E' : locked ? '#E8E2DA' : '#1C1208',
          color: locked && !done ? '#9A8F83' : '#FDFCF8',
        }}>
          {done ? '✓' : n}
        </div>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: done ? '#6B8E6E' : '#1C1208' }}>{title}</span>
        {locked && <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#E8E2DA', color: '#9A8F83' }}>Locked</span>}
      </div>
      <div className="px-5 py-4" style={{ backgroundColor: '#FFFFFF' }}>{children}</div>
    </div>
  );
}

function ActionLink({ href, label, desc, primary, done }: {
  href: string; label: string; desc: string; primary?: boolean; done?: boolean;
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="flex items-center justify-between p-4 rounded-xl" style={{
        backgroundColor: primary ? '#1C1208' : '#FAFAF8',
        border: `1px solid ${primary ? 'transparent' : '#E8E2DA'}`,
      }}>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold" style={{ color: primary ? '#FDFCF8' : '#1C1208' }}>{label}</p>
            {done && <CheckCircle2 size={14} color="#6B8E6E" />}
          </div>
          <p className="text-xs mt-0.5" style={{ color: primary ? '#9A8F83' : '#9A8F83' }}>{desc}</p>
        </div>
        <ChevronRight size={16} color={primary ? '#9A8F83' : '#C4622D'} />
      </div>
    </Link>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import { verifyUnsubscribeToken } from '@/lib/unsubscribe';
import { optOut } from '@/lib/email-optout';

// Confirmation page for the unsubscribe link in reminder emails.
//
// The opt-out happens here on load rather than behind a "confirm" button: the
// ICO's position is that opting out must not require extra steps, and a
// recipient who clicked "unsubscribe" has already told us what they want.

export const metadata: Metadata = {
  title: 'Unsubscribe',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; t?: string }>;
}) {
  const { e, t } = await searchParams;
  const email = (e ?? '').trim().toLowerCase();
  const token = (t ?? '').trim();

  const valid = verifyUnsubscribeToken(email, token);
  const result = valid ? await optOut(email) : { ok: false, reason: 'invalid' as const };

  return (
    <div style={{ backgroundColor: '#F0EBE1', minHeight: '100vh' }}>
      <SiteHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div
          className="rounded-2xl p-6 sm:p-10"
          style={{ backgroundColor: '#FDFCF8', border: '1px solid #DDD5C8' }}
        >
          {result.ok ? (
            <>
              <CheckCircle2 size={32} style={{ color: '#3F7D5C' }} />
              <h1
                className="mt-4 mb-3"
                style={{
                  fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  fontWeight: 700,
                  color: '#1C1208',
                }}
              >
                You&apos;re unsubscribed
              </h1>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#4A4035' }}>
                We&apos;ve stopped sending deadline reminders to{' '}
                <strong style={{ color: '#1C1208' }}>{email}</strong>. You won&apos;t get any
                further marketing email from us.
              </p>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: '#9A8F83' }}>
                If you still have an EasyTax account, you&apos;ll continue to receive essential
                service messages — password resets and submission receipts — because those
                aren&apos;t marketing and we can&apos;t run your account without them.
              </p>
            </>
          ) : (
            <>
              <AlertCircle size={32} style={{ color: '#C4622D' }} />
              <h1
                className="mt-4 mb-3"
                style={{
                  fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  fontWeight: 700,
                  color: '#1C1208',
                }}
              >
                We couldn&apos;t action that link
              </h1>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#4A4035' }}>
                {result.reason === 'invalid'
                  ? 'That unsubscribe link is incomplete or has been altered. Please use the link exactly as it appears in the email.'
                  : 'Something went wrong on our side. Your request has not been recorded yet.'}
              </p>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: '#4A4035' }}>
                Email{' '}
                <a
                  href="mailto:hello@easytax.vip?subject=Unsubscribe"
                  style={{ color: '#C4622D', textDecoration: 'underline' }}
                >
                  hello@easytax.vip
                </a>{' '}
                and we will remove you by hand within one working day.
              </p>
            </>
          )}

          <Link
            href="/"
            className="inline-block mt-8 px-6 py-3 rounded-full text-sm font-medium"
            style={{ backgroundColor: '#1C1208', color: '#FDFCF8' }}
          >
            Back to EasyTax
          </Link>
        </div>
      </main>
    </div>
  );
}

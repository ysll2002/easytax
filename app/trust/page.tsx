import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import NotifyMeForm from '@/components/NotifyMeForm';
import TrackEvent from '@/components/TrackEvent';
import { ShieldCheck, Lock, Landmark, Eye, CreditCard, Building2, XCircle, CheckCircle2 } from 'lucide-react';

// Trust page.
//
// The product asks a stranger for a National Insurance number and read access
// to their bank before it has filed anything for anyone. Nothing on the site
// currently answers "who are you and why should I hand you this?", and that
// question is answered somewhere — either here, or by the visitor leaving.
//
// The tone is deliberately plain about what is *not* done yet. HMRC production
// approval is still pending, and a page that implied otherwise would be both
// dishonest and a compliance problem during an active HMRC review.

export const metadata: Metadata = {
  title: 'Security & Trust',
  description:
    'How EasyTax handles your tax data: what we store, what we can and cannot do with your bank connection, who runs the company, and exactly where we are in HMRC approval.',
  alternates: { canonical: 'https://easytax.vip/trust' },
};

const display = 'var(--font-display), Playfair Display, Georgia, serif';

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof ShieldCheck;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="p-5 sm:p-6 rounded-2xl h-full"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2DA' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: '#F0EBE1' }}
      >
        <Icon size={19} color="#C4622D" strokeWidth={1.9} />
      </div>
      <p className="font-semibold mb-1.5" style={{ color: '#1C1208', fontSize: '0.98rem' }}>
        {title}
      </p>
      <p className="text-sm" style={{ color: '#4A4035', lineHeight: 1.6 }}>
        {children}
      </p>
    </div>
  );
}

export default function TrustPage() {
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: '#FDFCF8', color: '#1C1208', fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}
    >
      <TrackEvent name="trust_viewed" />
      <SiteHeader />

      <main className="flex-grow">
        {/* ── Hero ── */}
        <section className="pt-12 sm:pt-16 pb-10 sm:pb-14">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{ backgroundColor: '#F0EBE1', color: '#C4622D', border: '1px solid #C4622D30' }}
            >
              <ShieldCheck size={13} /> Security &amp; Trust
            </div>
            <h1
              style={{
                fontFamily: display,
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                fontWeight: 700,
                lineHeight: 1.15,
                marginBottom: '1rem',
              }}
            >
              We&apos;re asking for your tax data.<br />
              <em style={{ color: '#C4622D', fontStyle: 'italic' }}>Here&apos;s what happens to it.</em>
            </h1>
            <p style={{ color: '#9A8F83', fontSize: '1.05rem', lineHeight: 1.65 }}>
              EasyTax connects to HMRC and, optionally, to your bank. That is a lot to ask of a
              company you have not heard of. This page sets out exactly what we store, what we
              cannot do, who we are, and where we currently stand with HMRC — including the parts
              that are not finished.
            </p>
          </div>
        </section>

        {/* ── HMRC status: the honest bit ── */}
        <section className="pb-12 sm:pb-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div
              className="p-5 sm:p-7 rounded-2xl"
              style={{ backgroundColor: '#1C1208', border: '1px solid #2E2418' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Landmark size={18} color="#C4622D" strokeWidth={1.9} />
                <p style={{ fontFamily: display, fontSize: '1.2rem', fontWeight: 700, color: '#FDFCF8' }}>
                  Where we are with HMRC
                </p>
              </div>
              <p className="text-sm mb-4" style={{ color: '#B8ADA1', lineHeight: 1.7 }}>
                EasyTax is built directly against HMRC&apos;s Making Tax Digital APIs and is fully
                working against HMRC&apos;s sandbox environment. We are currently going through
                HMRC&apos;s production approval process, which every MTD software vendor must
                complete before it can send live submissions.
              </p>
              <div className="space-y-2.5">
                {[
                  [true,  'You can create an account, connect HMRC and set everything up today.'],
                  [true,  'Signing up is free and takes no card details.'],
                  [false, 'Live submissions to HMRC are not enabled until production approval completes.'],
                ].map(([ok, text], i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    {ok ? (
                      <CheckCircle2 size={16} color="#6B8E6E" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                    ) : (
                      <XCircle size={16} color="#C4622D" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                    )}
                    <p className="text-sm" style={{ color: '#FDFCF8', lineHeight: 1.55 }}>{text}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-4" style={{ color: '#9A8F83', lineHeight: 1.6 }}>
                We would rather tell you this up front than have you find out after handing over
                your details. Add your email below and we will write to you the day filing opens.
              </p>
            </div>
          </div>
        </section>

        {/* ── What we do with your data ── */}
        <section className="py-12 sm:py-16" style={{ backgroundColor: '#F8F5F0', borderTop: '1px solid #E8E2DA', borderBottom: '1px solid #E8E2DA' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700, marginBottom: '1.75rem' }}>
              What we do with your data
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card icon={Lock} title="Your Government Gateway password never reaches us">
                Connecting HMRC sends you to HMRC&apos;s own sign-in page. You authorise EasyTax
                there and we receive an access token — never your password.
              </Card>
              <Card icon={Eye} title="Bank access is read-only">
                Open Banking connections are made through Plaid and are read-only by design. We can
                see transactions to categorise expenses. We cannot move money, and neither can
                anyone who compromises our account.
              </Card>
              <Card icon={ShieldCheck} title="Encrypted in transit and at rest">
                Traffic runs over TLS, data is encrypted at rest, and HMRC access tokens are stored
                encrypted. Full detail is in our{' '}
                <Link href="/privacy" style={{ color: '#C4622D' }}>Privacy Policy</Link>.
              </Card>
              <Card icon={Landmark} title="Your NINO is used for one thing">
                Your National Insurance number identifies you to HMRC when we retrieve your
                obligations. It is not used for marketing and not shared with third parties.
              </Card>
              <Card icon={CreditCard} title="Nothing is filed without you">
                Every submission to HMRC is one you review and approve. EasyTax does not file on
                your behalf in the background.
              </Card>
              <Card icon={XCircle} title="You can have it deleted">
                Under UK GDPR you can ask us to erase your data where we have no legal obligation to
                keep it. Email{' '}
                <a href="mailto:privacy@easytax.vip" style={{ color: '#C4622D' }}>privacy@easytax.vip</a>.
              </Card>
            </div>
          </div>
        </section>

        {/* ── Who we are ── */}
        <section className="py-12 sm:py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={19} color="#C4622D" strokeWidth={1.9} />
              <h2 style={{ fontFamily: display, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700 }}>
                Who we are
              </h2>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E8E2DA' }}>
              {([
                { k: 'Legal entity',      v: 'Finance Panda Limited, trading as EasyTax' },
                { k: 'Registered',        v: 'England and Wales' },
                { k: 'Based',             v: 'London, United Kingdom' },
                // The reference is shown in full on purpose: it is the one
                // claim on this page a visitor can independently verify, by
                // searching the ICO's public register. Deliberately does not
                // quote the expiry date — that would silently become a lie the
                // day it lapsed, whereas the register always shows live status.
                {
                  k: 'Data protection',
                  v: (
                    <>
                      Registered data controller under UK GDPR — ICO reference{' '}
                      <strong>ZA540758</strong>. Verify it on the{' '}
                      <a
                        href="https://ico.org.uk/register/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#C4622D' }}
                      >
                        ICO public register
                      </a>
                      .
                    </>
                  ),
                },
                { k: 'Privacy questions', v: 'privacy@easytax.vip' },
                { k: 'Anything else',     v: 'hello@easytax.vip' },
              ] satisfies { k: string; v: React.ReactNode }[]).map(({ k, v }, i) => (
                <div
                  key={k}
                  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 sm:px-5 py-3.5"
                  style={{
                    backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FDFCF8',
                    borderTop: i === 0 ? 'none' : '1px solid #F0EBE1',
                  }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-wider sm:w-48 sm:flex-shrink-0"
                    style={{ color: '#9A8F83' }}
                  >
                    {k}
                  </p>
                  <p className="text-sm" style={{ color: '#1C1208' }}>{v}</p>
                </div>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: '#9A8F83', lineHeight: 1.6 }}>
              Read the full{' '}
              <Link href="/privacy" style={{ color: '#C4622D' }}>Privacy Policy</Link> and{' '}
              <Link href="/terms" style={{ color: '#C4622D' }}>Terms of Service</Link>.
            </p>
          </div>
        </section>

        {/* ── Pricing honesty ── */}
        <section className="pb-12 sm:pb-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div
              className="p-5 sm:p-7 rounded-2xl"
              style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}
            >
              <p style={{ fontFamily: display, fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                What it costs
              </p>
              <p className="text-sm mb-4" style={{ color: '#4A4035', lineHeight: 1.7 }}>
                £20 + VAT (£24 inc. VAT) per submission to HMRC. No monthly subscription, no card
                required to create an account, and no charge until you actually file something.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center text-sm font-semibold"
                style={{ color: '#C4622D', textDecoration: 'none' }}
              >
                See full pricing →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Launch list ── */}
        <section className="pb-16 sm:pb-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <NotifyMeForm
              source="trust"
              heading="Tell me when filing opens"
              blurb="We'll email you the day HMRC production approval completes and live submissions are enabled. That's the only reason we'll write — unsubscribe in one click."
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

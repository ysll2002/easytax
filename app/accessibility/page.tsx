import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';

// Accessibility statement. Follows the structure of the GOV.UK model
// accessibility statement, which is what HMRC expects software listed on
// "Find software suitable for Making Tax Digital" to link to.
//
// Keep it true. Every known issue below should match the WCAG 2.1 AA
// checklist sent to HMRC; when an issue is fixed, remove it here and update
// the "last reviewed" date. Do not claim "fully compliant" until the
// dashboard has been tested with a screen reader.

const LAST_REVIEWED = '13 November 2026';

export const metadata: Metadata = {
  title: 'Accessibility statement',
  description: 'How accessible EasyTax is, known issues, and how to contact us if you have difficulty using the service.',
  alternates: { canonical: 'https://easytax.vip/accessibility' },
};

export default function AccessibilityStatement() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FDFCF8' }}>
      <header style={{ borderBottom: '1px solid #E8E2DA', backgroundColor: '#FDFCF8' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 flex justify-between items-center">
          <Link href="/" style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#A04E1C', textDecoration: 'none' }}>
            EasyTax
          </Link>
          <Link href="/" style={{ fontSize: '0.875rem', color: '#4A4035' }}>Back to home</Link>
        </div>
      </header>

      <main id="main-content" className="flex-grow max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 w-full">
        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: 'clamp(1.9rem, 5vw, 2.5rem)', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
          Accessibility statement for EasyTax
        </h1>
        <p style={{ color: '#6B6256', fontSize: '0.875rem', marginBottom: '2.5rem' }}>
          Last reviewed: {LAST_REVIEWED}
        </p>

        <div className="space-y-10" style={{ lineHeight: 1.75 }}>
          <section>
            <P>
              This statement applies to the EasyTax website and web application at <strong>easytax.vip</strong>,
              including the dashboard used to keep digital records and send Making Tax Digital updates to HMRC.
              EasyTax is run by Finance Panda Limited.
            </P>
            <P>We want as many people as possible to be able to use EasyTax. For example, you should be able to:</P>
            <UL items={[
              'change colours, contrast levels and fonts using your browser or device settings',
              'zoom in up to 200% without the text spilling off the screen',
              'navigate the whole service using just a keyboard',
              'skip straight to the main content of each page with a "Skip to main content" link',
              'use the service with reduced motion if you have turned this on in your device settings',
            ]} />
            <P>
              We have also tried to make the text as simple as possible to understand.{' '}
              <a href="https://mcmw.abilitynet.org.uk/" rel="noopener noreferrer">AbilityNet</a> has advice on
              making your device easier to use if you have a disability.
            </P>
          </section>

          <section>
            <H2>How accessible this service is</H2>
            <P>We know some parts of this service are not fully accessible:</P>
            <UL items={[
              'we have not yet tested the dashboard with a screen reader, so some screens may be hard to use with one',
              'some charts and summary tables in the dashboard may not be fully described to screen reader users',
              'the VAT return screen shows a legal declaration but does not yet have a separate review step before you submit',
              'some pages in languages other than English are only partly translated; the screens used to send updates to HMRC are in English only',
            ]} />
          </section>

          <section>
            <H2>Feedback and contact information</H2>
            <P>
              If you need information from this service in a different format, such as large print or plain text,
              or you have difficulty using any part of it, email us at{' '}
              <a href="mailto:hello@easytax.vip">hello@easytax.vip</a>.
            </P>
            <P>We will consider your request and get back to you within 5 working days.</P>
          </section>

          <section>
            <H2>Reporting accessibility problems with this service</H2>
            <P>
              We are always looking to improve the accessibility of this service. If you find any problems not listed
              on this page, or think we are not meeting accessibility requirements, email{' '}
              <a href="mailto:hello@easytax.vip">hello@easytax.vip</a>.
            </P>
            <P>
              If you are not happy with how we respond to your complaint, you can contact the{' '}
              <a href="https://www.equalityadvisoryservice.com/" rel="noopener noreferrer">Equality Advisory and Support Service (EASS)</a>.
            </P>
          </section>

          <section>
            <H2>Services from other organisations</H2>
            <P>
              Some steps take you to services that we do not control, so we cannot fix accessibility problems on them:
              the HMRC sign-in pages used to give EasyTax permission to send updates for you, and Google sign-in.
            </P>
          </section>

          <section>
            <H2>Technical information about this service&rsquo;s accessibility</H2>
            <P>
              Finance Panda Limited is committed to making EasyTax accessible, in line with the Web Content
              Accessibility Guidelines (WCAG) version 2.1 AA standard.
            </P>

            <H3>Compliance status</H3>
            <P>
              This service is partially compliant with the{' '}
              <a href="https://www.w3.org/TR/WCAG21/" rel="noopener noreferrer">Web Content Accessibility Guidelines version 2.1</a>{' '}
              AA standard, because of the issues listed below.
            </P>

            <H3>Non-accessible content</H3>
            <UL items={[
              'Some dashboard components, such as the language menu, the mobile navigation and expandable sections, have not been tested with a screen reader to confirm that their names, roles and states are announced correctly. This may fail WCAG 2.1 success criterion 4.1.2 (Name, Role, Value).',
              'The VAT return screen does not have a separate step to review figures before they are submitted. It does show a declaration. This may fail WCAG 2.1 success criterion 3.3.4 (Error Prevention: Legal, Financial, Data).',
              'Some dashboard pages have not yet been checked for colour contrast of non-text elements, such as form field borders and chart colours. This may fail WCAG 2.1 success criterion 1.4.11 (Non-text Contrast).',
            ]} />
            <P>We plan to fix these issues by 31 March 2027.</P>
          </section>

          <section>
            <H2>What we&rsquo;re doing to improve accessibility</H2>
            <P>
              In November 2026 we fixed text colour contrast across the site and added a visible keyboard focus
              indicator, a &ldquo;Skip to main content&rdquo; link, page titles for every screen, autocomplete on personal
              details fields, and a review step before a quarterly update is sent to HMRC. Next, we will test the
              dashboard with screen readers (NVDA and VoiceOver) and fix what we find.
            </P>
          </section>

          <section>
            <H2>Preparation of this accessibility statement</H2>
            <P>
              This statement was prepared on 13 November 2026 and last reviewed on {LAST_REVIEWED}.
            </P>
            <P>
              We tested the service ourselves: we ran automated checks (axe-core) against WCAG 2.1 A and AA on the
              public pages and sign-in screens, and checked the code and keyboard behaviour of the dashboard screens
              used to keep records and send updates to HMRC. The service has not yet been audited by an external
              accessibility specialist.
            </P>
          </section>
        </div>
      </main>

      <SiteFooter source="accessibility" />
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '1.4rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #E8E2DA' }}>
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1C1208', marginTop: '1.25rem', marginBottom: '0.4rem' }}>{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ color: '#4A4035', marginBottom: '0.75rem' }}>{children}</p>;
}

function UL({ items }: { items: string[] }) {
  return (
    <ul style={{ color: '#4A4035', margin: '0 0 0.75rem 1.25rem', listStyleType: 'disc' }}>
      {items.map(i => <li key={i} style={{ marginBottom: '0.35rem' }}>{i}</li>)}
    </ul>
  );
}

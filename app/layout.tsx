import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import "./globals.css";
import Providers from "@/components/Providers";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import ContactWidget from "@/components/ContactWidget";
import PageViewTracker from "@/components/PageViewTracker";
import { isRtl } from '@/i18n/routing';

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://easytax.vip'),
  title: {
    default: 'EasyTax — MTD ITSA Software for UK Sole Traders & Limited Companies',
    template: '%s | EasyTax',
  },
  description: 'MTD ITSA software for UK sole traders, landlords and limited companies. Send quarterly updates to HMRC, file Self Assessment, VAT returns and CT600. £20 + VAT (£24 inc. VAT) per submission — no subscription, no card to sign up.',
  keywords: [
    'MTD ITSA software',
    'MTD for income tax UK',
    'making tax digital software',
    'making tax digital for income tax',
    'HMRC quarterly update software',
    'quarterly tax update HMRC',
    'MTD ITSA April 2026',
    'MTD ITSA sole trader',
    'MTD ITSA landlord',
    'coconut alternative',
    'coconut MTD alternative',
    'self assessment tax return UK',
    'freelancer tax return UK',
    'sole trader self assessment',
    'self employed tax return UK',
    'HMRC self assessment software',
    'limited company tax return UK',
    'corporation tax return UK',
    'company tax return software',
    'VAT return software UK',
    'MTD VAT software',
    'company accounts software UK',
    'profit and loss software UK',
    'balance sheet software UK',
  ],
  authors: [{ name: 'EasyTax', url: 'https://easytax.vip' }],
  creator: 'EasyTax',
  publisher: 'Finance Panda Limited',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://easytax.vip',
    siteName: 'EasyTax',
    title: 'EasyTax — MTD ITSA Software for UK Sole Traders & Limited Companies',
    description: 'MTD ITSA is live. Send quarterly updates to HMRC, file Self Assessment, VAT and CT600 — £24 per submission, no subscription.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'EasyTax — MTD ITSA software' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EasyTax — MTD ITSA Software for UK Sole Traders & Limited Companies',
    description: 'MTD ITSA is live. Quarterly HMRC updates, Self Assessment, VAT and CT600 — £24 per submission.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: 'https://easytax.vip' },
  verification: { google: 'GZdrRpA0y85OwCBOYVWYrdxur7Jur44AfjMbeH8MliE' },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = isRtl(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              // Shared @id with the node on the homepage so Google treats the
              // two as one entity rather than two competing descriptions of
              // the same app.
              '@id': 'https://easytax.vip/#software',
              name: 'EasyTax',
              applicationCategory: 'FinanceApplication',
              operatingSystem: 'Web',
              url: 'https://easytax.vip',
              description: 'UK tax software for freelancers and limited companies. File Self Assessment, VAT returns, CT600, Balance Sheet and P&L directly with HMRC for £24 per submission, no subscription.',
              // Was price '0' / "Free", which contradicted the £24 Offer on the
              // homepage and pricing page. Conflicting Offer nodes on the same
              // URL are a rich-result liability and read as a bait-and-switch
              // to anyone who checks.
              offers: {
                '@type': 'Offer',
                price: '24',
                priceCurrency: 'GBP',
                description: '£20 + VAT (£24 inc. VAT) per HMRC submission — no subscription, no card to sign up',
              },
              featureList: [
                'Self Assessment (SA100)',
                'Making Tax Digital for Income Tax (MTD ITSA)',
                'Quarterly HMRC updates',
                'VAT returns (MTD VAT)',
                'CT600 Corporation Tax',
                'Balance Sheet',
                'Profit & Loss',
                'Open Banking integration',
                'AI expense categorisation',
              ],
              publisher: { '@type': 'Organization', name: 'Finance Panda Limited', url: 'https://easytax.vip' },
              audience: {
                '@type': 'Audience',
                audienceType: 'UK freelancers, sole traders, contractors, and limited companies',
                geographicArea: { '@type': 'Country', name: 'United Kingdom' },
              },
            }),
          }}
        />
      </head>
      <body className={`${playfair.variable} ${dmSans.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
          <ContactWidget />
          {/* Unlike GA/Vercel Analytics below, this runs in preview too: it is
              the only way to verify tracking works before it reaches
              easytax.vip. Rows carry the deploy environment (see /api/track)
              so preview traffic is excluded from the funnel. */}
          <PageViewTracker />
        </NextIntlClientProvider>
        {process.env.VERCEL_ENV === 'production' && <Analytics />}
        {process.env.VERCEL_ENV === 'production' && <GoogleAnalytics gaId="G-ZF21G9RTJW" />}
      </body>
    </html>
  );
}

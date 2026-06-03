import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import ContactWidget from "@/components/ContactWidget";

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
    default: 'EasyTax — Free MTD ITSA Software for UK Sole Traders & Limited Companies',
    template: '%s | EasyTax',
  },
  description: 'Free MTD ITSA software for UK sole traders, landlords and limited companies. Send quarterly updates to HMRC, file Self Assessment, VAT returns and CT600. £0/year, forever — no card needed.',
  keywords: [
    'MTD ITSA software',
    'MTD ITSA software free',
    'MTD for income tax UK',
    'making tax digital software',
    'making tax digital for income tax',
    'HMRC quarterly update software',
    'quarterly tax update HMRC',
    'MTD ITSA April 2026',
    'MTD ITSA sole trader',
    'MTD ITSA landlord',
    'free MTD software UK',
    'coconut alternative',
    'coconut MTD alternative',
    'self assessment tax return UK',
    'self assessment software free',
    'freelancer tax return UK',
    'sole trader self assessment',
    'self employed tax return UK',
    'HMRC self assessment software',
    'limited company tax return UK',
    'CT600 software free',
    'corporation tax return UK',
    'company tax return software',
    'VAT return software UK',
    'MTD VAT software',
    'company accounts software UK',
    'profit and loss software UK',
    'balance sheet software UK',
    'free accounting software UK',
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
    title: 'EasyTax — Free MTD ITSA Software for UK Sole Traders & Limited Companies',
    description: 'MTD ITSA is live. Send quarterly updates to HMRC, file Self Assessment, VAT and CT600 — £0/year, forever.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'EasyTax — Free MTD ITSA software' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EasyTax — Free MTD ITSA Software for UK Sole Traders & Limited Companies',
    description: 'MTD ITSA is live. Quarterly HMRC updates, Self Assessment, VAT and CT600 — £0/year, forever.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: 'https://easytax.vip' },
  verification: { google: 'GZdrRpA0y85OwCBOYVWYrdxur7Jur44AfjMbeH8MliE' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'EasyTax',
              applicationCategory: 'FinanceApplication',
              operatingSystem: 'Web',
              url: 'https://easytax.vip',
              description: 'Free UK tax software for freelancers and limited companies. File Self Assessment, VAT returns, CT600, Balance Sheet and P&L directly with HMRC.',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP', description: 'Free' },
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
        <Providers>{children}</Providers>
        <ContactWidget />
        {process.env.VERCEL_ENV === 'production' && <Analytics />}
        {process.env.VERCEL_ENV === 'production' && <GoogleAnalytics gaId="G-ZF21G9RTJW" />}
      </body>
    </html>
  );
}

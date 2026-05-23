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
    default: 'EasyTax — Self Assessment & Making Tax Digital Software for UK Freelancers',
    template: '%s | EasyTax',
  },
  description: 'File your Self Assessment and Making Tax Digital (MTD ITSA) returns in minutes. Built for UK freelancers, sole traders and contractors. Connect your bank, categorise expenses, submit directly to HMRC. From £9.9.',
  keywords: [
    'self assessment tax return UK',
    'making tax digital software',
    'MTD ITSA software',
    'freelancer tax return UK',
    'sole trader self assessment',
    'HMRC self assessment software',
    'online tax return UK',
    'MTD for income tax',
    'self assessment filing software',
    'cheap self assessment UK',
    'self employed tax return',
    'quarterly tax update HMRC',
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
    title: 'EasyTax — Self Assessment & Making Tax Digital for UK Freelancers',
    description: 'File your Self Assessment and MTD returns in minutes. Connect your bank, categorise expenses, submit directly to HMRC. From £9.9.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'EasyTax — Self Assessment & Making Tax Digital Software' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EasyTax — Self Assessment & Making Tax Digital for UK Freelancers',
    description: 'File your Self Assessment and MTD returns in minutes. From £9.9.',
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
              description: 'Self Assessment and Making Tax Digital (MTD ITSA) filing software for UK freelancers, sole traders and contractors.',
              offers: { '@type': 'Offer', price: '9.90', priceCurrency: 'GBP', description: 'Per tax return' },
              publisher: { '@type': 'Organization', name: 'Finance Panda Limited', url: 'https://easytax.vip' },
              audience: {
                '@type': 'Audience',
                audienceType: 'UK freelancers, sole traders, and contractors',
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

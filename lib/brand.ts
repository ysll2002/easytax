// Product name and the domain outgoing email is sent from.
//
// Mail is sent through Resend, which only accepts a From address on a domain
// it has verified. Until mtdbuddy.com is verified in Resend, set
// MAIL_FROM_DOMAIN=easytax.vip in Vercel so email keeps sending; remove it (or
// set it to mtdbuddy.com) once the new domain is verified.
export const BRAND_NAME = 'MTD Buddy';

export const MAIL_FROM_DOMAIN = (process.env.MAIL_FROM_DOMAIN ?? '').trim() || 'mtdbuddy.com';

export const MAIL_FROM = `${BRAND_NAME} <hello@${MAIL_FROM_DOMAIN}>`;

// Our entry on GOV.UK's "Find software that works with Making Tax Digital for
// Income Tax" — the public proof that HMRC recognises the product.
export const HMRC_LISTING_URL =
  'https://www.tax.service.gov.uk/find-making-tax-digital-income-tax-software/product-details?productId=3725';

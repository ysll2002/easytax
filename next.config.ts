import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.easytax.vip' }],
        destination: 'https://easytax.vip/:path*',
        permanent: true,
      },
      {
        source: '/privacy-policy',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/terms-conditions',
        destination: '/terms',
        permanent: true,
      },
      {
        source: '/dashboard/tax',
        destination: '/dashboard/individual',
        permanent: true,
      },
      {
        source: '/dashboard/tax/:path*',
        destination: '/dashboard/individual/:path*',
        permanent: true,
      },
      {
        source: '/dashboard/reconcile',
        destination: '/dashboard/individual/reconcile',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);

import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // The embeddable widget is the one route on this site that is *meant*
        // to be framed by strangers. Stating that explicitly matters because
        // the permission is currently implicit — nothing sets X-Frame-Options
        // today, so the widget works by accident. The first time a security
        // header is added site-wide, this entry is what stops that change from
        // silently blanking the widget on every site that has embedded it,
        // with no error anyone here would see.
        source: '/embed/:path*',
        headers: [{ key: 'Content-Security-Policy', value: 'frame-ancestors *' }],
      },
    ];
  },

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
        source: '/dashboard/individual/reconcile',
        destination: '/dashboard/reconcile',
        permanent: true,
      },
      {
        source: '/dashboard/company/reconcile',
        destination: '/dashboard/reconcile',
        permanent: true,
      },
      {
        source: '/dashboard/individual/banking',
        destination: '/dashboard/banking',
        permanent: true,
      },
      {
        source: '/dashboard/company/banking',
        destination: '/dashboard/banking',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.easytax.vip' }],
        destination: 'https://easytax.vip/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/posts/drawdown-map',
        destination: '/posts/market-history',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;

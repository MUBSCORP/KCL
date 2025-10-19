import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/auth/:path*', destination: 'http://localhost:8080/auth/:path*' },
      // 필요 시 다른 백엔드 API도 추가
    ];
  },
  // scss source map
  // reactStrictMode: true,
  // sassOptions: {
  //   sourceMap: true,
  // },
  // productionBrowserSourceMaps: true,
};

export default nextConfig;

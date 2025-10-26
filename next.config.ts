import type { NextConfig } from 'next';
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/auth/:path*', destination: 'http://localhost:8080/auth/:path*' },
      // 필요 시 다른 백엔드 API도 추가
    ];
  },

  // scss source map
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  sassOptions: {
    sourceMap: true,
    includePaths: [path.join(__dirname, 'src/styles')],
  },
};

export default nextConfig;

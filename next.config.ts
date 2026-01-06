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
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
        port: '8088',
        pathname: '/api/files/**',
      },
    ],
  },
  // scss source map
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  sassOptions: {
    sourceMap: true,
    includePaths: [path.join(__dirname, 'src/styles')],
  },
  output: 'standalone',   // ← 여기에 합쳐서 넣기
  eslint: { ignoreDuringBuilds: true },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig;

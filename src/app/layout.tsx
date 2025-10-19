// src/app/layout.tsx
import Providers from './providers';
import type { Metadata } from 'next';
import './globals.css';

// scss
import '@/styles/app.scss';

// title
export const metadata: Metadata = {
  title: 'KCL Cell/Pack 통합 모니터링 Korea Conformity Laboratories"',
};

// ⬇️ 추가
// @ts-ignore
// src/app/layout.tsx
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}

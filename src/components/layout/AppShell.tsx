'use client';

import AppHeader from '@/components/layout/AppHeader';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* header */}
      <AppHeader />

      {/* contents */}
      <div className="container">
        <div className="wrapper">
          <main>{children}</main>
        </div>
      </div>
    </>
  );
}

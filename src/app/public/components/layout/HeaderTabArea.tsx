'use client';

import { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';

// ✅ .env.local 에서 API BASE 읽기
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE ?? '';

// ✅ 탭 정의: 라벨 + 이동 경로 + 타입
const TABS = [
  { label: '대시보드', href: '/' as const, type: 'internal' as const },
  { label: '실시간 모니터링', href: undefined, type: 'none' as const }, // 아직 미정
  { label: '이벤트 로그 상세', href: '/public/event-log' as const, type: 'internal' as const },
  { label: 'Setting', href: API_BASE_URL, type: 'external' as const },   // 🔹 새창 오픈
];

function pathToIndex(pathname: string): number {
  if (pathname.startsWith('/public/event-log')) return 2;
  if (pathname === '/') return 1;
  if (
    pathname.startsWith('/public/dashboard-pack') ||
    pathname.startsWith('/public/dashboard-cell')
  )
    return 0;
  return 0;
}

export default function HeaderTabArea() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState(() => pathToIndex(pathname));

  useEffect(() => {
    setActiveIndex(pathToIndex(pathname));
  }, [pathname]);

  const handleClick = (index: number) => {
    const tab = TABS[index];
    setActiveIndex(index);

    // 🔹 외부 링크 (Setting) → 새창
    if (tab.type === 'external' && tab.href) {
      window.open(tab.href, '_blank', 'noopener,noreferrer');
      return;
    }

    // 🔹 내부 라우팅
    if (tab.type === 'internal' && tab.href) {
      router.push(tab.href);
    }

    // type === 'none' 인 탭은 동작 없음 (필요하면 나중에 추가)
  };

  return (
    <div className="tabArea">
      <ul>
        {TABS.map((tab, index) => (
          <li key={tab.label}>
            <Button
              className={`customBtn ${activeIndex === index ? 'isActive' : ''}`}
              onClick={() => handleClick(index)}
            >
              <span>{tab.label}</span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';

// ✅ 탭 정의: 라벨 + 이동 경로
const TABS = [
  { label: '대시보드', href: '/public/dashboard-pack' }, // 현재 대시보드 경로
  { label: '장비가동율 상세', href: '/' },                // 루트 페이지
  { label: '이벤트 로그 상세', href: '/public/event-log' }, // 이벤트 로그 상세
  { label: '사용 전력량 상세', href: undefined },          // 추후 필요 시 추가
];

// ✅ 현재 경로에 따라 어떤 탭이 활성화될지 결정
function pathToIndex(pathname: string): number {
  if (pathname.startsWith('/public/event-log')) return 2;
  if (pathname === '/') return 1;
  if (pathname.startsWith('/public/dashboard-pack')) return 0;
  return 0; // 기본은 대시보드
}

export default function HeaderTabArea() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState(() => pathToIndex(pathname));

  // ✅ URL이 바뀌면 자동으로 활성 탭 갱신
  useEffect(() => {
    setActiveIndex(pathToIndex(pathname));
  }, [pathname]);

  const handleClick = (index: number) => {
    const tab = TABS[index];
    setActiveIndex(index); // 로컬 상태 갱신

    if (tab.href) {
      router.push(tab.href); // 라우팅
    }
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

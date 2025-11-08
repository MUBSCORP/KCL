'use client';

import { useState } from 'react';
import { Button } from '@mui/material';

export default function HeaderTabArea() {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabs = ['대시보드', '장비가동율 상세', '이벤트 로그 상세', '사용 전력량 상세'];

  return (
    <div className="tabArea">
      <ul>
        {tabs.map((label, index) => (
          <li key={index}>
            <Button className={`customBtn ${activeIndex === index ? 'isActive' : ''}`} onClick={() => setActiveIndex(index)}>
              <span>{label}</span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

'use client';

import { Button } from '@mui/material';

export default function TopStateCenterList() {
  const items = [
    { time: '06시 11분 21초', desc: '1F-001A 온도 임계 임박', warning: true },
    { time: '06시 11분 21초', desc: '시스템 백업 완료', warning: false },
    { time: '06시 11분 21초', desc: '시스템 백업 완료', warning: false },
  ];

  return (
    <div className="listArea">
      <ul>
        {items.map((item, index) => (
          <li key={index} className={item.warning ? 'warning' : ''}>
            <Button className="customBtn">
              <span className="time">{item.time}</span>
              <span className="desc">{item.desc}</span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

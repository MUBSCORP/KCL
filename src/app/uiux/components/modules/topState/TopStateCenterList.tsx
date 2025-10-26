'use client';

import { Button } from '@mui/material';

export default function TopStateCenterList() {
  const items = [
    { time: '06시 11분 21초', desc: '1F-001A 온도 임계 임박', type: 'warning' },
    { time: '06시 11분 21초', desc: '시스템 백업 완료', type: '' },
    { time: '06시 11분 21초', desc: '1F-001B 속도 비정상 패턴', type: 'danger' },
  ];

  return (
    <div className="listArea">
      <ul>
        {items.map((item, index) => (
          <li key={index} className={item.type === 'warning' ? 'warning' : item.type === 'danger' ? 'danger' : ''}>
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

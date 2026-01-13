'use client';

import { Button } from '@mui/material';

export default function TopStateCenterList() {
  const items = [
    { time: '06시 11분 21초', desc: 'B003-1 (EquipID+channelIndex) 에서 스케쥴 파일에서 오류가 발생했습니다.', type: 'warning' },
    { time: '06시 11분 21초', desc: '시스템 백업 완료', type: '' },
    { time: '06시 11분 21초', desc: '2000A-5A (EquipID+channelName) 에서 스케쥴 파일에서 오류가 발생했습니다.', type: 'danger' },
  ];

  return (
    <div className="listArea">
      <ul>
        {items.map((item, index) => (
          <li key={index} className={item.type === 'warning' ? 'warning' : item.type === 'danger' ? 'danger' : ''}>
            <Button className="customBtn">
              <span className="desc" style={{ maxWidth: '50rem' }}>
                {item.desc}
              </span>
              <span className="time">{item.time}</span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import TopStateCenterList, { AlarmItem } from './TopStateCenterList';
import TopStateCenterResult from './TopStateCenterResult';

export type EquipType = 'PACK' | 'CELL';

interface TopStateCenterProps {
  equipType: EquipType;
  onMoreClick?: () => void;
}

export default function TopStateCenter({ equipType, onMoreClick }: TopStateCenterProps) {
  const [selected, setSelected] = useState<AlarmItem | null>(null);

  // (권장) 타입 변경 시 선택 초기화 → 리스트의 autoSelectFirst가 다시 첫 항목을 선택
  useEffect(() => {
    setSelected(null);
  }, [equipType]);

  return (
    <>
      <h3 className="tit">
        <span>
          <i />
          실시간 이벤트 로그 & 알림
        </span>
        <Button className="customBtn" onClick={onMoreClick}>more</Button>
      </h3>
      <div className="innerWrap">
        <TopStateCenterList
          equipType={equipType}
          onSelect={setSelected}
          selectedId={selected?.id ?? null}
          autoSelectFirst={true}   // ✅ 첫 항목 자동 선택 (리스트에서 처리)
        />
        {/* ✅ 전체 item 전달 (desc/조치 등은 Result 내부에서 item에서 꺼내 사용) */}
        {selected ? <TopStateCenterResult item={selected} /> : null}
      </div>
    </>
  );
}

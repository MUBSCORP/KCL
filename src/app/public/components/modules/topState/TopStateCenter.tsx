'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import TopStateCenterList, { AlarmItem } from './TopStateCenterList';
import TopStateCenterResult from './TopStateCenterResult';

export type EquipType = 'PACK' | 'CELL';

interface TopStateCenterProps {
  equipType: EquipType;
  onMoreClick?: () => void;
}

export default function TopStateCenter({ equipType, onMoreClick }: TopStateCenterProps) {
  const [selected, setSelected] = useState<AlarmItem | null>(null);
  const router = useRouter();

  // 🔹 이전 equipType 기억해서 "실제 변경"될 때만 선택 초기화
  const prevTypeRef = useRef<EquipType | null>(null);
  useEffect(() => {
    if (prevTypeRef.current !== null && prevTypeRef.current !== equipType) {
      // PACK ↔ CELL 타입이 바뀔 때만 선택 초기화
      setSelected(null);
    }
    prevTypeRef.current = equipType;
  }, [equipType]);

  const handleMoreClick = () => {
    if (onMoreClick) {
      // 부모에서 커스텀 동작을 지정한 경우
      onMoreClick();
      return;
    }
    // 기본: 이벤트 로그 상세 페이지로 이동 (equipType 쿼리 같이 전달)
    router.push(`/public/event-log?equipType=${equipType}`);
  };

  return (
    <>
      <h3 className="tit">
        <span>
          <i />
          실시간 이벤트 로그 & 알림
        </span>
        <Button className="customBtn" onClick={handleMoreClick}>
          more
        </Button>
      </h3>
      <div className="innerWrap">
        <TopStateCenterList
          equipType={equipType}
          onSelect={setSelected}
          selectedId={selected?.id ?? null}
          autoSelectFirst={true}     // ✅ 첫 항목 자동 선택
          onEmpty={() => setSelected(null)} // ✅ 리스트 비면 상세도 비우기
        />
        {/* 선택된 알림이 있을 때만 우측 상세 표시 */}
        {selected ? <TopStateCenterResult item={selected} /> : null}
      </div>
    </>
  );
}

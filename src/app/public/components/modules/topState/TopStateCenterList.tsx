// TopStateCenterList.tsx
'use client';

import { useEffect, useRef } from 'react';
import useSWR from 'swr';
import { Button } from '@mui/material';

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export type AlarmItem = {
  time?: string; desc?: string; type?: string; level?: string;
  channel?: number; code?: number; id?: number;
  troubleshooting?: string;
  eqpid?: string;
};

function fmtKST(iso?: string) {
  if (!iso) return '';
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === t)?.value ?? '00';
  return `${get('hour')}시 ${get('minute')}분 ${get('second')}초`;
}

export interface Props {
  equipType: 'PACK' | 'CELL';
  onSelect?: (item: AlarmItem) => void;
  selectedId?: number | null;
  autoSelectFirst?: boolean;      // ✅ 여기에 추가
}

export default function TopStateCenterList({
                                             equipType, onSelect, selectedId, autoSelectFirst = true, // ✅ 기본값
                                           }: Props) {
  const { data, error, isLoading } = useSWR<AlarmItem[]>(
    `${process.env.NEXT_PUBLIC_API_BASE}/api/monitoring/alarms/${equipType}/recent?limit=30`,
    fetcher,
    { refreshInterval: 3000 }
  );

  // 최신 자동추적: 첫 항목 변경 시 선택 교체
  const lastFirstKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const items = Array.isArray(data) ? data : [];
    if (!items.length || !autoSelectFirst) return;

    const first = items[0];
    const firstKey = `${first?.id ?? 'x'}|${first?.time ?? ''}`;

    if (lastFirstKeyRef.current !== firstKey) {
      lastFirstKeyRef.current = firstKey;
      onSelect?.(first);
    }
  }, [data, onSelect, autoSelectFirst]);

  if (isLoading) return <div className="listArea"><ul><li>로딩중…</li></ul></div>;
  if (error)     return <div className="listArea"><ul><li>알림 로딩 실패</li></ul></div>;

  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) {
    return <div className="listArea"><ul><li>최근 알림 없음</li></ul></div>;
  }

  return (
    <div className="listArea">
      <ul>
        {items.map((item, index) => {
          const liClass =
            item.type === 'warning' ? 'warning' :
              item.type === 'danger'  ? 'danger'  : '';
          const activeClass = (selectedId != null && item.id === selectedId) ? ' active' : '';
          return (
            <li key={index} className={liClass + activeClass}>
              <Button
                className="customBtn"
                onClick={(e) => { e.preventDefault(); onSelect?.(item); }}
              >
                <span className="desc">
                  {item.desc ?? '-'}
                  {item.channel != null ? ` (CH-${item.channel})` : ''}
                  {item.code != null ? ` [${item.code}]` : ''}
                </span>
                <span className="time">{fmtKST(item.time)}</span>
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

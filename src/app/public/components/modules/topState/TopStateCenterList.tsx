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
  time?: string;
  desc?: string;
  type?: string;
  level?: string;
  channel?: number;
  code?: number;
  id?: number;
  troubleshooting?: string;
  eqpid?: string;
};

export interface Props {
  equipType: 'PACK' | 'CELL';
  onSelect?: (item: AlarmItem) => void;
  selectedId?: number | null;
  autoSelectFirst?: boolean;
  onEmpty?: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

function pad2(n: string) {
  const s = (n ?? '').trim();
  return s.length === 1 ? `0${s}` : s.slice(0, 2).padStart(2, '0');
}

/**
 * ✅ 타임존 변환 X
 * 서버 time 문자열에서 HH:mm:ss 만 "문자열로" 추출해 "00시 00분 00초" 형태로 반환
 *
 * 지원 예:
 * - 2025-11-26T17:41:06Z
 * - 2025-11-26T17:41:06.123Z
 * - 2025-11-26 17:41:06
 * - 17:41:06
 */
function fmtRawHms(time?: string) {
  if (!time) return '00시 00분 00초';
  const s = String(time).trim();
  if (!s) return '00시 00분 00초';

  // 1) "T" 또는 공백 뒤에 오는 시간 파트 찾기
  let t = s;
  const tIdx = s.indexOf('T');
  if (tIdx >= 0) t = s.slice(tIdx + 1);
  else {
    const sp = s.indexOf(' ');
    if (sp >= 0) t = s.slice(sp + 1);
  }

  // 2) 끝의 Z / timezone 오프셋 / 밀리초 제거
  // - 먼저 Z 제거
  t = t.replace(/Z$/i, '');
  // - +09:00, -04:00 같은 오프셋 제거
  t = t.replace(/[+-]\d{2}:\d{2}$/i, '');
  // - 밀리초 제거
  t = t.replace(/\.\d+$/, '');

  // 3) HH:mm:ss 패턴 추출
  const m = t.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  if (!m) return '00시 00분 00초';

  const hh = pad2(m[1] ?? '00');
  const mm = pad2(m[2] ?? '00');
  const ss = pad2(m[3] ?? '00');

  return `${hh}시 ${mm}분 ${ss}초`;
}

export default function TopStateCenterList({
                                             equipType,
                                             onSelect,
                                             selectedId,
                                             autoSelectFirst = true,
                                             onEmpty,
                                           }: Props) {
  const { data, error, isLoading, mutate } = useSWR<AlarmItem[]>(
    `${API_BASE}/api/monitoring/alarms/${equipType}/recent?limit=30`,
    fetcher,
    { refreshInterval: 0, revalidateOnFocus: false },
  );

  useEffect(() => {
    const sseUrl = `${API_BASE}/api/monitoring/sse/alarms`;
    const es = new EventSource(sseUrl);

    es.onopen = () => console.info('[SSE-ALARMS] connected:', sseUrl);
    es.onmessage = (e) => {
      console.info('[SSE-ALARMS] message:', e.data);
      mutate();
    };
    es.onerror = (err) => console.error('[SSE-ALARMS] error', err);

    return () => {
      console.info('[SSE-ALARMS] disconnected');
      es.close();
    };
  }, [mutate]);

  const lastFirstKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const items = Array.isArray(data) ? data : [];

    if (!items.length) {
      lastFirstKeyRef.current = null;
      if (autoSelectFirst) onEmpty?.();
      return;
    }

    if (!autoSelectFirst) return;

    const first = items[0];
    const firstKey = `${first?.id ?? 'x'}|${first?.time ?? ''}`;

    if (lastFirstKeyRef.current !== firstKey) {
      lastFirstKeyRef.current = firstKey;
      onSelect?.(first);
    }
  }, [data, onSelect, autoSelectFirst, onEmpty]);

  if (isLoading)
    return (
      <div className="listArea">
        <ul>
          <li>로딩중…</li>
        </ul>
      </div>
    );

  if (error)
    return (
      <div className="listArea">
        <ul>
          <li>알림 로딩 실패</li>
        </ul>
      </div>
    );

  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) {
    return (
      <div className="listArea">
        <ul>
          <li>최근 알림 없음</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="listArea">
      <ul>
        {items.map((item, index) => {
          const liClass =
            item.type === 'warning' ? 'warning' : item.type === 'danger' ? 'danger' : '';
          const activeClass = selectedId != null && item.id === selectedId ? ' active' : '';

          return (
            <li key={index} className={liClass + activeClass}>
              <Button
                className="customBtn"
                onClick={(e) => {
                  e.preventDefault();
                  onSelect?.(item);
                }}
              >
                <span className="desc">
                  {item.desc ?? '-'}
                  {item.channel != null ? ` (CH-${item.channel})` : ''}
                  {item.code != null ? ` [${item.code}]` : ''}
                </span>

                {/* ✅ "00시 00분 00초" 포맷, 타임존 변환 없음 */}
                <span className="time">{fmtRawHms(item.time)}</span>
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

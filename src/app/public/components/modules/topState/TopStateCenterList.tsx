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

function fmtKST(iso?: string) {
  if (!iso) return '';
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? '00';
  return `${get('hour')}시 ${get('minute')}분 ${get('second')}초`;
}

export interface Props {
  equipType: 'PACK' | 'CELL';
  onSelect?: (item: AlarmItem) => void;
  selectedId?: number | null;
  autoSelectFirst?: boolean;
  /** 🔹 리스트가 비었을 때(알람/메모가 0개일 때) 부모에게 알려주기 위한 콜백 */
  onEmpty?: () => void;
}

// ✅ 백엔드 BASE URL (환경변수 사용)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

export default function TopStateCenterList({
                                             equipType,
                                             onSelect,
                                             selectedId,
                                             autoSelectFirst = true,
                                             onEmpty,
                                           }: Props) {
  // ✅ 주기적 폴링은 끄고, SSE에서 mutate()로만 갱신
  const { data, error, isLoading, mutate } = useSWR<AlarmItem[]>(
    `${API_BASE}/api/monitoring/alarms/${equipType}/recent?limit=30`,
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    }
  );

  // ✅ SSE로 알람 변경 신호 수신 → mutate()로 /recent 재조회
  useEffect(() => {
    const sseUrl = `${API_BASE}/api/monitoring/sse/alarms`;
    const es = new EventSource(sseUrl);

    es.onopen = () => {
      console.info('[SSE-ALARMS] connected:', sseUrl);
    };

    es.onmessage = (e) => {
      console.info('[SSE-ALARMS] message:', e.data);
      // 메시지 내용은 크게 신경 안 쓰고, "알람 변경" 신호라고 보고 최신 목록 재조회
      mutate();
    };

    es.onerror = (err) => {
      console.error('[SSE-ALARMS] error', err);
      // 에러가 나도 브라우저가 자동 재연결 시도를 함
    };

    return () => {
      console.info('[SSE-ALARMS] disconnected');
      es.close();
    };
  }, [mutate]);

  // ✅ 최신 자동추적: 첫 항목 변경 시 선택 교체 + 리스트가 비면 선택 해제 알림
  const lastFirstKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const items = Array.isArray(data) ? data : [];

    // 🔹 리스트가 비었을 때: 선택 키 초기화 + 부모에게 "비었다" 알리기
    if (!items.length) {
      lastFirstKeyRef.current = null;

      // autoSelectFirst 모드일 때만 자동 해제 신호를 보냄
      if (autoSelectFirst) {
        onEmpty?.();
      }
      return;
    }

    // 🔹 자동 첫 번째 선택 기능이 비활성화된 경우
    if (!autoSelectFirst) return;

    const first = items[0];
    const firstKey = `${first?.id ?? 'x'}|${first?.time ?? ''}`;

    // 첫 항목(또는 그 키)이 바뀐 경우에만 선택 변경
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
            item.type === 'warning'
              ? 'warning'
              : item.type === 'danger'
                ? 'danger'
                : '';
          const activeClass =
            selectedId != null && item.id === selectedId ? ' active' : '';
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
                <span className="time">{fmtKST(item.time)}</span>
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

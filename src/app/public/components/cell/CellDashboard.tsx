'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import React from 'react';

// ===============================
// ListType2 타입 끌어오기
// ===============================
import List2 from '@/app/public/components/modules/monitoring/ListType2';
type List2Props = React.ComponentProps<typeof List2>;
type ListItem = List2Props['listData'][number];
type PowerUnit = 'W' | 'kW' | 'MW';

import { useAuthStore } from '@/store/auth.store';

// 값(W 등) 기준으로 자동 스케일링
export function scalePower(value: number): { value: number; unit: PowerUnit } {
  const abs = Math.abs(value);
  let scaled = value;
  let unit: PowerUnit = 'W';

  if (abs >= 1_000_000) {
    // 1,000,000 이상 → MW
    scaled = value / 1_000_000;
    unit = 'MW';
  } else if (abs >= 1_000) {
    // 1,000 이상 → kW
    scaled = value / 1_000;
    unit = 'kW';
  } else {
    // 그 외 → W
    scaled = value;
    unit = 'W';
  }
  const fixed = Number(scaled.toFixed(1));
  return { value: fixed, unit };
}

// 문자열로 한 번에 만들고 싶으면
export function formatPowerLabel(value: number): string {
  const { value: v, unit } = scalePower(value);
  return `${v} ${unit}`;
}

// ===============================
// 백엔드 MonitoringItem 타입
// ===============================
export type MonitoringItem = {
  id: number;
  title: string;
  check: boolean;
  schedule: string;
  memo: boolean;
  memoText: any;
  operation: string; // charge | discharge | rest | ...
  status: string; // rest / run / pause / alarm
  statusLabel: string; // 대기 / 진행중 / 일시정지 / 알람
  voltage: string;
  current: string;
  power: string;
  step: string;
  // 🔹 서버에서 내려주는 Step 이름 (TOP 6 집계용)
  stepName?: string;
  cycle: string;
  rly: string;
  dgv?: string;
  chamber?: string;
  temp: string; // "20.5°C / 22°C"
  humidity: string;
  cycles: number;
  activeCycles: number;
  time: string;
  x?: number;
  y?: number;
  eqpid?: string;
  channelIndex?: number;
  shutdown?: boolean;
  powerOn?: boolean;

  // 🔹 CELL 전용 추가 필드
  batteryId?: string;
  testName?: string;
  cellTemp?: string;
  chamberStatus?: string;
  chamberIndex?: number;
  rawStatus?: string;

  // 백엔드에서 내려주고 있으면 활용
  timestamp?: string;

  ip?: string; // ✅ 선택: 백엔드 ip 내려받기
  // 🔹 알람 존재 여부(백엔드에서 내려줌)
  alarmCount?: number; // Alarms 배열 길이
  hasAlarms?: boolean; // alarmCount > 0 이면 true
};

// ===============================
// 통신 설정
// ===============================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE ?? '';
const LIST_API = `${API_BASE_URL}/api/monitoring/CELL/list`;
const SSE_URL = `${API_BASE_URL}/api/monitoring/sse/telemetry`;

const POWER_TODAY_API = `${API_BASE_URL}/api/power/today?type=CELL`;
const POWER_MONTH_API = `${API_BASE_URL}/api/power/month?type=CELL`;

type TodayPower = { charge: number; discharge: number };
type MonthPower = { month: string; charge: number; discharge: number };

const fetcher = async (path: string) => {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as MonitoringItem[];
};

// ===============================
// 디자인 퍼블 import
// ===============================

// topState
import ChartRunning from '@/app/public/components/modules/topState/ChartRunning';
import ChartState from '@/app/public/components/modules/topState/ChartState';
import ChartState2 from '@/app/public/components/modules/topState/ChartState2';
import ChartOperation from '@/app/public/components/modules/topState/ChartOperation';
import ChartToday from '@/app/public/components/modules/topState/ChartToday';
import ChartMonth from '@/app/public/components/modules/topState/ChartMonth';
import TopStateCenter from '@/app/public/components/modules/topState/TopStateCenter';

// topFilter
import ColorChipType2 from '@/app/public/components/modules/topFilter/ColorChipType2';
import SearchArea from '@/app/public/components/modules/topFilter/SearchArea';
import PageTitle from '@/app/public/components/modules/PageTitle';
import titleIcon from '@/assets/images/icon/detail3.png';
import { Dialog, DialogTitle, DialogContent, IconButton, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// ===============================
// 유틸 함수들
// ===============================
type MemoStatus = 'ongoing' | 'stop' | 'completion' | 'available';
type ChannelMode = 'run' | 'stop' | 'alarm' | 'complete' | 'ready' | 'idle';

function splitTemp(src?: string | null): [string, string] {
  if (!src) return ['', ''];
  const parts = src.split('/');
  const left = (parts[0] ?? '').trim();
  const right = (parts[1] ?? '').trim();
  return [left, right];
}

// 🔹 온도 표시를 소수점 1자리로 포맷
function formatTemp(val?: string | null): string {
  if (!val) return '';
  const s = val.trim();
  if (!s || s === '-') return s;

  const m = s.match(/^([-+]?\d+(?:\.\d+)?)(.*)$/);
  if (!m) return s;

  const num = parseFloat(m[1]);
  if (Number.isNaN(num)) return s;

  const unit = (m[2] ?? '').trim(); // "°C", "℃" 등

  const truncated1 = Math.trunc(num * 10) / 10;

  const valueStr = Number.isInteger(truncated1)
    ? String(truncated1)
    : truncated1.toFixed(1);

  return `${valueStr}${unit ? '' + unit : ''}`;
}

function extractRawStatusFromStep(step?: string | null): string {
  if (!step) return '';
  const open = step.indexOf('(');
  const close = step.lastIndexOf(')');
  if (open < 0 || close < 0 || close <= open) return '';
  return step.slice(open + 1, close).trim();
}

// 🔹 Status 매핑 테이블 (소문자 기준)
const RUN_STATUS_LIST = [
  'charge',
  'discharge',
  'standing',
  'working simulation',
  'pulse',
  'dcir',
  'starting',
  'insulate',
  'channel linkage',
  'starting insulation voltage',
  'ending insulation voltage',
  'power sharing',
];

const STOP_STATUS_LIST = [
  'pause',
  'appoint time pause',
  'appoint step pause',
  'appoint loop pause',
  'appoint step loop pause',
  'special pause',
];

const ALARM_STATUS_LIST = [
  'device alarm',
  'comm error',
  'no connected battery',
  'disable',
  'extern comm error',
];

const COMPLETE_STEP_LIST = ['end ok', 'end ng', 'user termination'];


function normalizeStatusName(s?: string | null): string {
  if (!s) return '';
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

// 🔹 채널 단위 상태 판별
function getChannelMode(ch: MonitoringItem): ChannelMode {
  const rawStatus = normalizeStatusName(ch.rawStatus);
  const rawStep = normalizeStatusName(extractRawStatusFromStep(ch.step));

  if (rawStep && COMPLETE_STEP_LIST.includes(rawStep)) {
    return 'complete';
  }

  if (rawStatus) {
    if (RUN_STATUS_LIST.includes(rawStatus)) return 'run';
    if (STOP_STATUS_LIST.includes(rawStatus)) return 'stop';
    if (ALARM_STATUS_LIST.includes(rawStatus)) return 'alarm';
    if (rawStatus === 'ready') return 'ready';
  }

  const s = normalizeStatusName(ch.status);
  if (s === 'alarm') return 'alarm';
  if (s === 'run') return 'run';
  if (s === 'pause') return 'stop';
  if (s === 'rest') return 'ready';
  if (s === 'complete') return 'complete';
  return 'idle';
}

// 메모용 상태 → CSS class
function toMemoStatus(ch: MonitoringItem): MemoStatus {
  const mode = getChannelMode(ch);

  // 🔁 완료도 대기(available) 쪽으로 합산
  if (mode === 'complete') return 'completion';
  if (mode === 'run') return 'ongoing';
  if (mode === 'stop' || mode === 'alarm') return 'stop';
  return 'available';
}

// 장비(그룹) 키: eqpid + chamberIndex
const groupKeyOf = (eqpid: string, chamberIndex: number) =>
  `${eqpid}__${chamberIndex || 1}`;

type EquipGroup = {
  key: string;
  title: string;
  eqpid: string;
  chamberIndex: number;
  channels: MonitoringItem[];
};

// 장비(그룹) 시그니처: 값이 실제로 바뀌었는지 비교용
function buildGroupSignature(group: EquipGroup): string {
  return group.channels
    .map((ch) => {
      return [
        ch.rawStatus ?? '',
        ch.status ?? '',
        ch.step ?? '',
        ch.temp ?? '',
        ch.humidity ?? '',
        ch.voltage ?? '',
        ch.current ?? '',
        ch.power ?? '',
        ch.timestamp ?? '',
      ].join('|');
    })
    .join('||');
}

// 🔹 CELL MonitoringItem 키 (chamber*100 + channel)
function cellItemKey(ch: MonitoringItem): string {
  const eqpid = (ch.eqpid || ch.title || '').trim();
  const chamber =
    typeof ch.chamberIndex === 'number' && ch.chamberIndex > 0
      ? ch.chamberIndex
      : 1;
  const chIdx =
    typeof ch.channelIndex === 'number' && ch.channelIndex > 0
      ? ch.channelIndex
      : 1;
  const keyIndex = chamber * 100 + chIdx;
  return `${eqpid}#${keyIndex}`;
}

// 🔥 JSON 유효성 검사 함수
function isJsonString(str: string): boolean {
  try {
    const obj = JSON.parse(str);
    return typeof obj === 'object' || Array.isArray(obj);
  } catch {
    return false;
  }
}

// ✅ RESET 모드
type ResetMode = 'clear-blink' | 'complete-to-available';



// 채널 신선도(freshness) 계산: timestamp → time → id 순으로 사용
function getFreshnessScore(ch: MonitoringItem): number {
  // 1) timestamp 우선
  if (ch.timestamp) {
    const ts = Date.parse(ch.timestamp);
    if (!Number.isNaN(ts)) return ts;
  }

  // 2) time
  if (ch.time) {
    const ts = Date.parse(ch.time);
    if (!Number.isNaN(ts)) return ts;
  }

  // 3) id (id 가 클수록 최근이라고 가정)
  if (typeof ch.id === 'number' && Number.isFinite(ch.id)) {
    return ch.id;
  }

  // 4) 다 없으면 가장 오래된 걸로 취급
  return 0;
}

// 같은 (x,y) 좌표에 여러 CELL 카드가 오면 "신선도가 더 높은 것"만 남기기
function normalizeByCoordinate(list: MonitoringItem[]): MonitoringItem[] {
  const result: MonitoringItem[] = [];
  const coordIndex = new Map<string, number>();

  for (const ch of list) {
    const xRaw = ch.x;
    const yRaw = ch.y;
    const xNum = Number(xRaw);
    const yNum = Number(yRaw);

    // 좌표가 없거나 0 이하이면 좌표 중복 체크 없이 그냥 추가
    if (!Number.isFinite(xNum) || !Number.isFinite(yNum) || xNum <= 0 || yNum <= 0) {
      result.push(ch);
      continue;
    }

    const key = `${xNum}_${yNum}`;
    const existingIdx = coordIndex.get(key);

    if (existingIdx !== undefined) {
      const prev = result[existingIdx];
      const prevScore = getFreshnessScore(prev);
      const currScore = getFreshnessScore(ch);

      // 디버그 로그 필요 없으면 아래 console.log들은 지워도 됨
      // console.log('[CELL][COORD] dup', key, 'prevScore=', prevScore, 'currScore=', currScore);

      // 신선도 높은 쪽만 남기기 (동점이면 새 데이터 우선)
      if (currScore >= prevScore) {
        result[existingIdx] = ch;
      } else {
        // 기존이 더 최신이면 그냥 패스
      }
    } else {
      coordIndex.set(key, result.length);
      result.push(ch);
    }
  }

  return result;
}


export default function DashboardCell() {

  // 🔐 로그인/권한 정보
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = !!token && !!user;
  const mgtIdx = user?.mgtIdx;

  // 🔑 메모 편집 권한: "로그인 + mgtIdx !== 4" 인 사람만 허용
  const canEditMemo = isLoggedIn && mgtIdx !== 4;

  // 🔹 List2 강제 리렌더용 토큰
  const [listRenderToken, setListRenderToken] = useState(0);
  const hasForcedListRenderRef = useRef(false);

  // 🔹 전력량은 최초 1번만 가져오고 이후엔 SSE에서 mutate로만 갱신
  const { data: todayPower, mutate: mutateToday } = useSWR<TodayPower>(
    POWER_TODAY_API,
    async (url) => {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('today power fetch failed');
      return res.json();
    },
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
  );

  const { data: monthPower, mutate: mutateMonth } = useSWR<MonthPower[]>(
    POWER_MONTH_API,
    async (url) => {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('month power fetch failed');
      return res.json();
    },
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
  );
// 🔔 월별 전력량: 매일 0시 10분 이후 최초 1번만 자동 갱신
  const lastMonthRefreshRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timer = setInterval(() => {
      const now = new Date();

      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${d}`;

      // 0시 10분 이후 & 오늘 아직 갱신 안 했으면 한 번만 실행
      if (
        now.getHours() === 0 &&
        now.getMinutes() >= 10 &&
        lastMonthRefreshRef.current !== todayStr
      ) {
        console.info('[CELL] auto month power refresh at 00:10', todayStr);
        mutateMonth();
        lastMonthRefreshRef.current = todayStr;
      }
    }, 60_000); // 1분마다 체크

    return () => clearInterval(timer);
  }, [mutateMonth]);
  // 1) CELL 목록 로딩 (초기 전체 리스트)
  const { data, error, mutate } = useSWR<MonitoringItem[]>(LIST_API, fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  });

  // 🔹 실제 화면에 사용할 아이템 목록 (SSE delta 반영용)
  const [items, setItems] = useState<MonitoringItem[] | null>(null);

  // SWR data 변경 시 한 번 동기화
  useEffect(() => {
    if (data) {
      setItems(data);
    }
  }, [data]);

  const effectiveData = items ?? data ?? [];
  const loading = !effectiveData.length && !error;

  // ✅ 장비별 RESET 상태
  const [resetTargets, setResetTargets] = useState<Record<string, ResetMode>>(
    {},
  );

  // ✅ 이전 장비 스냅샷 시그니처
  const lastGroupSignRef = useRef<Record<string, string>>({});

  // 2) SSE – DELTA 받아서 items merge, 전력량은 mutate로 재조회
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let es: EventSource | null = null;
    let retryTimer: number | null = null;

    const connect = () => {
      if (es) {
        es.close();
        es = null;
      }

      console.info('[CELL SSE] connecting:', SSE_URL);
      es = new EventSource(SSE_URL);

      es.onopen = () => {
        console.info('[CELL SSE] connected:', SSE_URL);

        // 🔥 서버 재시작 후 다시 붙었을 때
        // - CELLS 전체 리스트 재조회
        // - 오늘 전력량 재조회
        mutate();
        mutateToday();

        if (retryTimer) {
          clearTimeout(retryTimer);
          retryTimer = null;
        }
      };

      es.onmessage = (e) => {
        const dataText = e.data;
        if (!dataText) return;

        const trimmed = dataText.trim();

        // JSON 이 아닌 단순 문자열 이벤트(alarm-updated:CELL 등)
        if (!isJsonString(trimmed)) {
          console.debug('[CELL SSE] non-JSON message:', trimmed);

          // 예: "alarm-updated:CELL" 형태면 CELL 관련으로 판단
          if (trimmed.endsWith(':CELL')) {
            mutate();
            mutateToday();   // ✅ 오늘 전력량만 갱신
          }
          return;
        }

        try {
          const payload = JSON.parse(trimmed);
          console.debug('[CELL SSE] payload:', payload);

          // 1) 배열 형태 전체 리스트
          if (Array.isArray(payload)) {
            setItems(payload as MonitoringItem[]);
            mutateToday();   // ✅ here도 today만
            return;
          }

          // 2) DELTA 래퍼 형태: { kind, type, items: [...] }
          if (payload && Array.isArray(payload.items)) {
            const typeFieldRaw =
              typeof payload.type === 'string'
                ? payload.type
                : typeof payload.Type === 'string'
                  ? payload.Type
                  : null;
            const msgType = typeFieldRaw ? typeFieldRaw.toUpperCase() : null;

            if (msgType && msgType !== 'CELL') {
              console.debug('[CELL SSE] ignore delta for type:', msgType);
              return;
            }

            const deltaItems = payload.items as MonitoringItem[];

            setItems((prev) => {
              if (!prev || !prev.length) {
                return deltaItems;
              }

              const map = new Map<string, MonitoringItem>();
              for (const ch of prev) {
                map.set(cellItemKey(ch), ch);
              }
              for (const ch of deltaItems) {
                map.set(cellItemKey(ch), ch);
              }
              return Array.from(map.values());
            });

            mutateToday();   // ✅ today만
            return;
          }

          // 3) 나머지 JSON 구조 → CELL 관련이면 전체 재조회
          const typeField =
            typeof payload.Type === 'string'
              ? payload.Type.toUpperCase()
              : typeof payload.type === 'string'
                ? payload.type.toUpperCase()
                : null;

          if (!typeField || typeField === 'CELL') {
            console.debug('[CELL SSE] unsupported JSON shape → mutate():', payload);
            mutate();
            mutateToday();   // ✅ today만
          } else {
            console.debug(
              '[CELL SSE] unsupported JSON but type is not CELL, ignore:',
              typeField,
            );
          }
        } catch (err) {
          console.error(
            '[CELL SSE] JSON parse error → mutate() fallback:',
            err,
            dataText,
          );
          mutate();
          mutateToday();     // ✅ today만
        }
      };

      es.onerror = (err) => {
        console.error('[CELL SSE] error → will retry in 5s', err);

        if (es) {
          es.close();
          es = null;
        }

        if (!retryTimer) {
          retryTimer = window.setTimeout(() => {
            connect();
          }, 5000);
        }
      };
    };

    connect();

    return () => {
      console.info('[CELL SSE] cleanup');
      if (es) es.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [mutate, mutateToday]);   // ✅ mutateMonth는 여기서 안 건드림


  // 3) 검색
  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);

  // ===============================
  // 4) 장비 단위 그룹핑
  // ===============================
  const equipGroups: EquipGroup[] = useMemo(() => {
    if (!effectiveData.length) return [];

    // ✅ PACK 처럼 좌표 기준 최신 데이터만 남기기
   // const src = normalizeByCoordinate(effectiveData);
    const src = effectiveData;
    const map = new Map<string, EquipGroup>();

    for (const ch of src) {
      const eqpid = (ch.eqpid || ch.title || '').trim();
      if (!eqpid) continue;

      const cIndex =
        typeof ch.chamberIndex === 'number' && ch.chamberIndex > 0
          ? ch.chamberIndex
          : 1;

      const key = `${eqpid}_${cIndex}`;
      let g = map.get(key);
      if (!g) {
        g = {
          key,
          title: eqpid,
          eqpid,
          chamberIndex: cIndex,
          channels: [],
        };
        map.set(key, g);
      }
      g.channels.push(ch);
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.eqpid === b.eqpid) return a.chamberIndex - b.chamberIndex;
      return a.eqpid.localeCompare(b.eqpid);
    });
  }, [effectiveData]);

  // ✅ equipGroups 변경 시, 값이 실제로 바뀐 장비만 RESET 해제
  useEffect(() => {
    if (!equipGroups.length) return;

    const newSigns: Record<string, string> = {};
    const changedKeys: string[] = [];

    for (const g of equipGroups) {
      const key = groupKeyOf(g.eqpid, g.chamberIndex);
      const sig = buildGroupSignature(g);
      newSigns[key] = sig;

      const oldSig = lastGroupSignRef.current[key];
      if (oldSig && oldSig !== sig) {
        changedKeys.push(key);
      }
    }

    if (changedKeys.length) {
      setResetTargets((prev) => {
        const next = { ...prev };
        for (const k of changedKeys) {
          delete next[k];
        }
        return next;
      });
    }

    lastGroupSignRef.current = newSigns;
  }, [equipGroups]);

  // ===============================
  // 5) 그룹 → UI ListItem 매핑
  // ===============================
  const uiList: ListItem[] = useMemo(() => {
    const keys = searchKeywords
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    const hasSearch = keys.length > 0;

    return equipGroups.map<ListItem>((group, groupIdx) => {
      const title = group.title;
      const eqpidLower = title.toLowerCase();

      const sampleNames = group.channels
        .map((ch) => (ch.batteryId ?? '').toLowerCase())
        .filter(Boolean);

      const testNames = group.channels
        .map((ch) => (ch.testName ?? '').toLowerCase())
        .filter(Boolean);

      const match =
        hasSearch &&
        keys.some(
          (kw) =>
            eqpidLower.includes(kw) ||
            sampleNames.some((s) => s.includes(kw)) ||
            testNames.some((t) => t.includes(kw)),
        );

      const withChamber = group.channels.find(
        (c) => (c.temp && c.temp !== '-') || c.chamberStatus,
      );
      const rep = withChamber ?? group.channels[0];

      let runCnt = 0;
      let alarmCnt = 0;
      let completeCnt = 0;
      let readyCnt = 0;
      let stopCnt = 0;
      let idleCnt = 0;

      const channelModes = group.channels.map((ch) => {
        const mode = getChannelMode(ch);
        switch (mode) {
          case 'run':
            runCnt++;
            break;
          case 'alarm':
            alarmCnt++;
            break;
          case 'complete':
            completeCnt++;
            break;
          case 'ready':
            readyCnt++;
            break;
          case 'stop':
            stopCnt++;
            break;
          case 'idle':
            idleCnt++;
            break;
        }
        return { ch, mode };
      });

      const anyAlarm = alarmCnt > 0;
      const anyStop = stopCnt > 0;
      const anyRun = runCnt > 0;
      const anyComplete = completeCnt > 0;
      const anyReady = readyCnt > 0;
      const totalChannels = group.channels.length || 1;
      const allComplete = completeCnt === totalChannels;



      const groupHasAlarms = group.channels.some((ch) => {
        if (typeof ch.alarmCount === 'number') {
          return ch.alarmCount > 0;
        }
        if (typeof ch.hasAlarms === 'boolean') {
          return ch.hasAlarms;
        }
        return false;
      });

      let ready = false;
      let shutdown = false;
      let icon: ListItem['icon'] = 'stay';
      let operation: ListItem['operation'] = 'available';

      console.log("status => totalChannels" + totalChannels);
      console.log("status => allComplete" + allComplete);


      if (anyAlarm || anyStop) {
        operation = 'stop';
        icon = 'error';

        if (anyAlarm && groupHasAlarms) {
          shutdown = true;
        } else {
          shutdown = false;
        }
      } else if (anyRun) {
        operation = 'ongoing';
        icon = 'success';

        if (anyComplete) {
          shutdown = true;
        } else {
          shutdown = false;
        }
      } else if (allComplete) {
        operation = 'completion';
        icon = 'stay';
        shutdown = false;
      } else if (anyReady && !anyRun && !anyAlarm && !anyComplete && !anyStop) {
        operation = 'available';
        ready = false;
        icon = 'stay';
        shutdown = false;
      } else {
        operation = 'available';
        icon = 'success';
        shutdown = false;
      }

      const gKey = groupKeyOf(group.eqpid, group.chamberIndex);
      const resetMode = resetTargets[gKey];

      let finalOperation = operation;
      let finalShutdown = shutdown;

      if (resetMode === 'clear-blink' && shutdown) {
        finalShutdown = false;
      }

      if (resetMode === 'complete-to-available' && operation === 'completion') {
        finalOperation = 'available';
      }

      const [curTempRaw, setTempRaw] = splitTemp(rep.temp);
      const temp1 = formatTemp(curTempRaw);
      const temp2 = formatTemp(setTempRaw);

      const memoText = channelModes.map(({ ch }) => {
        const ms = toMemoStatus(ch);
        const statusTextMap: Record<MemoStatus, string> = {
          ongoing: '진행중',
          stop: '정지',
          completion: '완료',
          available: '사용가능',
        };

        const cellTempSuffix = ch.cellTemp ? ` (${ch.cellTemp})` : '';

        return {
          ch: `CH${ch.channelIndex ?? ''}`,
          status: ms,
          statusText: statusTextMap[ms],
          text: ch.batteryId ?? '-',
          text2: `${ch.testName ?? '-'}${cellTempSuffix}`,
        };
      });

      let memoTotal = '';
      const fromServer = rep.memoText;
      if (typeof fromServer === 'string') {
        memoTotal = fromServer;
      } else if (Array.isArray(fromServer) && fromServer.length > 0) {
        memoTotal = String(fromServer[0]);
      }

      const memoChannelIndex = group.chamberIndex || 1;

      return {
        id: group.channels[0]?.id ?? groupIdx,
        x: group.channels[0]?.x ?? 0,
        y: group.channels[0]?.y ?? 0,
        title,
        check: match,
        ready,
        shutdown: finalShutdown,
        operation: finalOperation,
        icon,
        temp1,
        temp2,
        ch1: runCnt,
        ch2: alarmCnt + stopCnt,
        ch3: completeCnt + idleCnt + readyCnt,
        memo: !!memoText.length,
        memoText,
        memoTotal,
        eqpid: title,
        channelIndex: memoChannelIndex,
      };
    });
  }, [equipGroups, searchKeywords, resetTargets]);

  // ===============================
  // 6) 상단 차트용 집계 + 전력량 스케일링(W/kW/MW)
  // ===============================
  const {
    runningChart,
    opDistChart,
    status4Chart,
    todayChart,
    monthChart,
    stepChart,          // ✅ 추가
  } = useMemo(() => {
    // ---------------------------
    // (1) 장비 가동률 / 상태
    // ---------------------------
    let runningChart = { total: 0, running: 0 };
    let opDistChart: { name: string; value: number }[] = [];
    let status4Chart: { name: string; value: number }[] = [];
    let stepChart: { name: string; value: number }[] = [];   // ✅ 추가

    if (equipGroups.length) {
      const totalEquip = equipGroups.length;
      let runningEquip = 0;

      for (const g of equipGroups) {
        const modes = g.channels.map(getChannelMode);
        const anyAlarm = modes.includes('alarm');
        const anyRun = modes.includes('run');
        const allComplete =
          modes.length > 0 && modes.every((m) => m === 'complete');

        if (!anyAlarm && anyRun && !allComplete) {
          runningEquip++;
        }
      }

      const allChannels = equipGroups.flatMap((g) => g.channels);

      // 🔹 운전모드 분포
      const opBuckets: Record<string, number> = {
        Charge: 0,
        Discharge: 0,
        Rest: 0,
        'Rest(ISO)': 0,
        Pattern: 0,
        Chargemap: 0,
      };

      for (const ch of allChannels) {
        const op = (ch.operation || '').toLowerCase();
        let key: keyof typeof opBuckets | null = null;

        switch (op) {
          case 'charge':
            key = 'Charge';
            break;
          case 'discharge':
            key = 'Discharge';
            break;
          case 'rest':
            key = 'Rest';
            break;
          case 'rest-iso':
            key = 'Rest(ISO)';
            break;
          case 'pattern':
            key = 'Pattern';
            break;
          case 'chargemap':
            key = 'Chargemap';
            break;
          default:
            key = null;
        }

        if (key) {
          opBuckets[key] += 1;
        }
      }

      opDistChart = Object.entries(opBuckets).map(([name, value]) => ({
        name,
        value,
      }));

      // 🔹 상태 4분류 분포
      const statusBuckets: Record<'대기' | '진행중' | '일시정지' | '알람', number> =
        {
          대기: 0,
          진행중: 0,
          일시정지: 0,
          알람: 0,
        };

      for (const ch of allChannels) {
        const mode = getChannelMode(ch);
        switch (mode) {
          case 'run':
            statusBuckets['진행중'] += 1;
            break;
          case 'stop':
            statusBuckets['일시정지'] += 1;
            break;
          case 'alarm':
            statusBuckets['알람'] += 1;
            break;
          case 'ready':
          case 'complete':
          case 'idle':
          default:
            statusBuckets['대기'] += 1;
            break;
        }
      }

      status4Chart = Object.entries(statusBuckets).map(([name, value]) => ({
        name,
        value,
      }));

      runningChart = { total: totalEquip, running: runningEquip };

      // 🔹 NEW: stepName 분포 → 상위 6개
      const stepBuckets: Record<string, number> = {};

      for (const ch of allChannels) {
        // stepName 우선, 없으면 step 사용 (fallback)
        const raw = (ch.stepName ?? ch.step ?? '').trim();
        if (!raw) continue;

        const name = raw; // 필요하면 여기서 포맷팅 가능
        stepBuckets[name] = (stepBuckets[name] ?? 0) + 1;
      }

      const sortedSteps = Object.entries(stepBuckets).sort(
        (a, b) => b[1] - a[1],
      );

      const TOP_N = 6;
      stepChart = sortedSteps.slice(0, TOP_N).map(([name, value]) => ({
        name,
        value,
      }));
    }

    // ---------------------------
    // (2) 오늘 전력량 스케일링
    // ---------------------------
    const todayChargeRaw = todayPower?.charge ?? 0;
    const todayDisRaw = Math.abs(todayPower?.discharge ?? 0);

    const maxTodayAbs = Math.max(
      Math.abs(todayChargeRaw),
      Math.abs(todayDisRaw),
    );

    const { unit: todayUnit } = scalePower(maxTodayAbs || 0);

    const todayDivisor =
      todayUnit === 'MW' ? 1_000_000 : todayUnit === 'kW' ? 1_000 : 1;

    const todayData = [
      {
        name: '방전',
        value: Number((todayDisRaw / todayDivisor).toFixed(1)),
      },
      {
        name: '충전',
        value: Number((todayChargeRaw / todayDivisor).toFixed(1)),
      },
    ];

    // ---------------------------
    // (3) 월별 전력량 스케일링
    // ---------------------------
    const monthRows = Array.isArray(monthPower) ? monthPower : [];
    let maxMonthAbs = 0;

    for (const row of monthRows) {
      const c = row.charge ?? 0;
      const d = Math.abs(row.discharge ?? 0);
      const localMax = Math.max(Math.abs(c), Math.abs(d));
      if (localMax > maxMonthAbs) maxMonthAbs = localMax;
    }

    const { unit: monthUnit } = scalePower(maxMonthAbs || 0);
    const monthDivisor =
      monthUnit === 'MW' ? 1_000_000 : monthUnit === 'kW' ? 1_000 : 1;

    const monthData = monthRows.map((row) => ({
      name: row.month ?? '-',
      charge: Number(((row.charge ?? 0) / monthDivisor).toFixed(1)),
      discharge: Number(
        (Math.abs(row.discharge ?? 0) / monthDivisor).toFixed(1),
      ),
    }));

    return {
      runningChart,
      opDistChart,
      status4Chart,
      todayChart: {
        data: todayData,
        unit: todayUnit as PowerUnit,
      },
      monthChart: {
        data: monthData,
        unit: monthUnit as PowerUnit,
      },
      stepChart,   // ✅ 추가
    };
  }, [equipGroups, todayPower, monthPower]);

  // 최초 1회 List 강제 리렌더
  useEffect(() => {
    if (hasForcedListRenderRef.current) return;
    if (loading || !uiList || uiList.length === 0) return;

    hasForcedListRenderRef.current = true;

    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        setListRenderToken((prev) => prev + 1);
      });
    } else {
      setListRenderToken((prev) => prev + 1);
    }
  }, [loading, uiList]);

  // chart zoom
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // card zoom
  const [isZoomOpen2, setIsZoomOpen2] = useState(false);

  // ===============================
  // 7) 렌더링
  // ===============================
  return (
    <>
      {/* --- topState Section --- */}
      <section className="topState">
        <h2 className="ir">상단 기능 화면</h2>
        <div className="left">
          <ChartRunning
            title="장비가동률"
            total={runningChart.total}
            running={runningChart.running}
          />
          <ChartState title="장비현황" data={stepChart} />
          <ChartOperation title="장비가동현황" data={status4Chart} />
          <Button className="btnZoom" onClick={() => setIsZoomOpen(true)}>
            확대보기
          </Button>
        </div>
        <div className="center">
          <TopStateCenter equipType="CELL" />
        </div>
        <div className="right">
          <ChartToday
            title="오늘 전력량"
            data={todayChart.data}
            unit={todayChart.unit}
          />
          <ul className="legend">
            <li className="charge">충전</li>
            <li>방전</li>
          </ul>
          <ChartMonth
            title="월별 전력량"
            data={monthChart.data}
            unit={monthChart.unit}
          />
        </div>
      </section>

      {/* --- topFilter Section --- */}
      <section className="topFilter">
        <div className="left">
          <PageTitle title="CELL 상세" icon={titleIcon} />
          <Button className="btnZoom" onClick={() => setIsZoomOpen2(true)}>
            확대보기
          </Button>
          <SearchArea onSearchChange={setSearchKeywords} />
        </div>
        <div className="right">
          <ColorChipType2
            onReset={() => {
              const next: Record<string, ResetMode> = {};

              for (const g of equipGroups) {
                const modes = g.channels.map(getChannelMode);
                let runCnt = 0;
                let alarmCnt = 0;
                let stopCnt = 0;
                let completeCnt = 0;

                for (const m of modes) {
                  if (m === 'run') runCnt++;
                  else if (m === 'alarm') alarmCnt++;
                  else if (m === 'stop') stopCnt++;
                  else if (m === 'complete') completeCnt++;
                }

                const anyAlarm = alarmCnt > 0;
                const anyRun = runCnt > 0;
                const totalChannels = g.channels.length || 1;
                const allComplete = completeCnt === totalChannels;




                const blinkNonAlarm =
                  !anyAlarm && anyRun && completeCnt > 0 && !allComplete;

                const k = groupKeyOf(g.eqpid, g.chamberIndex);

                if (allComplete) {
                  next[k] = 'complete-to-available';
                } else if (blinkNonAlarm) {
                  next[k] = 'clear-blink';
                }
              }

              setResetTargets(next);
            }}
          />
        </div>
      </section>

      {/* --- monitoring Section --- */}
      <section className="monitoring type2">
        <h2 className="ir">모니터링 화면</h2>
        <div className="innerWrapper">
          {loading && <div className="loading">불러오는 중…</div>}
          {error && <div className="error">목록을 불러오지 못했습니다.</div>}
          {uiList && (
            <List2
              key={listRenderToken}
              listData={uiList}
              canEditMemo={canEditMemo}

              onResetByDetail={(item) => {
                if (!item.eqpid) return;
                const chamberIndex = item.channelIndex ?? 1;
                const key = groupKeyOf(item.eqpid, chamberIndex);

                setResetTargets((prev) => {
                  const next = { ...prev };

                  if (item.operation === 'completion') {
                    next[key] = 'complete-to-available';
                  } else if (item.shutdown && item.operation !== 'stop') {
                    next[key] = 'clear-blink';
                  }

                  return next;
                });
              }}
            />
          )}
        </div>
      </section>

      {/* chart zoom dialog */}
      <Dialog
        className="dialogCont wide"
        open={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
      >
        <div className="modalWrapper chartZoom">
          <DialogTitle className="tit">
            <span></span>
            <IconButton className="btnClose" onClick={() => setIsZoomOpen(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent className="contents">
            <div className="topState">
              <div className="left">
                <ChartRunning
                  title="장비가동률"
                  total={runningChart.total}
                  running={runningChart.running}
                />
                <ChartState2 title="장비현황" data={stepChart} />
                <ChartOperation title="장비가동현황" data={status4Chart} />
              </div>
            </div>
          </DialogContent>
        </div>
      </Dialog>

      {/* card zoom dialog */}
      <Dialog
        className="dialogCont full"
        open={isZoomOpen2}
        onClose={() => setIsZoomOpen2(false)}
      >
        <div className="modalWrapper chartZoom">
          <DialogTitle className="tit">
            <span></span>
            <IconButton className="btnClose" onClick={() => setIsZoomOpen2(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent className="contents">
            <section className="topFilter">
              <div className="left">
                <PageTitle title="장비상세" icon={titleIcon} />
              </div>
              <div className="right">
                <ColorChipType2 />
              </div>
            </section>

            {/* monitoring */}
            <section className="monitoring type2">
              <h2 className="ir">모니터링 화면</h2>
              <div className="innerWrapper">
                <List2
                  key={listRenderToken}
                  listData={uiList}
                  canEditMemo={canEditMemo}

                  onResetByDetail={(item) => {
                    if (!item.eqpid) return;
                    const chamberIndex = item.channelIndex ?? 1;
                    const key = groupKeyOf(item.eqpid, chamberIndex);

                    setResetTargets((prev) => {
                      const next = { ...prev };

                      if (item.operation === 'completion') {
                        next[key] = 'complete-to-available';
                      } else if (item.shutdown && item.operation !== 'stop') {
                        next[key] = 'clear-blink';
                      }

                      return next;
                    });
                  }}
                />
              </div>
            </section>
          </DialogContent>
        </div>
      </Dialog>
    </>
  );
}

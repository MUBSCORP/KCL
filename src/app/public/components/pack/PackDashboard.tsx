'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { PowerUnit, detectPowerUnit, scaleByUnit } from '@/utils/powerUnit';
import { useAuthStore } from '@/store/auth.store';


// ===============================
// 타입 정의
// ===============================
export type MonitoringItem = {
  id: number;
  title: string;
  check: boolean;
  schedule: string;
  testName?: string;
  memo: boolean;
  memoText: string;
  operation: string;      // charge / discharge / rest ...
  status: string;         // run / alarm / pause / ...
  statusLabel: string;    // 대기 / 진행중 / 일시정지 / 알람
  voltage: string;
  current: string;
  power: string;
  step: string;
  stepName?: string;
  cycle: string;
  rly: string;
  dgv?: string;
  chamber?: string;
  temp: string;
  humidity: string;
  cycles: number;
  activeCycles: number;
  time: string;
  x: number;
  y: number;
  // 🔹 Measure.CycleCount 대신 Step 기반 표시
  stepNo?: number;       // ← Info.StepNo
  totalSteps?: number;   // ← Info.TotalStepCount
  eqpid: string;
  channelIndex?: number;
  chamberIndex?: number;
  shutdown?: boolean;
  powerOn?: boolean;
  rawStatus?: string;
  // 🔹 알람 존재 여부(백엔드에서 내려주면 사용)
  alarmCount?: number;
  hasAlarms?: boolean;
  cycleCount?: number;
};

// 🔹 PACK UI용 모드 (CELL과 동일 컨셉)
type ChannelMode = 'run' | 'stop' | 'alarm' | 'complete' | 'ready' | 'idle';
type UiOperation = 'available' | 'ongoing' | 'stop' | 'completion' | 'Power sharing';

type ResetMode = 'clear-blink' | 'complete-to-available';

// 🔹 장비(그룹) 키: eqpid + chamberIndex
const groupKeyOf = (eqpid: string, chamberIndex: number) =>
  `${eqpid}__${chamberIndex || 1}`;


// ✅ 채널 신선도(freshness) 계산: time → id 순으로 사용
function getFreshnessScore(ch: MonitoringItem): number {
  // 1) time 문자열 먼저 시도
  if (ch.time) {
    const ts = Date.parse(ch.time);
    if (!Number.isNaN(ts)) {
      return ts; // ms since epoch
    }
  }

  // 2) time 파싱 실패 시 id 사용 (id 가 클수록 최근이라고 가정)
  if (typeof ch.id === 'number' && Number.isFinite(ch.id)) {
    return ch.id;
  }

  // 3) 둘 다 없으면 가장 오래된 것으로 간주
  return 0;
}

// ✅ 같은 (x,y) 좌표에 여러 PACK 카드가 오면 "신선도가 더 높은 것"만 남기기
function normalizeByCoordinate(list: MonitoringItem[]): MonitoringItem[] {
  console.log('[PACK] normalizeByCoordinate IN', list.length);

  const result: MonitoringItem[] = [];
  const coordIndex = new Map<string, number>();

  for (const ch of list) {
    const xRaw = (ch as any).x;
    const yRaw = (ch as any).y;
    const xNum = Number(xRaw);
    const yNum = Number(yRaw);

    // 🔍 1) 들어오는 원본 타입/값 확인
    console.log(
      '[PACK] ch eqpid=', ch.eqpid,
      ' chamberIndex=', ch.chamberIndex,
      ' xRaw=', xRaw,
      ' yRaw=', yRaw,
      ' xNum=', xNum,
      ' yNum=', yNum,
      ' time=', ch.time,
      ' id=', ch.id,
    );

    // 좌표가 없거나 0 이하이면 좌표 중복 체크 없이 그냥 추가
    if (!Number.isFinite(xNum) || !Number.isFinite(yNum) || xNum <= 0 || yNum <= 0) {
      console.log('[PACK]  → 좌표 없음/유효하지 않음 → 그냥 추가');
      result.push(ch);
      continue;
    }

    const key = `${xNum}_${yNum}`;
    const existingIdx = coordIndex.get(key);

    if (existingIdx !== undefined) {
      const prev = result[existingIdx];
      const prevScore = getFreshnessScore(prev);
      const currScore = getFreshnessScore(ch);

      console.log(
        '[PACK]  → 좌표 중복 발견 key=',
        key,
        ' 기존=', prev.eqpid, '/', prev.chamberIndex,
        ' (score=', prevScore, ')',
        ' 새=', ch.eqpid, '/', ch.chamberIndex,
        ' (score=', currScore, ')',
      );

      // ✅ 신선도 높은 쪽만 남기기 (동점이면 새 데이터 우선)
      if (currScore >= prevScore) {
        console.log('[PACK]     → 새 데이터가 더 최신 → 덮어쓰기');
        result[existingIdx] = ch;
      } else {
        console.log('[PACK]     → 기존 데이터가 더 최신 → 무시');
      }
    } else {
      console.log('[PACK]  → 좌표 최초 key=', key, ' 인덱스=', result.length);
      coordIndex.set(key, result.length);
      result.push(ch);
    }
  }

  console.log(
    '[PACK] normalizeByCoordinate OUT',
    result.length,
    result.map((c) => `${c.eqpid}/${c.chamberIndex}@${c.x}_${c.y} (time=${c.time}, id=${c.id})`),
  );
  return result;
}


// ===============================
// 통신 도구
// ===============================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE ?? '';

const LIST_API = `${API_BASE_URL}/api/monitoring/PACK/list`;
const SSE_URL = `${API_BASE_URL}/api/monitoring/sse/telemetry`;

const TODAY_POWER_API = `${API_BASE_URL}/api/power/today?type=PACK`;
const MONTH_POWER_API = `${API_BASE_URL}/api/power/month?type=PACK`;

const fetcher = async (path: string) => {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
};

// ===============================
// 퍼블 경로
// ===============================
import ChartRunning from '@/app/public/components/modules/topState/ChartRunning';
import ChartState from '@/app/public/components/modules/topState/ChartState';
import ChartState2 from '@/app/public/components/modules/topState/ChartState2';
import ChartOperation from '@/app/public/components/modules/topState/ChartOperation';
import ChartToday from '@/app/public/components/modules/topState/ChartToday';
import ChartMonth from '@/app/public/components/modules/topState/ChartMonth';
import TopStateCenter from '@/app/public/components/modules/topState/TopStateCenter';

import ColorChip from '@/app/public/components/modules/topFilter/ColorChip';
import ColorChip2 from '@/app/public/components/modules/topFilter/ColorChip2';
import SearchArea from '@/app/public/components/modules/topFilter/SearchArea';
import PageTitle from '@/app/public/components/modules/PageTitle';
import titleIcon from '@/assets/images/icon/detail.png';

import List from '@/app/public/components/modules/monitoring/List';

import { Dialog, DialogTitle, DialogContent, IconButton, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// ===============================
// 상태 유틸: PACK 채널 → 모드 (CELL 과 동일 구조)
// ===============================

// step 문자열에서 "(end ok)" 같은 raw step 추출
function extractRawStatusFromStep(step?: string | null): string {
  if (!step) return '';
  const open = step.indexOf('(');
  const close = step.lastIndexOf(')');
  if (open < 0 || close < 0 || close <= open) return '';
  return step.slice(open + 1, close).trim();
}

// 🔹 Status 매핑 테이블 (소문자 기준) – CELL 과 동일
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
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

// ✅ PACK 채널 모드 – CELL 의 getChannelMode 와 동일한 패턴
function getPackMode(ch: MonitoringItem): ChannelMode {
  const rawStep = normalizeStatusName(extractRawStatusFromStep(ch.step));
  const rawStatus = normalizeStatusName(ch.rawStatus);

  // 1) step 기준 완료
  if (rawStep && COMPLETE_STEP_LIST.includes(rawStep)) {
    return 'complete';
  }

  // 2) rawStatus 기준 완료 (End OK / End NG / User termination)
  if (rawStatus && COMPLETE_STEP_LIST.includes(rawStatus)) {
    return 'complete';
  }

  // 3) Info.Status(rawStatus) 기반 run/stop/alarm/ready
  if (rawStatus) {
    if (RUN_STATUS_LIST.includes(rawStatus)) return 'run';
    if (STOP_STATUS_LIST.includes(rawStatus)) return 'stop';
    if (ALARM_STATUS_LIST.includes(rawStatus)) return 'alarm';
    if (rawStatus === 'ready') return 'ready';
  }

  // 4) fallback – status / statusLabel
  const s = normalizeStatusName(ch.status);
  const label = ch.statusLabel?.trim();

  if (s === 'alarm' || label === '알람') return 'alarm';
  if (s === 'pause' || label === '일시정지') return 'stop';
  if (s === 'run' || s === 'ongoing' || label === '진행중') return 'run';

  if (label?.includes('완료') || s === 'complete') return 'complete';

  if (s === 'rest' || label === '대기') return 'ready';

  return 'idle';
}

// 🔹 셀과 동일하게, “그룹(장비) 상태를 한 번에 계산”하는 유틸
function calcGroupState(channels: MonitoringItem[]): {
  uiOperation: UiOperation;
  uiShutdown: boolean;
  groupHasAlarms: boolean;
} {
  const modes = channels.map(getPackMode);

  let runCnt = 0;
  let alarmCnt = 0;
  let stopCnt = 0;
  let completeCnt = 0;
  let readyCnt = 0;

  for (const m of modes) {
    if (m === 'run') runCnt++;
    else if (m === 'alarm') alarmCnt++;
    else if (m === 'stop') stopCnt++;
    else if (m === 'complete') completeCnt++;
    else if (m === 'ready') readyCnt++;
  }

  const totalChannels = channels.length || 1;
  const anyRun = runCnt > 0;
  const anyAlarmMode = alarmCnt > 0;
  const anyStopMode = stopCnt > 0;
  const allComplete = completeCnt === totalChannels;

  // 🔴 알람 판단은 mode + alarmCount/hasAlarms 모두 고려
  const groupHasAlarms = channels.some((ch) => {
    const mode = getPackMode(ch);
    if (mode === 'alarm') return true;
    if (typeof ch.alarmCount === 'number' && ch.alarmCount > 0) return true;
    if (typeof ch.hasAlarms === 'boolean' && ch.hasAlarms) return true;
    return false;
  });

  let uiOperation: UiOperation = 'available';
  let uiShutdown = false;

  if (groupHasAlarms) {
    uiOperation = 'stop';
    uiShutdown = true;
  } else if (anyStopMode) {
    uiOperation = 'stop';
    uiShutdown = false;
  } else if (anyRun && !allComplete) {
    uiOperation = 'ongoing';
    uiShutdown = false;
  } else if (allComplete) {
    uiOperation = 'completion';
    uiShutdown = false;
  } else if (readyCnt > 0 && !anyRun && !anyAlarmMode && !anyStopMode && !allComplete) {
    uiOperation = 'available';
    uiShutdown = false;
  } else {
    uiOperation = 'available';
    uiShutdown = false;
  }

  return { uiOperation, uiShutdown, groupHasAlarms };
}

// ===============================
// PACK 장비 그룹 타입 (eqpid + chamberIndex 기준)
// ===============================
type EquipGroup = {
  key: string;           // eqpid_chamberIndex
  title: string;         // eqpid
  eqpid: string;
  chamberIndex: number;
  channels: MonitoringItem[];
};

export default function DashboardPack() {

  // 🔐 로그인/권한 정보
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const isLoggedIn = !!token && !!user;
  const mgtIdx = user?.mgtIdx;


  // 🔑 메모 편집 권한: "로그인 + mgtIdx !== 4" 인 사람만 허용
  const canEditMemo = isLoggedIn && mgtIdx !== 4;

  // 🔹 List 강제 리렌더용 토큰 (최초 1회)
  const [listRenderToken, setListRenderToken] = useState(0);
  const hasForcedListRenderRef = useRef(false);

  const [resetTargets, setResetTargets] = useState<Record<string, ResetMode>>(
    {},
  );

  // ===============================
  // 1) 장비 목록 로딩 (채널 단위)
  // ===============================
  const { data: listData, error, mutate } = useSWR<MonitoringItem[]>(
    LIST_API,
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
  );
  const loading = !listData && !error;

  // ===============================
  // 6) 전력량 API 연동 (오늘 / 월)
  // ===============================
  const { data: todayPower, mutate: mutateToday } = useSWR(
    TODAY_POWER_API,
    async (url: string) => {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
  );

  // 월별 전력량은 페이지 진입 시 1회만 호출
  const { data: monthPower, mutate: mutateMonth } = useSWR(
    MONTH_POWER_API,
    async (url: string) => {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
  );

  // 🔥 오늘/월 전력량 → W/kW/MW 단위 스케일링
  const {
    todayChart,
    monthChart,
    todayUnit,
    monthUnit,
  } = useMemo(() => {
    const rawTodayDischarge = Math.abs(todayPower?.discharge ?? 0);
    const rawTodayCharge = todayPower?.charge ?? 0;

    const monthIsArray = Array.isArray(monthPower);
    const rawMonthChargeList = monthIsArray
      ? (monthPower as any[]).map((row) => row.charge ?? 0)
      : [];
    const rawMonthDischargeList = monthIsArray
      ? (monthPower as any[]).map((row) => Math.abs(row.discharge ?? 0))
      : [];

    // 오늘 단위 결정
    const todayValues = [rawTodayDischarge, rawTodayCharge];
    const todayUnit: PowerUnit = detectPowerUnit(todayValues);

    const todayChart = [
      {
        name: '방전',
        value: scaleByUnit(rawTodayDischarge, todayUnit),
      },
      {
        name: '충전',
        value: scaleByUnit(rawTodayCharge, todayUnit),
      },
    ];

    // 월 단위 결정
    const monthValues = [...rawMonthChargeList, ...rawMonthDischargeList];
    const monthUnit: PowerUnit = detectPowerUnit(
      monthValues.length ? monthValues : [0],
    );

    const monthChart = monthIsArray
      ? (monthPower as any[]).map((row, idx) => ({
        name: row.inputdate ?? row.month ?? '-', // 백엔드 필드명에 맞게 조정
        charge: scaleByUnit(rawMonthChargeList[idx], monthUnit),
        discharge: scaleByUnit(rawMonthDischargeList[idx], monthUnit),
      }))
      : [];

    return { todayChart, monthChart, todayUnit, monthUnit };
  }, [todayPower, monthPower]);

  // ⏰ 월별 전력량: 매일 0시 10분 이후 최초 1번만 자동 갱신
  const lastMonthRefreshRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timer = setInterval(() => {
      const now = new Date();

      // 로컬 날짜 yyyy-mm-dd
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${d}`;

      // 0시 10분 이후 & 아직 오늘은 한 번도 새로고침 안 했을 때
      if (
        now.getHours() === 0 &&
        now.getMinutes() >= 10 &&
        lastMonthRefreshRef.current !== todayStr
      ) {
        console.info('[PACK] auto month power refresh at 00:10', todayStr);
        mutateMonth();                    // ✅ 월별 전력량 다시 가져오기
        lastMonthRefreshRef.current = todayStr;
      }
    }, 60_000); // 1분마다 체크

    return () => clearInterval(timer);
  }, [mutateMonth]);

  // ===============================
  // 2) SSE: 갱신 트리거 (PACK은 SSE 올 때만 재조회)
  // ===============================
  // ===============================
// 2) SSE: 갱신 트리거 (PACK은 SSE + 재접속)
// ===============================
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let es: EventSource | null = null;
    let retryTimer: number | null = null;

    const connect = () => {
      // 기존 연결 정리
      if (es) {
        es.close();
        es = null;
      }

      console.info('[PACK SSE] connecting:', SSE_URL);
      es = new EventSource(SSE_URL);

      es.onopen = () => {
        console.info('[PACK SSE] connected:', SSE_URL);

        // 🔥 서버 재시작 후 다시 붙었을 때,
        // 한 번 전체 리스트 + 오늘 전력량 재조회
        mutate();
        mutateToday();

        // 재시도 타이머 있으면 제거
        if (retryTimer) {
          clearTimeout(retryTimer);
          retryTimer = null;
        }
      };

      es.onmessage = (ev) => {
        const dataText = ev.data;
        if (!dataText) return;

        try {
          const payload = JSON.parse(dataText);
          console.debug('[PACK SSE] payload:', payload);

          // IngestService 포맷 가정:
          // { kind: "MONITORING_DELTA", type: "PACK" | "CELL", items: [...] }
          if (payload?.kind === 'MONITORING_DELTA' && payload?.type === 'PACK') {
            mutate();
            mutateToday();   // ✅ 오늘 전력량만 갱신
            return;
          }

          // 다른 JSON 구조지만 PACK 관련이면 전체 재조회
          const typeField =
            typeof payload.Type === 'string'
              ? payload.Type.toUpperCase()
              : typeof payload.type === 'string'
                ? payload.type.toUpperCase()
                : null;

          if (!typeField || typeField === 'PACK') {
            console.debug('[PACK SSE] unsupported JSON → mutate() fallback');
            mutate();
            mutateToday();   // ✅ today만
          }
        } catch (e) {
          // JSON 파싱 안 되는 단순 문자열/기타 이벤트 → fallback
          console.debug('[PACK SSE] non-JSON event, fallback mutate()', e);
          mutate();
          mutateToday();     // ✅ today만
        }
      };

      es.onerror = (err) => {
        console.error('[PACK SSE] error → will retry in 5s', err);

        if (es) {
          es.close();
          es = null;
        }

        // 5초 후 재접속 시도 (중복 타이머 방지)
        if (!retryTimer) {
          retryTimer = window.setTimeout(() => {
            connect();
          }, 5000);
        }
      };
    };

    connect();

    return () => {
      console.info('[PACK SSE] cleanup');
      if (es) es.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [mutate, mutateToday]);

  // ===============================
  // 3) PACK 채널 → 장비 그룹핑 (eqpid + chamberIndex)
  //      🔥 여기서 좌표 중복 정규화(normalizeByCoordinate) 적용
  // ===============================
  const equipGroups: EquipGroup[] = useMemo(() => {
    if (!listData || !listData.length) return [];

    // ✅ 좌표 기준으로 "마지막 데이터만" 남기기
    const src = normalizeByCoordinate(listData);

    const map = new Map<string, EquipGroup>();

    for (const ch of src) {
      const eqpid = (ch.eqpid || ch.title || '').trim();
      if (!eqpid) continue;

      const chamberIndex =
        typeof ch.chamberIndex === 'number' && ch.chamberIndex > 0
          ? ch.chamberIndex
          : 1;

      const key = `${eqpid}_${chamberIndex}`;
      let g = map.get(key);
      if (!g) {
        g = {
          key,
          title: eqpid,
          eqpid,
          chamberIndex,
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
  }, [listData]);

  // ===============================
  // 4) 검색 + 그룹 → List용 아이템 (CELL과 동일 개념)
  // ===============================
  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);

  const displayList: MonitoringItem[] = useMemo(() => {
    const keys = searchKeywords
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);
    const hasSearch = keys.length > 0;

    const result: MonitoringItem[] = [];

    for (const g of equipGroups) {
      const eqpidLower = g.eqpid.toLowerCase();

      // 그룹 내 채널 스케줄 문자열도 검색에 포함
      const schedules = g.channels
        .map((ch) => ch.schedule?.toLowerCase() ?? '')
        .filter(Boolean);

      const match =
        hasSearch &&
        keys.some(
          (kw) =>
            eqpidLower.includes(kw) ||
            schedules.some((s) => s.includes(kw)),
        );

      // 대표 채널 하나 선택 (온도/습도/좌표가 의미 있는 채널 우선)
      const rep =
        g.channels.find((c) => c.temp && c.temp !== '-') ?? g.channels[0];

      // ✅ 셀과 동일한 그룹 상태/깜빡임 계산 재사용
      const { uiOperation, uiShutdown } = calcGroupState(g.channels);

      // ✅ RESET 상태 적용 (CELL 과 동일 패턴)
      const gKey = groupKeyOf(g.eqpid, g.chamberIndex);
      const resetMode = resetTargets[gKey];

      let finalOperation = uiOperation;
      let finalShutdown = uiShutdown;

      // 🔸 깜빡이는 장비들: 색은 그대로, 깜빡임만 제거
      if (resetMode === 'clear-blink' && finalShutdown) {
        finalShutdown = false;
      }

      // 🔸 완료 장비: 리셋 시 회색(available)으로 변경
      if (resetMode === 'complete-to-available' && finalOperation === 'completion') {
        finalOperation = 'available';
      }

      // 🔴 “Power sharing”은 원본 상태(rawStatus / operation) 기준으로 판단
      const rawOperation = (rep.rawStatus ?? rep.operation ?? '').trim();
      const isPowerSharing = rawOperation === 'Power sharing';

      const item: MonitoringItem = {
        ...rep,
        id: rep.id,
        title: g.title,
        eqpid: g.eqpid,
        chamberIndex: g.chamberIndex,
        check: match,
        // ⬇️ 여기부터 RESET 적용 결과 사용
        operation: finalOperation,    // 'completion' → 'available' 로 변환될 수 있음
        shutdown: finalShutdown,
        powerOn: isPowerSharing,
      };

      result.push(item);
    }

    return result;
  }, [equipGroups, searchKeywords, resetTargets]);

  // ===============================
  // 4-1) 최초 진입 시 List 한 번 강제 리렌더
  // ===============================
  useEffect(() => {
    // 이미 한 번 강제 리렌더 했다면 종료
    if (hasForcedListRenderRef.current) return;

    // 아직 로딩 중이거나, 표시할 데이터가 없으면 대기
    if (loading || !displayList || displayList.length === 0) return;

    hasForcedListRenderRef.current = true;

    // 다음 프레임에 key 변경해서 List 전체 리마운트
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        setListRenderToken((prev) => prev + 1);
      });
    } else {
      setListRenderToken((prev) => prev + 1);
    }
  }, [loading, displayList]);

  // ===============================
  // 5) 상단 차트: 장비 가동률/상태 (장비=eqpid+chamberIndex 기준)
  // ===============================
  // 5) 상단 차트: 장비 가동률/상태 + 스텝 분포 (장비=eqpid+chamberIndex 기준)
  const { runningChart, opDistChart, status4Chart, stepChart } = useMemo(() => {
    if (!equipGroups.length) {
      return {
        runningChart: { total: 0, running: 0 },
        opDistChart: [] as { name: string; value: number }[],
        status4Chart: [] as { name: string; value: number }[],
        stepChart: [] as { name: string; value: number }[],
      };
    }

    const totalEquip = equipGroups.length;
    let runningEquip = 0;

    // ✅ 장비 가동률: 장비(EQPID+CHAMBERINDEX) 단위
    for (const g of equipGroups) {
      const { uiOperation } = calcGroupState(g.channels);
      if (uiOperation === 'ongoing') {
        runningEquip++;
      }
    }

    // ✅ 운전모드 분포(opDistChart)는 계속 채널 단위 유지 (charge/discharge/rest...)
    const allChannels = equipGroups.flatMap((g) => g.channels);

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
      switch (op) {
        case 'charge':
          opBuckets.Charge++;
          break;
        case 'discharge':
          opBuckets.Discharge++;
          break;
        case 'rest':
          opBuckets.Rest++;
          break;
        case 'rest-iso':
          opBuckets['Rest(ISO)']++;
          break;
        case 'pattern':
          opBuckets.Pattern++;
          break;
        case 'chargemap':
          opBuckets.Chargemap++;
          break;
        default:
          opBuckets.Rest++;
          break;
      }
    }

    const opDistChart = Object.entries(opBuckets).map(([name, value]) => ({
      name,
      value,
    }));

    // ✅ 상태 분포(status4Chart)는 "장비 단위"로 계산
    const statusBuckets: Record<'대기' | '진행중' | '일시정지' | '알람', number> = {
      대기: 0,
      진행중: 0,
      일시정지: 0,
      알람: 0,
    };

    for (const g of equipGroups) {
      const { uiOperation, groupHasAlarms } = calcGroupState(g.channels);

      if (groupHasAlarms) {
        statusBuckets['알람'] += 1;
      } else if (uiOperation === 'stop') {
        statusBuckets['일시정지'] += 1;
      } else if (uiOperation === 'ongoing') {
        statusBuckets['진행중'] += 1;
      } else {
        statusBuckets['대기'] += 1;
      }
    }

    const status4Chart = Object.entries(statusBuckets).map(([name, value]) => ({
      name,
      value,
    }));

    // ✅ NEW: stepName 분포 계산 후 상위 6개만 추출
    const stepBuckets: Record<string, number> = {};

    for (const ch of allChannels) {
      const raw = (ch.stepName ?? ch.step ?? '').trim();
      if (!raw) continue;

      // 필요하면 여기서 표시용으로 정규화 가능 (예: 괄호 제거 등)
      const name = raw;

      stepBuckets[name] = (stepBuckets[name] ?? 0) + 1;
    }

    // 건수 기준 내림차순 정렬
    const sortedSteps = Object.entries(stepBuckets).sort(
      (a, b) => b[1] - a[1],
    );

    // 상위 6개만 차트에 사용
    const TOP_N = 6;
    const stepChart = sortedSteps.slice(0, TOP_N).map(([name, value]) => ({
      name,
      value,
    }));

    return {
      runningChart: { total: totalEquip, running: runningEquip },
      opDistChart,
      status4Chart,
      stepChart,
    };
  }, [equipGroups]);


  // chart zoom
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // card zoom
  const [isZoomOpen2, setIsZoomOpen2] = useState(false);

  // ===============================
  // 7) 렌더링
  // ===============================
  return (
    <>
      <section className="topState">
        <h2 className="ir">상단 기능 화면</h2>
        <div className="left">
          <ChartRunning
            title="장비가동률"
            total={runningChart.total}
            running={runningChart.running}
          />
          {/*<ChartState title="장비현황" data={opDistChart} />*/}
          <ChartState title="장비현황" data={stepChart} />
          <ChartOperation title="장비가동현황" data={status4Chart} />
          <Button className="btnZoom" onClick={() => setIsZoomOpen(true)}>
            확대보기
          </Button>
        </div>

        <div className="center">
          <TopStateCenter equipType="PACK" />
        </div>

        <div className="right">
          <ChartToday title="오늘 전력량" data={todayChart} unit={todayUnit} />
          <ul className="legend">
            <li className="charge">충전</li>
            <li>방전</li>
          </ul>
          <ChartMonth title="월별 전력량" data={monthChart} unit={monthUnit} />
        </div>
      </section>

      <section className="topFilter">
        <div className="left">
          <PageTitle title="장비상세" icon={titleIcon} />
          <Button className="btnZoom" onClick={() => setIsZoomOpen2(true)}>
            확대보기
          </Button>
          <SearchArea onSearchChange={setSearchKeywords} />
        </div>
        <div className="right">
          <ColorChip
            onReset={() => {
              const next: Record<string, ResetMode> = {};

              for (const g of equipGroups) {
                const modes = g.channels.map(getPackMode);
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

                const totalChannels = g.channels.length || 1;
                const anyAlarm = alarmCnt > 0;
                const anyRun = runCnt > 0;
                const allComplete = completeCnt === totalChannels;

                // 🔹 "알람이 아닌데 깜빡이는" 장비도 필요하면 clear-blink
                const blinkNonAlarm =
                  !anyAlarm && anyRun && completeCnt > 0 && !allComplete;

                const k = groupKeyOf(g.eqpid, g.chamberIndex);

                if (allComplete) {
                  // 파란 완료 → 회색 available
                  next[k] = 'complete-to-available';
                } else if (blinkNonAlarm) {
                  // 진행+완료 섞여서 깜빡이는 경우 → 깜빡임만 제거
                  next[k] = 'clear-blink';
                }
                // 🔴 anyAlarm 인 장비는 reset 대상 아님
              }

              setResetTargets(next);
            }}
          />
        </div>
      </section>

      <section className="monitoring">
        <h2 className="ir">모니터링 화면</h2>
        <div className="innerWrapper">
          {loading && <div className="loading">불러오는 중…</div>}
          {error && <div className="error">목록을 불러오지 못했습니다.</div>}
          {displayList && <List key={listRenderToken} listData={displayList} canEditMemo={canEditMemo} />}
        </div>
      </section>

      {/* chart zoom dialog */}
      <Dialog
        className="dialogCont wide"
        open={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
      >
        <div className="modalWrapper chartZoom">
          {/* 제목 + 닫기버튼 */}
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
          {/* 제목 + 닫기버튼 */}
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
                <ColorChip2 />
              </div>
            </section>

            {/* monitoring */}
            <section className="monitoring">
              <h2 className="ir">모니터링 화면</h2>
              <div className="innerWrapper">
                <List key={listRenderToken} listData={displayList} canEditMemo={canEditMemo} />
              </div>
            </section>
          </DialogContent>
        </div>
      </Dialog>
    </>
  );
}

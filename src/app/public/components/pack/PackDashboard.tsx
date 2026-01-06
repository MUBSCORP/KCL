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
  operation: string; // charge / discharge / rest ...
  status: string; // run / alarm / pause / ...
  statusLabel: string; // 대기 / 진행중 / 일시정지 / 알람
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
  stepNo?: number;
  totalSteps?: number;
  eqpid: string;
  channelIndex?: number;
  chamberIndex?: number;
  shutdown?: boolean;
  powerOn?: boolean;
  rawStatus?: string;
  alarmCount?: number;
  hasAlarms?: boolean;
  cycleCount?: string;
};

// 🔹 PACK UI용 모드
type ChannelMode = 'run' | 'stop' | 'alarm' | 'complete' | 'ready' | 'idle';
type UiOperation = 'available' | 'ongoing' | 'stop' | 'completion' | 'Power sharing';
type ResetMode = 'clear-blink' | 'complete-to-available';

// 🔹 장비(그룹) 키: eqpid + chamberIndex
const groupKeyOf = (eqpid: string, chamberIndex: number) => `${eqpid}__${chamberIndex || 1}`;

// ✅ 5분 이상 변화 없으면 comm error 로 강제 표기
const COMM_ERROR_MS = 5 * 60 * 1000;
const COMM_ERROR_STEP = 'Comm Error';
function nowMs() {
  return Date.now();
}

// ✅ 채널 신선도(freshness) 계산
function getFreshnessScore(ch: MonitoringItem): number {
  if (ch.time) {
    const ts = Date.parse(ch.time);
    if (!Number.isNaN(ts)) return ts;
  }
  if (typeof ch.id === 'number' && Number.isFinite(ch.id)) return ch.id;
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

    console.log(
      '[PACK] ch eqpid=',
      ch.eqpid,
      ' chamberIndex=',
      ch.chamberIndex,
      ' xRaw=',
      xRaw,
      ' yRaw=',
      yRaw,
      ' xNum=',
      xNum,
      ' yNum=',
      yNum,
      ' time=',
      ch.time,
      ' id=',
      ch.id,
    );

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
        ' 기존=',
        prev.eqpid,
        '/',
        prev.chamberIndex,
        ' (score=',
        prevScore,
        ')',
        ' 새=',
        ch.eqpid,
        '/',
        ch.chamberIndex,
        ' (score=',
        currScore,
        ')',
      );

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
import ChartOperation2 from '@/app/public/components/modules/topState/ChartOperation2';
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
// 상태 유틸
// ===============================
function extractRawStatusFromStep(step?: string | null): string {
  if (!step) return '';
  const open = step.indexOf('(');
  const close = step.lastIndexOf(')');
  if (open < 0 || close < 0 || close <= open) return '';
  return step.slice(open + 1, close).trim();
}

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

const ALARM_STATUS_LIST = ['device alarm', 'comm error', 'no connected battery', 'disable', 'extern comm error'];
const COMPLETE_STEP_LIST = ['End OK', 'End NG', 'User termination'];

function normalizeStatusName(s?: string | null): string {
  if (!s) return '';
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getPackMode(ch: MonitoringItem): ChannelMode {
  const rawStep = normalizeStatusName(extractRawStatusFromStep(ch.step));
  const rawStatus = normalizeStatusName(ch.rawStatus);

  if (rawStep && COMPLETE_STEP_LIST.map((x) => x.toLowerCase()).includes(rawStep)) return 'complete';
  if (rawStatus && COMPLETE_STEP_LIST.map((x) => x.toLowerCase()).includes(rawStatus)) return 'complete';

  if (rawStatus) {
    if (RUN_STATUS_LIST.includes(rawStatus)) return 'run';
    if (STOP_STATUS_LIST.includes(rawStatus)) return 'stop';
    if (ALARM_STATUS_LIST.includes(rawStatus)) return 'alarm';
    if (rawStatus === 'ready') return 'ready';
  }

  const s = normalizeStatusName(ch.status);
  const label = ch.statusLabel?.trim();

  if (s === 'alarm' || label === '알람') return 'alarm';
  if (s === 'pause' || label === '일시정지') return 'stop';
  if (s === 'run' || s === 'ongoing' || label === '진행중') return 'run';
  if (label?.includes('완료') || s === 'complete') return 'complete';
  if (s === 'rest' || label === '대기') return 'ready';

  return 'idle';
}

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
  const anyStopMode = stopCnt > 0;
  const allComplete = completeCnt === totalChannels;

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
  } else if (readyCnt > 0) {
    uiOperation = 'available';
    uiShutdown = false;
  } else {
    uiOperation = 'available';
    uiShutdown = false;
  }

  return { uiOperation, uiShutdown, groupHasAlarms };
}

// ===============================
// PACK 장비 그룹 타입
// ===============================
type EquipGroup = {
  key: string;
  title: string;
  eqpid: string;
  chamberIndex: number;
  channels: MonitoringItem[];
};

export default function DashboardPack() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const isLoggedIn = !!token && !!user;
  const mgtIdx = user?.mgtIdx;
  const canEditMemo = isLoggedIn && mgtIdx !== 4;

  const [listRenderToken, setListRenderToken] = useState(0);
  const hasForcedListRenderRef = useRef(false);

  const [resetTargets, setResetTargets] = useState<Record<string, ResetMode>>({});

  // ✅ 그룹별 마지막 변경 시각 기록 (eqpid__chamberIndex -> ms)
  const lastChangeRef = useRef<Record<string, number>>({});
  // ✅ 그룹별 signature(변경 감지용)
  const lastSigRef = useRef<Record<string, string>>({});
  // ✅ 시간 경과로 comm error 전환 반영용 tick (1분마다 갱신)
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const t = window.setInterval(() => setTick((v) => v + 1), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const { data: listData, error, mutate } = useSWR<MonitoringItem[]>(LIST_API, fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  });
  const loading = !listData && !error;

  const { data: todayPower, mutate: mutateToday } = useSWR(
    TODAY_POWER_API,
    async (url: string) => {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    { refreshInterval: 0, revalidateOnFocus: false },
  );

  const { data: monthPower, mutate: mutateMonth } = useSWR(
    MONTH_POWER_API,
    async (url: string) => {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    { refreshInterval: 0, revalidateOnFocus: false },
  );

  const { todayChart, monthChart, todayUnit, monthUnit } = useMemo(() => {
    const rawTodayDischarge = Math.abs(todayPower?.discharge ?? 0);
    const rawTodayCharge = todayPower?.charge ?? 0;

    const monthIsArray = Array.isArray(monthPower);
    const rawMonthChargeList = monthIsArray ? (monthPower as any[]).map((row) => row.charge ?? 0) : [];
    const rawMonthDischargeList = monthIsArray ? (monthPower as any[]).map((row) => Math.abs(row.discharge ?? 0)) : [];

    const todayValues = [rawTodayDischarge, rawTodayCharge];
    const todayUnit: PowerUnit = detectPowerUnit(todayValues);

    const todayChart = [
      { name: '방전', value: scaleByUnit(rawTodayDischarge, todayUnit) },
      { name: '충전', value: scaleByUnit(rawTodayCharge, todayUnit) },
    ];

    const monthValues = [...rawMonthChargeList, ...rawMonthDischargeList];
    const monthUnit: PowerUnit = detectPowerUnit(monthValues.length ? monthValues : [0]);

    const monthChart = monthIsArray
      ? (monthPower as any[]).map((row, idx) => ({
        name: row.inputdate ?? row.month ?? '-',
        charge: scaleByUnit(rawMonthChargeList[idx], monthUnit),
        discharge: scaleByUnit(rawMonthDischargeList[idx], monthUnit),
      }))
      : [];

    return { todayChart, monthChart, todayUnit, monthUnit };
  }, [todayPower, monthPower]);

  const lastMonthRefreshRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timer = setInterval(() => {
      const now = new Date();

      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${d}`;

      if (now.getHours() === 0 && now.getMinutes() >= 10 && lastMonthRefreshRef.current !== todayStr) {
        console.info('[PACK] auto month power refresh at 00:10', todayStr);
        mutateMonth();
        lastMonthRefreshRef.current = todayStr;
      }
    }, 60_000);

    return () => clearInterval(timer);
  }, [mutateMonth]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let es: EventSource | null = null;
    let retryTimer: number | null = null;

    const connect = () => {
      if (es) {
        es.close();
        es = null;
      }

      console.info('[PACK SSE] connecting:', SSE_URL);
      es = new EventSource(SSE_URL);

      es.onopen = () => {
        console.info('[PACK SSE] connected:', SSE_URL);
        mutate();
        mutateToday();

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

          if (payload?.kind === 'MONITORING_DELTA' && payload?.type === 'PACK') {
            mutate();
            mutateToday();
            return;
          }

          const typeField =
            typeof payload.Type === 'string'
              ? payload.Type.toUpperCase()
              : typeof payload.type === 'string'
                ? payload.type.toUpperCase()
                : null;

          if (!typeField || typeField === 'PACK') {
            mutate();
            mutateToday();
          }
        } catch {
          mutate();
          mutateToday();
        }
      };

      es.onerror = (err) => {
        console.error('[PACK SSE] error → will retry in 5s', err);

        if (es) {
          es.close();
          es = null;
        }

        if (!retryTimer) {
          retryTimer = window.setTimeout(() => connect(), 5000);
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

  const equipGroups: EquipGroup[] = useMemo(() => {
    if (!listData || !listData.length) return [];

    const src = normalizeByCoordinate(listData);
    const map = new Map<string, EquipGroup>();

    for (const ch of src) {
      const eqpid = (ch.eqpid || ch.title || '').trim();
      if (!eqpid) continue;

      const chamberIndex = typeof ch.chamberIndex === 'number' && ch.chamberIndex > 0 ? ch.chamberIndex : 1;

      const key = `${eqpid}_${chamberIndex}`;
      let g = map.get(key);
      if (!g) {
        g = { key, title: eqpid, eqpid, chamberIndex, channels: [] };
        map.set(key, g);
      }
      g.channels.push(ch);
    }

    const groups = Array.from(map.values()).sort((a, b) => {
      if (a.eqpid === b.eqpid) return a.chamberIndex - b.chamberIndex;
      return a.eqpid.localeCompare(b.eqpid);
    });

    // ✅ 그룹별 변경 감지(signature) + lastChange 갱신
    const now = nowMs();

    for (const g of groups) {
      const k = groupKeyOf(g.eqpid, g.chamberIndex);

      // "변경"으로 판단할 필드들(필요하면 추가/삭제 가능)
      const sig = g.channels
        .map((ch) =>
          [
            ch.channelIndex ?? ch.chamberIndex ?? '',
            ch.time ?? '',
            ch.status ?? '',
            ch.statusLabel ?? '',
            ch.operation ?? '',
            ch.step ?? '',
            ch.stepName ?? '',
            ch.voltage ?? '',
            ch.current ?? '',
            ch.power ?? '',
            ch.alarmCount ?? '',
            ch.hasAlarms ? '1' : '0',
          ].join('|'),
        )
        .join('||');

      if (lastSigRef.current[k] !== sig) {
        lastSigRef.current[k] = sig;
        lastChangeRef.current[k] = now;
      } else {
        if (!lastChangeRef.current[k]) lastChangeRef.current[k] = now;
      }
    }

    return groups;
  }, [listData]);

  // ✅ RESET 자동 해제 (핵심)
  useEffect(() => {
    if (!equipGroups.length) return;

    setResetTargets((prev) => {
      let changed = false;
      const next: Record<string, ResetMode> = { ...prev };

      for (const g of equipGroups) {
        const k = groupKeyOf(g.eqpid, g.chamberIndex);
        const mode = next[k];
        if (!mode) continue;

        const { uiOperation, uiShutdown } = calcGroupState(g.channels);

        if (mode === 'complete-to-available') {
          if (uiOperation !== 'completion') {
            delete next[k];
            changed = true;
          }
        }

        if (mode === 'clear-blink') {
          if (!uiShutdown) {
            delete next[k];
            changed = true;
          }
        }
      }

      return changed ? next : prev;
    });
  }, [equipGroups]);

  const buildResetTargets = (): Record<string, ResetMode> => {
    const next: Record<string, ResetMode> = {};

    for (const g of equipGroups) {
      const modes = g.channels.map(getPackMode);
      let runCnt = 0;
      let alarmCnt = 0;
      let completeCnt = 0;

      for (const m of modes) {
        if (m === 'run') runCnt++;
        else if (m === 'alarm') alarmCnt++;
        else if (m === 'complete') completeCnt++;
      }

      const totalChannels = g.channels.length || 1;
      const anyAlarm = alarmCnt > 0;
      const anyRun = runCnt > 0;
      const allComplete = completeCnt === totalChannels;

      const blinkNonAlarm = !anyAlarm && anyRun && completeCnt > 0 && !allComplete;

      const k = groupKeyOf(g.eqpid, g.chamberIndex);

      if (allComplete) next[k] = 'complete-to-available';
      else if (blinkNonAlarm) next[k] = 'clear-blink';
    }

    return next;
  };

  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);

  const displayList: MonitoringItem[] = useMemo(() => {
    const keys = searchKeywords.map((k) => k.trim().toLowerCase()).filter(Boolean);
    const hasSearch = keys.length > 0;

    const result: MonitoringItem[] = [];

    for (const g of equipGroups) {
      const eqpidLower = g.eqpid.toLowerCase();

      const schedules = g.channels.map((ch) => ch.schedule?.toLowerCase() ?? '').filter(Boolean);

      const match = hasSearch && keys.some((kw) => eqpidLower.includes(kw) || schedules.some((s) => s.includes(kw)));

      const rep = g.channels.find((c) => c.temp && c.temp !== '-') ?? g.channels[0];

      const { uiOperation, uiShutdown } = calcGroupState(g.channels);

      const gKey = groupKeyOf(g.eqpid, g.chamberIndex);
      const resetMode = resetTargets[gKey];

      let finalOperation = uiOperation;
      let finalShutdown = uiShutdown;

      // ✅ 5분 이상 데이터 변화 없음 → comm error로 강제
      const lastChanged = lastChangeRef.current[gKey] ?? 0;
      const isCommError = lastChanged > 0 && (nowMs() - lastChanged) >= COMM_ERROR_MS;

      if (isCommError) {
        finalOperation = 'stop';
        finalShutdown = true;
      }

      // ✅ RESET: blinking만 끄는 케이스
      if (resetMode === 'clear-blink' && finalShutdown) {
        finalShutdown = false;
      }

      // ✅ RESET: 완료 → 대기(available)로 “표시” 전환
      const resetCompleteToAvailable = resetMode === 'complete-to-available' && finalOperation === 'completion';
      if (resetCompleteToAvailable) {
        finalOperation = 'available';
      }

      // ✅ RESET으로 available로 바뀐 경우 라벨/상태도 같이 대기로
      const overrideStatusLabel = isCommError
        ? '알람'
        : (resetCompleteToAvailable ? '대기' : rep.statusLabel);

      const overrideStatus = isCommError
        ? 'alarm'
        : (resetCompleteToAvailable ? 'rest' : rep.status);

      const rawOperation = (rep.rawStatus ?? rep.operation ?? '').trim();
      const isPowerSharing = rawOperation === 'Power sharing';

      const item: MonitoringItem = {
        ...rep,
        id: rep.id,
        title: g.title,
        eqpid: g.eqpid,
        chamberIndex: g.chamberIndex,
        check: match,
        operation: finalOperation,
        shutdown: finalShutdown,
        powerOn: isPowerSharing,

        statusLabel: overrideStatusLabel,
        status: overrideStatus,

        // ✅ 프론트 강제 comm error 표시용
        rawStatus: isCommError ? 'comm error' : rep.rawStatus,
        hasAlarms: isCommError ? true : rep.hasAlarms,

        // ✅ stepName도 comm error면 강제 표기(리스트/모달에서 쓰는 곳 있으면 유용)
        stepName: isCommError ? COMM_ERROR_STEP : rep.stepName,
      };

      result.push(item);
    }

    return result;
  }, [equipGroups, searchKeywords, resetTargets, tick]);

  useEffect(() => {
    if (hasForcedListRenderRef.current) return;
    if (loading || !displayList || displayList.length === 0) return;

    hasForcedListRenderRef.current = true;

    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => setListRenderToken((prev) => prev + 1));
    } else {
      setListRenderToken((prev) => prev + 1);
    }
  }, [loading, displayList]);

  const { runningChart, status4Chart, stepChart } = useMemo(() => {
    if (!equipGroups.length) {
      return {
        runningChart: { total: 0, running: 0 },
        status4Chart: [] as { name: string; value: number }[],
        stepChart: [] as { name: string; value: number }[],
      };
    }

    const totalEquip = equipGroups.length;
    let runningEquip = 0;

    // ✅ status/step 집계를 "장비(그룹)" 기준으로 산정 (comm error도 장비 단위로 +1)
    const statusBuckets: Record<'대기' | '진행중' | '일시정지' | '알람', number> = {
      대기: 0,
      진행중: 0,
      일시정지: 0,
      알람: 0,
    };

    const stepBuckets: Record<string, number> = {};

    for (const g of equipGroups) {
      const gKey = groupKeyOf(g.eqpid, g.chamberIndex);

      const lastChanged = lastChangeRef.current[gKey] ?? 0;
      const isCommError = lastChanged > 0 && (nowMs() - lastChanged) >= COMM_ERROR_MS;

      // runningChart
      if (!isCommError) {
        const { uiOperation } = calcGroupState(g.channels);
        if (uiOperation === 'ongoing') runningEquip++;
      } else {
        // comm error면 running에 포함하지 않음
      }

      // status chart (장비현황/가동현황)
      if (isCommError) {
        statusBuckets['알람'] += 1;
      } else {
        const { uiOperation, groupHasAlarms } = calcGroupState(g.channels);

        if (groupHasAlarms) statusBuckets['알람'] += 1;
        else if (uiOperation === 'stop') statusBuckets['일시정지'] += 1;
        else if (uiOperation === 'ongoing') statusBuckets['진행중'] += 1;
        else statusBuckets['대기'] += 1;
      }

      // stepName chart (Top N): comm error면 Comm Error로 +1
      if (isCommError) {
        stepBuckets[COMM_ERROR_STEP] = (stepBuckets[COMM_ERROR_STEP] ?? 0) + 1;
      } else {
        const rep = g.channels.find((c) => c.stepName || c.step) ?? g.channels[0];
        const raw = (rep.stepName ?? rep.step ?? '').trim();
        if (raw) stepBuckets[raw] = (stepBuckets[raw] ?? 0) + 1;
      }
    }

    const status4Chart = Object.entries(statusBuckets).map(([name, value]) => ({ name, value }));

    const sortedSteps = Object.entries(stepBuckets).sort((a, b) => b[1] - a[1]);
    const TOP_N = 6;
    const stepChart = sortedSteps.slice(0, TOP_N).map(([name, value]) => ({ name, value }));

    return {
      runningChart: { total: totalEquip, running: runningEquip },
      status4Chart,
      stepChart,
    };
  }, [equipGroups, tick]);

  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isZoomOpen2, setIsZoomOpen2] = useState(false);

  return (
    <>
      <section className="topState">
        <h2 className="ir">상단 기능 화면</h2>
        <div className="left">
          <ChartRunning title="장비가동률" total={runningChart.total} running={runningChart.running} />
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
              setResetTargets(buildResetTargets());
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

      <Dialog className="dialogCont wide" open={isZoomOpen} onClose={() => setIsZoomOpen(false)}>
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
                <ChartRunning title="장비가동률" total={runningChart.total} running={runningChart.running} />
                <ChartState2 title="장비현황" data={stepChart} />
                <ChartOperation2 title="장비가동현황" data={status4Chart} />
              </div>
            </div>
          </DialogContent>
        </div>
      </Dialog>

      <Dialog className="dialogCont full" open={isZoomOpen2} onClose={() => setIsZoomOpen2(false)}>
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
                <ColorChip2 />
              </div>
            </section>

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

'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

// ===============================
// 타입 정의
// ===============================
export type MonitoringItem = {
  id: number;
  title: string;
  check: boolean;
  schedule: string;
  memo: boolean;
  memoText: string;
  operation: string;      // charge / discharge / rest ...
  status: string;         // run / alarm / pause / ...
  statusLabel: string;    // 대기 / 진행중 / 일시정지 / 알람
  voltage: string;
  current: string;
  power: string;
  step: string;
  cycle: string;
  rly: string;
  dgv?: string;
  chamber?: string;
  temp: string;
  humidity: string;
  cycles: number;
  activeCycles: number;
  time: string;
  x?: number;
  y?: number;
  eqpid?: string;
  channelIndex?: number;
  chamberIndex?: number;
  shutdown?: boolean;
  powerOn?: boolean;
  rawStatus?: string;
  // 🔹 알람 존재 여부(백엔드에서 내려주면 사용)
  alarmCount?: number;
  hasAlarms?: boolean;
};

// 🔹 PACK UI용 모드 (CELL과 동일 컨셉)
type ChannelMode = 'run' | 'stop' | 'alarm' | 'complete' | 'ready' | 'idle';
type UiOperation = 'available' | 'ongoing' | 'stop' | 'completion' | 'Power sharing';

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
import ChartOperation from '@/app/public/components/modules/topState/ChartOperation';
import ChartToday from '@/app/public/components/modules/topState/ChartToday';
import ChartMonth from '@/app/public/components/modules/topState/ChartMonth';
import TopStateCenter from '@/app/public/components/modules/topState/TopStateCenter';

import ColorChip from '@/app/public/components/modules/topFilter/ColorChip';
import SearchArea from '@/app/public/components/modules/topFilter/SearchArea';
import PageTitle from '@/app/public/components/modules/PageTitle';
import titleIcon from '@/assets/images/icon/detail.png';

import List from '@/app/public/components/modules/monitoring/List';

// ===============================
// 상태 유틸: PACK 채널 → 모드
// ===============================
function normalizeEn(s?: string | null): string {
  if (!s) return '';
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getPackMode(i: MonitoringItem): ChannelMode {
  const s = normalizeEn(i.status);
  const label = i.statusLabel?.trim();

  if (s === 'alarm' || label === '알람') return 'alarm';
  if (s === 'pause' || label === '일시정지') return 'stop';
  if (s === 'run' || s === 'ongoing' || label === '진행중') return 'run';

  if (label?.includes('완료')) return 'complete';

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
  // 6) 전력량 API 연동 (오늘 / 월) – 소수 1자리
  //    ⛔ 폴링 제거, SSE에서 mutate 호출
  // ===============================
  const { data: todayPower, mutate: mutateToday } = useSWR(
    TODAY_POWER_API,
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
  );

  const { data: monthPower, mutate: mutateMonth } = useSWR(
    MONTH_POWER_API,
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
  );

  const todayChart = useMemo(() => {
    if (!todayPower) {
      return [
        { name: '방전', value: 0 },
        { name: '충전', value: 0 },
      ];
    }

    return [
      {
        name: '방전',
        value: Number(Math.abs(todayPower.discharge ?? 0).toFixed(1)),
      },
      {
        name: '충전',
        value: Number((todayPower.charge ?? 0).toFixed(1)),
      },
    ];
  }, [todayPower]);

  const monthChart = useMemo(() => {
    if (!monthPower || !Array.isArray(monthPower)) return [];

    return monthPower.map((row: any) => ({
      name: row.inputdate ?? row.month ?? '-', // 백엔드 필드명에 맞게 조정
      charge: Number((row.charge ?? 0).toFixed(1)),
      discharge: Number(Math.abs(row.discharge ?? 0).toFixed(1)),
    }));
  }, [monthPower]);

  // ===============================
  // 2) SSE: 갱신 트리거 (PACK은 SSE 올 때만 재조회)
  // ===============================
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const es = new EventSource(SSE_URL);

    es.onopen = () => console.info('[PACK SSE] connected:', SSE_URL);

    es.onmessage = (ev) => {
      // PACK용 Delta 이벤트일 때만 전체 갱신
      try {
        const data = JSON.parse(ev.data);

        // IngestService 쪽 포맷 가정:
        // { kind: "MONITORING_DELTA", type: "PACK" | "CELL", ... }
        if (data?.kind === 'MONITORING_DELTA' && data?.type === 'PACK') {
          mutate();
          mutateToday();
          mutateMonth();
        }
      } catch (e) {
        // JSON 아닌 이벤트면 최소 장비 목록만 갱신
        console.debug('[PACK SSE] non-JSON event, fallback mutate()', e);
        mutate();
      }
    };

    es.onerror = (err) => {
      console.error('[PACK SSE] error', err);
    };

    return () => es.close();
  }, [mutate, mutateToday, mutateMonth]);

  // ===============================
  // 3) PACK 채널 → 장비 그룹핑 (eqpid + chamberIndex)
  // ===============================
  const equipGroups: EquipGroup[] = useMemo(() => {
    if (!listData || !listData.length) return [];

    const map = new Map<string, EquipGroup>();

    for (const ch of listData) {
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
        operation: uiOperation,  // 'available' | 'ongoing' | 'stop' | 'completion'
        shutdown: uiShutdown,    // 🔥 List/CSS에서 깜빡임 기준
        powerOn: isPowerSharing, // 🔥 Power sharing 인 경우만 파워 빨간색
      };

      result.push(item);
    }

    return result;
  }, [equipGroups, searchKeywords]);

  // ===============================
  // 5) 상단 차트: 장비 가동률/상태 (장비=eqpid+chamberIndex 기준)
  // ===============================
  const { runningChart, opDistChart, status4Chart } = useMemo(() => {
    if (!equipGroups.length) {
      return {
        runningChart: { total: 0, running: 0 },
        opDistChart: [] as { name: string; value: number }[],
        status4Chart: [] as { name: string; value: number }[],
      };
    }

    const totalEquip = equipGroups.length;
    let runningEquip = 0;

    // ✅ 셀과 동일하게, 그룹 상태를 기반으로 장비 가동 여부 판단
    for (const g of equipGroups) {
      const { uiOperation } = calcGroupState(g.channels);
      if (uiOperation === 'ongoing') {
        runningEquip++;
      }
    }

    // 운전모드 분포는 채널 기준 (기존 유지)
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
      }
    }

    const opDistChart = Object.entries(opBuckets).map(([name, value]) => ({
      name,
      value,
    }));

    // 상태 분포도 채널 기준 (기존 유지)
    const statusBuckets: Record<'대기' | '진행중' | '일시정지' | '알람', number> =
      {
        대기: 0,
        진행중: 0,
        일시정지: 0,
        알람: 0,
      };

    for (const ch of allChannels) {
      const label = ch.statusLabel;
      if (label === '대기') statusBuckets['대기']++;
      else if (label === '일시정지') statusBuckets['일시정지']++;
      else if (label === '알람') statusBuckets['알람']++;
      else statusBuckets['진행중']++;
    }

    const status4Chart = Object.entries(statusBuckets).map(([name, value]) => ({
      name,
      value,
    }));

    return {
      runningChart: { total: totalEquip, running: runningEquip },
      opDistChart,
      status4Chart,
    };
  }, [equipGroups]);

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
          <ChartState title="장비현황" data={opDistChart} />
          <ChartOperation title="장비가동현황" data={status4Chart} />
        </div>

        <div className="center">
          <TopStateCenter equipType="PACK" />
        </div>

        <div className="right">
          <ChartToday title="오늘 전력량" data={todayChart} />
          <ul className="legend">
            <li className="charge">충전</li>
            <li>방전</li>
          </ul>
          <ChartMonth title="월별 전력량" data={monthChart} />
        </div>
      </section>

      <section className="topFilter">
        <div className="left">
          <PageTitle title="장비상세" icon={titleIcon} />
          <SearchArea onSearchChange={setSearchKeywords} />
        </div>
        <div className="right">
          <ColorChip />
        </div>
      </section>

      <section className="monitoring">
        <h2 className="ir">모니터링 화면</h2>
        <div className="innerWrapper">
          {loading && <div className="loading">불러오는 중…</div>}
          {error && <div className="error">목록을 불러오지 못했습니다.</div>}
          {displayList && <List listData={displayList} />}
        </div>
      </section>
    </>
  );
}

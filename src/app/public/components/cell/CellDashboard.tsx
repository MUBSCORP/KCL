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
};

// ===============================
// 통신 설정
// ===============================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE ?? '';
const LIST_API = `${API_BASE_URL}/api/monitoring/CELL/list`;
const SSE_URL = `${API_BASE_URL}/api/monitoring/sse/telemetry`;

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
import ChartOperation from '@/app/public/components/modules/topState/ChartOperation';
import ChartToday from '@/app/public/components/modules/topState/ChartToday';
import ChartMonth from '@/app/public/components/modules/topState/ChartMonth';
import TopStateCenter from '@/app/public/components/modules/topState/TopStateCenter';

// topFilter
import ColorChipType2 from '@/app/public/components/modules/topFilter/ColorChipType2';
import SearchArea from '@/app/public/components/modules/topFilter/SearchArea';
import PageTitle from '@/app/public/components/modules/PageTitle';
import titleIcon from '@/assets/images/icon/detail3.png';

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

  // "25.123456°C", "25.123456 ℃", "25.123456" 등 처리
  const m = s.match(/^([-+]?\d+(?:\.\d+)?)(.*)$/);
  if (!m) return s;

  const num = parseFloat(m[1]);
  if (Number.isNaN(num)) return s;

  const unit = (m[2] ?? '').trim(); // "°C", "℃" 등

  // 🔸 1) 소수점 첫째 자리까지 **버림** (반올림 X)
  //     예) 23.19 -> 231.9 -> 231 -> 23.1
  const truncated1 = Math.trunc(num * 10) / 10;

  // 🔸 2) 소수 첫째 자리가 0이면 정수만 표시
  const valueStr = Number.isInteger(truncated1)
    ? String(truncated1)          // 23.0 -> "23"
    : truncated1.toFixed(1);      // 23.1 -> "23.1"

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
    .replace(/\s+/g, ' ');  // ✅ 탭/개행/중복 스페이스 → 한 칸
}

// 🔹 채널 단위 상태 판별
function getChannelMode(ch: MonitoringItem): ChannelMode {
  const rawStatus = normalizeStatusName(ch.rawStatus);
  const rawStep = normalizeStatusName(extractRawStatusFromStep(ch.step));

  // 1) 완료
  if (rawStep && COMPLETE_STEP_LIST.includes(rawStep)) {
    return 'complete';
  }

  // 2) Info.Status 기반
  if (rawStatus) {
    if (RUN_STATUS_LIST.includes(rawStatus)) return 'run';
    if (STOP_STATUS_LIST.includes(rawStatus)) return 'stop';
    if (ALARM_STATUS_LIST.includes(rawStatus)) return 'alarm';
    if (rawStatus === 'ready') return 'ready';
  }

  // 3) 백엔드 status 필드 fallback
  const s = normalizeStatusName(ch.status);
  if (s === 'alarm') return 'alarm';
  if (s === 'run') return 'run';
  if (s === 'pause') return 'stop';
  if (s === 'rest') return 'ready';

  return 'idle';
}

// 메모용 상태 → CSS class
function toMemoStatus(ch: MonitoringItem): MemoStatus {
  const mode = getChannelMode(ch);

  if (mode === 'complete') return 'completion';
  if (mode === 'run') return 'ongoing';
  if (mode === 'stop' || mode === 'alarm') return 'stop';
  return 'available';
}

// 장비(그룹) 키: eqpid + chamberIndex
const groupKeyOf = (eqpid: string, chamberIndex: number) =>
  `${eqpid}__${chamberIndex || 1}`;

// 장비(그룹) 시그니처: 값이 실제로 바뀌었는지 비교용
type EquipGroup = {
  key: string;
  title: string;
  eqpid: string;
  chamberIndex: number;
  channels: MonitoringItem[];
};

function buildGroupSignature(group: EquipGroup): string {
  // 상태/온도/전압/타임스탬프 정도만 묶어서 비교
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

// ✅ RESET 모드
type ResetMode = 'clear-blink' | 'complete-to-available';

export default function DashboardCell() {
  // 1) CELL 목록 로딩 (항상 전체 리스트)
  const { data, error, mutate } = useSWR<MonitoringItem[]>(LIST_API, fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  });
  const loading = !data && !error;

  // ✅ 장비별 RESET 상태 (eqpid__chamberIndex → ResetMode)
  const [resetTargets, setResetTargets] = useState<Record<string, ResetMode>>(
    {},
  );

  // ✅ 이전 장비 스냅샷 시그니처 (값이 실제 바뀌었는지 판단용)
  const lastGroupSignRef = useRef<Record<string, string>>({});

  // 2) SSE – 내용은 신경 안 쓰고, 뭔가 오면 전체 리스트 다시 로딩
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const es = new EventSource(SSE_URL);
    es.onopen = () => console.info('[CELL SSE] connected:', SSE_URL);

    es.onmessage = () => {
      mutate();
    };

    es.onerror = (err) => console.error('[CELL SSE] error', err);

    return () => {
      console.info('[CELL SSE] disconnected');
      es.close();
    };
  }, [mutate]);

  // 3) 검색
  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);

  // ===============================
  // 4) 장비 단위 그룹핑
  // ===============================
  const equipGroups: EquipGroup[] = useMemo(() => {
    if (!data || !data.length) return [];

    const map = new Map<string, EquipGroup>();

    for (const ch of data) {
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
  }, [data]);

  // ✅ equipGroups 가 새로 들어올 때마다,
  //    "실제로 값이 변한 장비"만 RESET 대상에서 제거
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
          delete next[k]; // 값이 바뀐 장비의 RESET 해제
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

      const match = hasSearch && keys.some((kw) => eqpidLower.includes(kw));

      // 대표 채널
      const withChamber = group.channels.find(
        (c) => (c.temp && c.temp !== '-') || c.chamberStatus,
      );
      const rep = withChamber ?? group.channels[0];

      // 채널 모드 집계
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
      const anyStop  = stopCnt > 0;          // ✅ STOP 여부 추가
      const anyRun = runCnt > 0;
      const anyComplete = completeCnt > 0;
      const anyReady = readyCnt > 0;
      const totalChannels = group.channels.length || 1;
      const allComplete = completeCnt === totalChannels;

      // 🔹 기본 장비 상태 결정
      let ready = false;
      let shutdown = false;
      let icon: ListItem['icon'] = 'stay';
      let operation: ListItem['operation'] = 'available';

      // 🔴 알람 또는 정지 채널이 하나라도 있으면 정지(빨간 테두리)
      if (anyAlarm || anyStop) {
        operation = 'stop';
        icon = 'error';
        shutdown = false;
        if(anyAlarm){
          shutdown = true;
        }
      } else if (anyRun) {
        // 진행 중
        operation = 'ongoing';
        icon = 'success';

        // 진행 + 완료 섞여 있으면 초록 깜빡임
        if (anyComplete) {
          shutdown = true;
        } else {
          shutdown = false;
        }
      } else if (allComplete) {
        // 전체 완료 → 파란 점등
        operation = 'completion';
        icon = 'stay';
        shutdown = false;
      } else if (anyReady && !anyRun && !anyAlarm && !anyComplete && !anyStop) {
        // Ready만 → 대기(회색)
        operation = 'available';
        ready = true;
        icon = 'stay';
        shutdown = false;
      } else {
        // 기타 → 유휴/대기
        operation = 'available';
        icon = 'success';
        shutdown = false;
      }
      // ✅ 장비별 RESET 상태 적용
      const gKey = groupKeyOf(group.eqpid, group.chamberIndex);
      const resetMode = resetTargets[gKey];

      let finalOperation = operation;
      let finalShutdown = shutdown;

      // 🔸 깜빡이는 장비들: 색은 그대로, 깜빡임만 제거
      if (resetMode === 'clear-blink' && shutdown) {
        finalShutdown = false;
      }

      // 🔸 완료 장비: 리셋 시 회색(available)로 변경
      if (resetMode === 'complete-to-available' && operation === 'completion') {
        finalOperation = 'available';
        // ready 플래그는 operation 기준으로 CSS 먹게 두고, 별도로 건드리지 않아도 됨
      }

      // 온도
      const [curTempRaw, setTempRaw] = splitTemp(rep.temp);
      // 🔸 여기서 포맷 적용
      const temp1 = formatTemp(curTempRaw);
      const temp2 = formatTemp(setTempRaw);

      // 메모 리스트
      const memoText = channelModes.map(({ ch }) => {
        const ms = toMemoStatus(ch);
        const statusTextMap: Record<MemoStatus, string> = {
          ongoing: '진행중',
          stop: '정지',
          completion: '완료',
          available: '사용가능',
        };

        const cellTempSuffix = ch.cellTemp ? ` (${ch.cellTemp}` : '';

        return {
          ch: `CH${ch.channelIndex ?? ''}`,
          status: ms,
          statusText: statusTextMap[ms],
          text: ch.batteryId ?? '-',
          text2: `${ch.testName ?? '-'}${cellTempSuffix}`,
        };
      });

      // 메모 본문
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
        ch3: completeCnt,
        memo: !!memoText.length,
        memoText,
        memoTotal,
        eqpid: title,
        channelIndex: memoChannelIndex,
      };
    });
  }, [equipGroups, searchKeywords, resetTargets]);

  // ===============================
  // 6) 상단 차트용 집계
  // ===============================
  const {
    runningChart,
    opDistChart,
    status4Chart,
    todayChart,
    monthChart,
  } = useMemo(() => {
    if (!equipGroups.length) {
      return {
        runningChart: { total: 0, running: 0 },
        opDistChart: [] as { name: string; value: number }[],
        status4Chart: [] as { name: string; value: number }[],
        todayChart: [
          { name: '방전', value: 0 },
          { name: '충전', value: 0 },
        ],
        monthChart: [] as { name: string; charge: number; discharge: number }[],
      };
    }

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

    const opDistChart = Object.entries(opBuckets).map(([name, value]) => ({
      name,
      value,
    }));

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

    const status4Chart = Object.entries(statusBuckets).map(([name, value]) => ({
      name,
      value,
    }));

    const todayChart = [
      { name: '방전', value: 0 },
      { name: '충전', value: 0 },
    ];
    const monthChart: { name: string; charge: number; discharge: number }[] = [];

    return {
      runningChart: { total: totalEquip, running: runningEquip },
      opDistChart,
      status4Chart,
      todayChart,
      monthChart,
    };
  }, [equipGroups]);

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
          <ChartState title="장비현황" data={opDistChart} />
          <ChartOperation title="장비가동현황" data={status4Chart} />
        </div>
        <div className="center">
          <TopStateCenter equipType="CELL" />
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

      {/* --- topFilter Section --- */}
      <section className="topFilter">
        <div className="left">
          <PageTitle title="CELL 상세" icon={titleIcon} />
          <SearchArea onSearchChange={setSearchKeywords} />
        </div>
        <div className="right">
          <ColorChipType2
            onReset={() => {
              // ✅ RESET 규칙
              //  - 완료(allComplete) 장비 → complete-to-available (파란 → 회색)
              //  - 깜빡이는(shutdown) 장비 → clear-blink (색은 유지, 깜빡임만 제거)
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
                const anyStop  = stopCnt > 0;
                const anyRun = runCnt > 0;
                const totalChannels = g.channels.length || 1;
                const allComplete = completeCnt === totalChannels;

                let shutdown = false;
                if (anyAlarm || anyStop) {
                  // 알람 또는 정지 → 깜빡임 대상
                  shutdown = true;
                } else if (anyRun && completeCnt > 0 && !allComplete) {
                  shutdown = true;
                }

                const k = groupKeyOf(g.eqpid, g.chamberIndex);

                if (allComplete) {
                  next[k] = 'complete-to-available';
                } else if (shutdown) {
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
              listData={uiList}
              onResetByDetail={(item) => {
                // eqpid / channelIndex 가 있어야 장비 키 계산 가능
                if (!item.eqpid) return;
                const chamberIndex = item.channelIndex ?? 1;
                const key = groupKeyOf(item.eqpid, chamberIndex);

                setResetTargets(prev => {
                  const next = { ...prev };

                  // ✅ 규칙:
                  //  - 완료(operation === 'completion') → complete-to-available
                  //  - 깜빡이는 장비(shutdown === true) → clear-blink
                  if (item.operation === 'completion') {
                    next[key] = 'complete-to-available';
                  } else if (item.shutdown) {
                    next[key] = 'clear-blink';
                  }

                  return next;
                });
              }}
            />
          )}
        </div>
      </section>
    </>
  );
}

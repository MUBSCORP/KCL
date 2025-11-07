'use client';

import { useMemo } from 'react';
// @ts-ignore
import useSWR from 'swr';

// API 래퍼
import { api } from '@/services/apiClient';
// topState
import ChartRunning from '@/app/uiux/components/modules/topState/ChartRunning';
import ChartState from '@/app/uiux/components/modules/topState/ChartState';
import ChartOperation from '@/app/uiux/components/modules/topState/ChartOperation';
import ChartToday from '@/app/uiux/components/modules/topState/ChartToday';
import ChartMonth from '@/app/uiux/components/modules/topState/ChartMonth';
import TopStateCenter from '@/app/uiux/components/modules/topState/TopStateCenter';

// topFilter
import ColorChip from '@/app/uiux/components/modules/topFilter/ColorChip';
import SearchArea from '@/app/uiux/components/modules/topFilter/SearchArea';
import PageTitle from '@/app/uiux/components/modules/PageTitle';
import titleIcon from '@/assets/images/icon/detail.png';

// monitoring
import List from '@/app/uiux/components/modules/monitoring/List';


// ---- 타입: 서버가 내려주는 List 아이템 형태(지금 서버 계약) ----
type MonitoringItem = {
  id: number;
  title: string;
  check: boolean;
  schedule: string;
  memo: boolean;
  memoText: string;
  operation: string;   // 'charge' | 'discharge' | 'rest' | 'rest-iso' | 'pattern' | 'balance' | 'chargemap' ...
  status: string;      // 'success' | 'rest' | 'complete' | 'warning' | 'error' | 'success2'
  statusLabel: string; // '정상' | '대기' | '완료' | '경고' | '위험' ...
  voltage: string;
  current: string;
  power: string;
  step: string;
  cycle: string;
  rly: string;
  dgv: string;
  temp: string;
  humidity: string;
  cycles: number;
  activeCycles: number;
  time: string;
};
const fetcher = (path: string) => api<MonitoringItem[]>(path);


export default function DashboardPack() {
  // PACK 타입만 우선
  const { data: listData, error } = useSWR<MonitoringItem[]>('/api/monitoring/PACK/list', fetcher, {
    refreshInterval: 3000, // 3초 폴링
  });

  const loading = !listData && !error;

  // ---- 차트 계산 ----
  const { runningChart, opDistChart, statusDistChart, todayChart, monthChart } = useMemo(() => {
    // 기본값(집계 API 없으니 0으로 시작)
    const today = [
      { name: '방전', value: 0 },
      { name: '충전', value: 0 },
    ];
    const month: never[] = []; // 집계 나오면 [ { name: '1', charge: 0, discharge: 0 }, ... ] 채움

    if (!listData || listData.length === 0) {
      return {
        runningChart: { total: 0, running: 0 },
        opDistChart: [
          { name: 'CHARGE', value: 0 },
          { name: 'DISCHARGE', value: 0 },
          { name: 'REST', value: 0 },
          { name: 'REST(ISO)', value: 0 },
          { name: 'PATTERN', value: 0 },
          { name: 'BALANCE', value: 0 },
          { name: 'CHARGEMAP', value: 0 },
        ],
        statusDistChart: [
          { name: '정상', value: 0 },
          { name: '경고', value: 0 },
          { name: '위험', value: 0 },
        ],
        todayChart: today,
        monthChart: month,
      };
    }

    // 1) 가동률 계산
    const total = listData.length;
    const nonRunningStatuses = new Set(['rest', 'rest-iso', 'warning', 'error']);
    const nonRunning = listData.filter((i: { status: string; }) => nonRunningStatuses.has(i.status)).length;
    const running = Math.max(total - nonRunning, 0);

    // 2) 장비현황(운전 모드 분포: operation)
    const opBuckets: Record<string, number> = {
      CHARGE: 0, DISCHARGE: 0, REST: 0, 'REST(ISO)': 0, PATTERN: 0, BALANCE: 0, CHARGEMAP: 0,
    };
    listData.forEach((i: { operation: any; }) => {
      const op = (i.operation || '').toLowerCase();
      if (op === 'charge') opBuckets.CHARGE++;
      else if (op === 'discharge') opBuckets.DISCHARGE++;
      else if (op === 'rest-iso') opBuckets['REST(ISO)']++;
      else if (op === 'pattern') opBuckets.PATTERN++;
      else if (op === 'balance') opBuckets.BALANCE++;
      else if (op === 'chargemap') opBuckets.CHARGEMAP++;
      else opBuckets.REST++;
    });
    const opDist = Object.entries(opBuckets).map(([name, value]) => ({ name, value }));

    // 3) 장비가동현황(상태 라벨 분포: 정상/경고/위험) - 대기/완료는 현재 그래프에 미반영
    const stBuckets: Record<'정상' | '경고' | '위험', number> = { 정상: 0, 경고: 0, 위험: 0 };
    listData.forEach((i: { statusLabel: string; }) => {
      if (i.statusLabel === '경고') stBuckets['경고']++;
      else if (i.statusLabel === '위험') stBuckets['위험']++;
      else if (i.statusLabel === '정상') stBuckets['정상']++;
      // '대기','완료' 등은 이 그래프에 포함하지 않음(디자인 유지)
    });
    const stDist = Object.entries(stBuckets).map(([name, value]) => ({ name, value }));

    return {
      runningChart: { total, running },
      opDistChart: opDist,
      statusDistChart: stDist,
      todayChart: today,
      monthChart: month,
    };
  }, [listData]);

  return (
    <>
      {/* topState */}
      <section className="topState">
        <h2 className="ir">상단 기능 화면</h2>
        <div className="left">
          <ChartRunning title="장비가동률" total={runningChart.total} running={runningChart.running} />
          <ChartState title="장비현황" data={opDistChart} />
          <ChartOperation title="장비가동현황" data={statusDistChart} />
        </div>

        <div className="center">
          <TopStateCenter />
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

      {/* topFilter */}
      <section className="topFilter">
        <div className="left">
          <PageTitle title="장비상세" icon={titleIcon} />
          <SearchArea />
        </div>
        <div className="right">
          <ColorChip />
        </div>
      </section>

      {/* monitoring */}
      <section className="monitoring">
        <h2 className="ir">모니터링 화면</h2>

        <div className="innerWrapper">
          {!loading && listData ? <List listData={listData} /> : null}
        </div>

        {/* 아래 2열도 실데이터로 동일 렌더 (원한다면 다른 Eqpid 필터로 분리 가능) */}
        <div className="innerWrapper">
          {!loading && listData ? <List listData={listData} /> : null}
          {!loading && listData ? <List listData={listData} /> : null}
        </div>
      </section>
    </>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { api } from '@/services/apiClient';

// topState (디자인 구조 유지)
import ChartRunning from '@/app/public/components/modules/topState/ChartRunning';
import ChartState from '@/app/public/components/modules/topState/ChartState';
import ChartOperation from '@/app/public/components/modules/topState/ChartOperation';
import ChartToday from '@/app/public/components/modules/topState/ChartToday';
import ChartMonth from '@/app/public/components/modules/topState/ChartMonth';
import TopStateCenter from '@/app/public/components/modules/topState/TopStateCenter';

// topFilter
import ColorChip from '@/app/public/components/modules/topFilter/ColorChip';
import SearchArea from '@/app/public/components/modules/topFilter/SearchArea';
import PageTitle from '@/app/public/components/modules/PageTitle';
import titleIcon from '@/assets/images/icon/detail.png';

// monitoring
import List from '@/app/public/components/modules/monitoring/List';

type MonitoringItem = {
  id: number;
  title: string;
  check: boolean;
  schedule: string;
  memo: boolean;
  memoText: string;
  operation: string;
  status: string;
  statusLabel: string;
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
  x?: number;
  y?: number;
  eqpid?: string;
  channelIndex?: number;
  shutdown?: boolean;
};

const fetcher = (path: string) => api<MonitoringItem[]>(path);
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE ?? '';
const SSE_URL = `${API_BASE_URL}/api/monitoring/sse/telemetry`;

export default function DashboardPack() {
  // ===============================
  // ✅ 1. 장비 목록 로딩
  // ===============================
  const { data: listData, error, mutate } = useSWR<MonitoringItem[]>(
    '/api/monitoring/PACK/list',
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    }
  );
  const loading = !listData && !error;

  // ===============================
  // ✅ 2. SSE (1회 재호출 트리거)
  // ===============================
  useEffect(() => {
    const es = new EventSource(SSE_URL);
    es.onopen = () => console.info('[SSE] connected:', SSE_URL);
    es.onmessage = () => mutate();
    es.onerror = (err) => console.error('[SSE] error', err);
    return () => {
      console.info('[SSE] disconnected');
      es.close();
    };
  }, [mutate]);

  // ===============================
  // ✅ 3. 검색어 기반 필터링
  // ===============================
  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);
  const displayList: MonitoringItem[] = useMemo(() => {
    const src = listData ?? [];
    if (!searchKeywords.length) return src.map((i) => ({ ...i, check: false }));

    const keys = searchKeywords
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0);

    return src.map((item) => {
      const title = item.title?.toLowerCase() ?? '';
      const eqpid = item.eqpid?.toLowerCase() ?? '';
      const match = keys.some((kw) => title.includes(kw) || eqpid.includes(kw));
      return { ...item, check: match };
    });
  }, [listData, searchKeywords]);

  // ===============================
  // ✅ 4. 차트 데이터 계산 (useMemo)
  // ===============================
  const {
    runningChart,
    opDistChart,
    status4Chart,
    todayChart,
    monthChart,
  } = useMemo(() => {
    if (!listData?.length)
      return {
        runningChart: { total: 0, running: 0 },
        opDistChart: [],
        status4Chart: [],
        todayChart: [],
        monthChart: [],
      };

    const total = listData.length;
    const running = listData.filter((i) => i.status === 'run').length;

    const opBuckets: Record<string, number> = {
      CHARGE: 0,
      DISCHARGE: 0,
      REST: 0,
      'REST(ISO)': 0,
      PATTERN: 0,
      BALANCE: 0,
      CHARGEMAP: 0,
    };

    listData.forEach((i) => {
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

    const statusBuckets: Record<'대기' | '진행중' | '일시정지' | '알람', number> = {
      대기: 0, 진행중: 0, 일시정지: 0, 알람: 0,
    };

    listData.forEach((i) => {
      const label = i.statusLabel;
      if (label === '대기') statusBuckets['대기']++;
      else if (label === '일시정지') statusBuckets['일시정지']++;
      else if (label === '알람') statusBuckets['알람']++;
      else statusBuckets['진행중']++;
    });

    const status4 = Object.entries(statusBuckets).map(([name, value]) => ({ name, value }));

    const today = [
      { name: '방전', value: 0 },
      { name: '충전', value: 0 },
    ];
    const month: { name: string; charge: number; discharge: number }[] = [];

    return {
      runningChart: { total, running },
      opDistChart: opDist,
      status4Chart: status4,
      todayChart: today,
      monthChart: month,
    };
  }, [listData]);

  // ===============================
  // ✅ 5. 화면 렌더링 (디자인 반영)
  // ===============================
  return (
    <>
      {/* topState */}
      <section className="topState">
        <h2 className="ir">상단 기능 화면</h2>

        <div className="left">
          <ChartRunning title="장비가동률" total={runningChart.total} running={runningChart.running} />
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

      {/* topFilter */}
      <section className="topFilter">
        <div className="left">
          <PageTitle title="장비상세" icon={titleIcon} />
          <SearchArea onSearchChange={setSearchKeywords} />
        </div>
        <div className="right">
          <ColorChip />
        </div>
      </section>

      {/* monitoring */}
      <section className="monitoring">
        <h2 className="ir">모니터링 화면</h2>
        <div className="innerWrapper">
          {/* ✅ 퍼블 디자인 반영된 기능형 List */}
          <List listData={displayList} />
        </div>
      </section>
    </>
  );
}

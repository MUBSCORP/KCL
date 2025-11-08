'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { api } from '@/services/apiClient';

// topState
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
  id: number; title: string; check: boolean; schedule: string;
  memo: boolean; memoText: string;
  operation: string; status: string; statusLabel: string;
  voltage: string; current: string; power: string;
  step: string; cycle: string; rly: string; dgv: string;
  temp: string; humidity: string; cycles: number; activeCycles: number;
  time: string;
};

const fetcher = (path: string) => api<MonitoringItem[]>(path);

export default function PackDashboard() {
  const { data: listData, error } = useSWR<MonitoringItem[]>(
    '/api/monitoring/PACK/list',
    fetcher,
    { refreshInterval: 3000 }
  );
  const loading = !listData && !error;

  const { runningChart, opDistChart, statusDistChart, todayChart, monthChart } = useMemo(() => {
    const today = [{ name: '방전', value: 0 }, { name: '충전', value: 0 }];
    const month: never[] = [];

    if (!listData?.length) {
      return {
        runningChart: { total: 0, running: 0 },
        opDistChart: [
          { name: 'CHARGE', value: 0 }, { name: 'DISCHARGE', value: 0 },
          { name: 'REST', value: 0 }, { name: 'REST(ISO)', value: 0 },
          { name: 'PATTERN', value: 0 }, { name: 'BALANCE', value: 0 }, { name: 'CHARGEMAP', value: 0 },
        ],
        statusDistChart: [{ name: '정상', value: 0 }, { name: '경고', value: 0 }, { name: '위험', value: 0 }],
        todayChart: today, monthChart: month,
      };
    }

    // PACK 규칙: 'rest','rest-iso','warning','error'는 비가동으로 취급
    const total = listData.length;
    const nonRunningStatuses = new Set(['rest', 'rest-iso', 'warning', 'error']);
    const nonRunning = listData.filter(i => nonRunningStatuses.has(i.status)).length;
    const running = Math.max(total - nonRunning, 0);

    // PACK 운전모드 분포
    const opBuckets: Record<string, number> = {
      CHARGE: 0, DISCHARGE: 0, REST: 0, 'REST(ISO)': 0, PATTERN: 0, BALANCE: 0, CHARGEMAP: 0,
    };
    listData.forEach(i => {
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

    // PACK 상태 분포: 정상/경고/위험 (대기/완료 제외)
    const stBuckets: Record<'정상' | '경고' | '위험', number> = { 정상: 0, 경고: 0, 위험: 0 };
    listData.forEach(i => {
      if (i.statusLabel === '경고') stBuckets['경고']++;
      else if (i.statusLabel === '위험') stBuckets['위험']++;
      else if (i.statusLabel === '정상') stBuckets['정상']++;
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
          <TopStateCenter equipType="PACK" />
        </div>

        <div className="right">
          <ChartToday title="오늘 전력량" data={todayChart} />
          <ul className="legend"><li className="charge">충전</li><li>방전</li></ul>
          <ChartMonth title="월별 전력량" data={monthChart} />
        </div>
      </section>

      {/* topFilter */}
      <section className="topFilter">
        <div className="left">
          <PageTitle title="장비상세 (PACK)" icon={titleIcon} />
          <SearchArea />
        </div>
        <div className="right"><ColorChip /></div>
      </section>

      {/* monitoring */}
      <section className="monitoring">
        <h2 className="ir">모니터링 화면</h2>
        <div className="innerWrapper">{!loading && listData ? <List listData={listData} /> : null}</div>
        <div className="innerWrapper">
          {!loading && listData ? <List listData={listData} /> : null}
          {!loading && listData ? <List listData={listData} /> : null}
        </div>
      </section>
    </>
  );
}
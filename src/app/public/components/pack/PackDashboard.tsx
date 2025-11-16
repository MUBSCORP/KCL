'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

// ===============================
// 타입 정의 (운영 구조 + 퍼블 구조 반영)
// ===============================
export type MonitoringItem = {
  id: number;
  title: string;
  check: boolean;
  schedule: string;
  memo: boolean;
  memoText: string;
  operation: string;       // charge | discharge | rest | rest-iso | pattern | balance | chargemap | pause | error ...
  status: string;          // rest / ongoing / stop / alarm / completion ...
  statusLabel: string;     // 대기 / 진행중 / 일시정지 / 알람 / 완료
  voltage: string;
  current: string;
  power: string;
  step: string;
  cycle: string;
  rly: string;
  dgv?: string;            // 옛 퍼블에서 쓰던 필드 (있으면 사용)
  chamber?: string;        // 새 퍼블에서 사용하는 챔버/온도 값
  temp: string;
  humidity: string;
  cycles: number;
  activeCycles: number;
  time: string;
  x?: number;
  y?: number;
  eqpid?: string;
  channelIndex?: number;
  shutdown?: boolean;      // 테두리 점등
  powerOn?: boolean;       // 파워 볼드/레드 표시
};

// ===============================
// 통신 도구
// ===============================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE ?? '';
const LIST_API = `${API_BASE_URL}/api/monitoring/PACK/list`;
const SSE_URL = `${API_BASE_URL}/api/monitoring/sse/telemetry`;

const fetcher = async (path: string) => {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as MonitoringItem[];
};

// ===============================
// 디자인 퍼블 경로 (uiux 기준으로 변경)
// ===============================

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

export default function DashboardPack() {
  // ===============================
  // ✅ 1) 장비 목록 로딩 (실데이터)
  // ===============================
  const { data: listData, error, mutate } = useSWR<MonitoringItem[]>(LIST_API, fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  });
  const loading = !listData && !error;

  // ===============================
  // ✅ 2) SSE: 데이터 갱신 트리거
  // ===============================
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const es = new EventSource(SSE_URL);
    es.onopen = () => console.info('[SSE] connected:', SSE_URL);
    es.onmessage = () => mutate(); // 수신 시 목록 재검증
    es.onerror = (err) => console.error('[SSE] error', err);

    return () => {
      console.info('[SSE] disconnected');
      es.close();
    };
  }, [mutate]);

  // ===============================
  // ✅ 3) 검색 필터 (SearchArea 연동)
  // ===============================
  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);

  const displayList: MonitoringItem[] = useMemo(() => {
    const src = listData ?? [];
    if (!searchKeywords.length) {
      // 기본적으로 check는 false로 초기화
      return src.map((i) => ({ ...i, check: false }));
    }

    const keys = searchKeywords
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    return src.map((item) => {
      const title = item.title?.toLowerCase() ?? '';
      const eqpid = item.eqpid?.toLowerCase() ?? '';
      const match = keys.some((kw) => title.includes(kw) || eqpid.includes(kw));
      return { ...item, check: match };
    });
  }, [listData, searchKeywords]);

  // ===============================
  // ✅ 4) 차트 데이터 집계 (실데이터 → 퍼블 차트에 주입)
  // ===============================
  const { runningChart, opDistChart, status4Chart, todayChart, monthChart } = useMemo(() => {
    if (!listData?.length) {
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

    const total = listData.length;

    // status (run/rest/pause/alarm 등) or statusLabel 기반 running 수
    const running = listData.filter(
      (i) =>
        i.status === 'run' ||
        i.status === 'ongoing' || // 새 퍼블 status 값 고려
        i.statusLabel === '진행중',
    ).length;

    // === 4-1. 운전 모드 → ChartState (장비현황) ===
    const opBuckets: Record<string, number> = {
      Charge: 0,
      Discharge: 0,
      Rest: 0,
      'Rest(ISO)': 0,
      Pattern: 0,
      Balance: 0,
      Chargemap: 0,
    };

    listData.forEach((i) => {
      const op = (i.operation || '').toLowerCase();
      if (op === 'charge') opBuckets.Charge++;
      else if (op === 'discharge') opBuckets.Discharge++;
      else if (op === 'rest-iso') opBuckets['Rest(ISO)']++;
      else if (op === 'pattern') opBuckets.Pattern++;
      else if (op === 'balance') opBuckets.Balance++;
      else if (op === 'chargemap') opBuckets.Chargemap++;
      else opBuckets.Rest++;
    });

    const opDistChart = Object.entries(opBuckets).map(([name, value]) => ({ name, value }));

    // === 4-2. 상태 4종 → ChartOperation (장비가동현황) ===
    const statusBuckets: Record<'대기' | '진행중' | '일시정지' | '알람', number> = {
      대기: 0,
      진행중: 0,
      일시정지: 0,
      알람: 0,
    };

    listData.forEach((i) => {
      const label = i.statusLabel;
      if (label === '대기') statusBuckets['대기']++;
      else if (label === '일시정지') statusBuckets['일시정지']++;
      else if (label === '알람') statusBuckets['알람']++;
      else statusBuckets['진행중']++; // 나머지는 모두 진행중 처리
    });

    const status4Chart = Object.entries(statusBuckets).map(([name, value]) => ({
      name,
      value,
    }));

    // === 4-3. 전력량 차트 (현재는 0, 향후 별도 API 연동) ===
    const todayChart = [
      { name: '방전', value: 0 },
      { name: '충전', value: 0 },
    ];
    const monthChart: { name: string; charge: number; discharge: number }[] = [];

    return {
      runningChart: { total, running },
      opDistChart,
      status4Chart,
      todayChart,
      monthChart,
    };
  }, [listData]);

  // ===============================
  // ✅ 5) 렌더링 (디자인 퍼블 레이아웃 그대로 사용)
  // ===============================
  return (
    <>
      {/* topState */}
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
          {/* 퍼블 버전과 동일하게 사용 (필요하면 equipType="PACK" prop 추가 가능) */}
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
          {/* 기능 유지: 검색 결과 → searchKeywords 반영 */}
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
          {loading && <div className="loading">불러오는 중…</div>}
          {error && <div className="error">목록을 불러오지 못했습니다.</div>}
          {listData && <List listData={displayList} />}
        </div>
      </section>
    </>
  );
}

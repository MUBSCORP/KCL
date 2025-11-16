'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import React from 'react';

// ===============================
// 🔹 ListType2에서 타입 끌어오기
// ===============================
import List2 from '@/app/public/components/modules/monitoring/ListType2';

// List2가 실제로 받는 listData 원소 타입을 그대로 가져온다.
type List2Props = React.ComponentProps<typeof List2>;
type ListItem = List2Props['listData'][number];

// ===============================
// 🔹 백엔드 MonitoringItem 타입(공통)
// ===============================
export type MonitoringItem = {
  id: number;             // 백엔드에서 오는 고유 ID (int)
  title: string;
  check: boolean;
  schedule: string;
  memo: boolean;
  memoText: any;
  operation: string;       // charge | discharge | rest | ...
  status: string;          // rest / ongoing / stop / alarm / completion ...
  statusLabel: string;     // 대기 / 진행중 / 일시정지 / 알람 / 완료
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
  shutdown?: boolean;
  powerOn?: boolean;
};

// ===============================
// 🔹 통신 설정
// ===============================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE ?? '';
const LIST_API = `${API_BASE_URL}/api/monitoring/CELL/list`;      // ✅ CELL용
const SSE_URL = `${API_BASE_URL}/api/monitoring/sse/telemetry`;   // ✅ PACK과 동일 SSE 브로드캐스팅

const fetcher = async (path: string) => {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as MonitoringItem[];
};

// ===============================
// 🔹 디자인 퍼블 컴포넌트 import
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

export default function DashboardCell() {
  // ===============================
  // 1) CELL 목록 로딩
  // ===============================
  const { data: listData, error, mutate } = useSWR<MonitoringItem[]>(LIST_API, fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  });
  const loading = !listData && !error;

  // ===============================
  // 2) SSE - 백엔드 브로드캐스트로 갱신
  // ===============================
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const es = new EventSource(SSE_URL);
    es.onopen = () => console.info('[CELL SSE] connected:', SSE_URL);
    es.onmessage = () => {
      // 백엔드에서 브로드캐스팅 될 때마다 목록 재검증
      mutate();
    };
    es.onerror = (err) => console.error('[CELL SSE] error', err);

    return () => {
      console.info('[CELL SSE] disconnected');
      es.close();
    };
  }, [mutate]);

  // ===============================
  // 3) 검색 키워드 상태 (SearchArea 연동)
  // ===============================
  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);

  // ===============================
  // 4) MonitoringItem -> ListItem (List2용 UI 구조) 매핑
  // ===============================
  const uiList: ListItem[] = useMemo(() => {
    const src = listData ?? [];

    const keys = searchKeywords
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    return src.map<ListItem>((item) => {
      const title = item.title || item.eqpid || '';
      const eqpid = item.eqpid?.toLowerCase() ?? '';

      const match =
        !keys.length ||
        keys.some((kw) => title.toLowerCase().includes(kw) || eqpid.includes(kw));

      // operation/status → 퍼블용 상태 아이콘/operation 매핑
      let op: ListItem['operation'] = 'available';
      if (item.status === 'ongoing' || item.statusLabel === '진행중') op = 'ongoing';
      else if (item.statusLabel === '완료') op = 'completion';
      else if (item.status === 'stop' || item.statusLabel === '일시정지') op = 'stop';
      else op = 'available';

      let icon: ListItem['icon'] = 'success';
      if (item.statusLabel === '알람' || item.status === 'alarm') icon = 'error';
      else if (item.statusLabel === '대기' || item.status === 'rest') icon = 'stay';

      // ready / shutdown 플래그
      const ready = item.statusLabel === '대기' || item.status === 'rest';
      const shutdown =
        item.status === 'alarm' || item.statusLabel === '알람' || item.shutdown === true;

      // 온도/습도 → temp1/temp2로 표시 (퍼블 구조 맞춤)
      const temp1 = item.temp ? `${item.temp}` : '';
      const temp2 = item.humidity ? `${item.humidity}` : '';

      // 메모는 백엔드 구조 그대로 사용 (없으면 빈 배열/문자열)
      const memoText =
        Array.isArray(item.memoText) ? item.memoText : item.memoText ? [item.memoText] : [];
      const memoTotal = item.schedule || item.time || '';

      // ✅ 여기서 id는 number로 강제 (ListItem.id가 number이기 때문)
      const id = Number(item.id ?? 0);

      // CH 숫자 → activeCycles, cycles에서 적당히 매핑
      const ch1 = item.activeCycles ?? 0;
      const ch2 = 0;
      const ch3 = 0;

      return {
        id,                  // ✅ number
        x: item.x ?? 0,
        y: item.y ?? 0,
        title,
        check: match,        // 검색되면 체크, 아니면 false
        ready,
        shutdown,
        operation: op,
        icon,
        temp1,
        temp2,
        ch1,
        ch2,
        ch3,
        memo: !!item.memo,
        memoText,
        memoTotal,
      };
    });
  }, [listData, searchKeywords]);

  // ===============================
  // 5) 상단 차트용 집계 (CELL도 구조 동일하게)
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

    const running = listData.filter(
      (i) =>
        i.status === 'run' ||
        i.status === 'ongoing' ||
        i.statusLabel === '진행중',
    ).length;

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
      else statusBuckets['진행중']++;
    });

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
      runningChart: { total, running },
      opDistChart,
      status4Chart,
      todayChart,
      monthChart,
    };
  }, [listData]);

  // ===============================
  // 6) 렌더링
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
          <ColorChipType2 />
        </div>
      </section>

      {/* --- monitoring Section --- */}
      <section className="monitoring type2">
        <h2 className="ir">모니터링 화면</h2>
        <div className="innerWrapper">
          {loading && <div className="loading">불러오는 중…</div>}
          {error && <div className="error">목록을 불러오지 못했습니다.</div>}
          {uiList && <List2 listData={uiList} />}
        </div>
      </section>
    </>
  );
}

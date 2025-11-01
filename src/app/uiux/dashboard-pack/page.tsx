'use client';

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

export default function DashboardPack() {
  // chart props
  const chartData = { total: 20, running: 15 };
  const chartData2 = [
    { name: 'CHARGE', value: 20 },
    { name: 'DISCHARGE', value: 15 },
    { name: 'REST', value: 10 },
    { name: 'REST(ISO)', value: 10 },
    { name: 'PATTERN', value: 15 },
    { name: 'BALANCE', value: 20 },
    { name: 'CHARGEMAP', value: 10 },
  ];
  const chartData3 = [
    { name: '정상', value: 13 },
    { name: '경고', value: 2 },
    { name: '위험', value: 1 },
  ];
  const chartData4 = [
    { name: '방전', value: 280 },
    { name: '충전', value: 580 },
  ];
  const chartData5 = [
    { name: '1', charge: 30, discharge: 50 },
    { name: '2', charge: 60, discharge: 20 },
    { name: '3', charge: 40, discharge: 50 },
    { name: '4', charge: 30, discharge: 50 },
    { name: '5', charge: 60, discharge: 20 },
    { name: '6', charge: 40, discharge: 50 },
  ];

  // monitoring list
  const listData = [
    {
      id: 1, // idx
      title: '1F-001B', // 타이틀
      check: true, // 체크표시
      schedule: 'AA PE EV 항속형 PV 충방전싸이클 (가속)_241220 1', // 스케쥴
      memo: true, // 모달
      memoText: `비고: 00만 km RPT 측정 후 내구 재개
      [250923-24] 칠러 냉각수 보증 시험 일시정지 _이정우`, // memo
      operation: 'charge', // 상태
      status: 'success', // 뱃지 상태
      statusLabel: '정상', // 뱃지 텍스트
      voltage: '203.9 aV', // 전압
      current: '31.6 aA', // 전류
      power: '6.44 akW', // 파원
      step: '1(Rest)', // 스텝
      cycle: '4/4', // 사이클
      rly: 'ON', // rly
      dgv: '0.9', // dgv
      temp: '33.1/30', // 온도
      humidity: '40%/70%', // 습도
      cycles: 3, // 사이클
      activeCycles: 3, // 현재사이클
      time: '1D 05:54:30', // 경과시간
    },
    {
      id: 2,
      title: 'EQ-01',
      check: true,
      schedule: 'AA PE EV 항속형 PV 충방전싸이클 (가속)_241220 2', // 스케쥴
      memo: true,
      memoText: `비고: 00만 km RPT 측정 후 내구 재개
      [250923-24] 칠러 냉각수 보증 시험 일시정지 _이정우`,
      operation: 'discharge',
      status: 'rest',
      statusLabel: '대기',
      voltage: '203.9 aV',
      current: '31.6 aA',
      power: '6.44 akW',
      step: '1(Rest)',
      cycle: '4/4',
      rly: 'ON',
      dgv: '0.9',
      temp: '33.1/30',
      humidity: '40%/70%',
      cycles: 2,
      activeCycles: 2,
      time: '1D 05:54:30',
    },
    {
      id: 3,
      title: '1F-001B',
      check: false,
      schedule: 'AA PE EV 항속형 PV 충방전싸이클 (가속)_241220 3', // 스케쥴
      memo: true,
      memoText: `비고: 00만 km RPT 측정 후 내구 재개
      [250923-24] 칠러 냉각수 보증 시험 일시정지 _이정우`,
      operation: 'rest',
      status: 'complete',
      statusLabel: '완료',
      voltage: '203.9 aV',
      current: '31.6 aA',
      power: '6.44 akW',
      step: '1(Rest)',
      cycle: '4/4',
      rly: 'ON',
      dgv: '0.9',
      temp: '33.1/30',
      humidity: '40%/70%',
      cycles: 2,
      activeCycles: 2,
      time: '1D 05:54:30',
    },
    {
      id: 4,
      title: '1F-001B',
      check: false,
      schedule: 'AA PE EV 항속형 PV 충방전싸이클 (가속)_241220 4', // 스케쥴
      memo: false,
      memoText: ``,
      operation: 'rest-iso',
      status: 'warning',
      statusLabel: '경고',
      voltage: '203.9 aV',
      current: '31.6 aA',
      power: '6.44 akW',
      step: '17',
      cycle: '4/4',
      rly: 'ON',
      dgv: '0.9',
      temp: '33.1/30',
      humidity: '40%/70%',
      cycles: 1,
      activeCycles: 1,
      time: '1D 05:54:30',
    },
    {
      id: 5,
      title: '1F-001B',
      check: false,
      schedule: 'AA PE EV 항속형 PV 충방전싸이클 (가속)_241220 5', // 스케쥴
      memo: false,
      memoText: ``,
      operation: 'pattern',
      status: 'error',
      statusLabel: '위험',
      voltage: '203.9 aV',
      current: '31.6 aA',
      power: '6.44 akW',
      step: '17',
      cycle: '4/4',
      rly: 'ON',
      dgv: '0.9',
      temp: '33.1/30',
      humidity: '40%/70%',
      cycles: 5,
      activeCycles: 5,
      time: '1D 05:54:30',
    },
    {
      id: 6,
      title: '1F-001B',
      check: false,
      schedule: 'AA PE EV 항속형 PV 충방전싸이클 (가속)_241220 6', // 스케쥴
      memo: false,
      memoText: ``,
      operation: 'balance',
      status: 'success',
      statusLabel: '정상',
      voltage: '203.9 aV',
      current: '31.6 aA',
      power: '6.44 akW',
      step: '17',
      cycle: '4/4',
      rly: 'ON',
      dgv: '0.9',
      temp: '33.1/30',
      humidity: '40%/70%',
      cycles: 4,
      activeCycles: 4,
      time: '1D 05:54:30',
    },
    {
      id: 7,
      title: '1F-001B',
      check: false,
      schedule: 'AA PE EV 항속형 PV 충방전싸이클 (가속)_241220 7', // 스케쥴
      memo: false,
      memoText: ``,
      operation: 'chargemap',
      status: 'success2',
      statusLabel: '정상',
      voltage: '203.9 aV',
      current: '31.6 aA',
      power: '6.44 akW',
      step: '17',
      cycle: '4/4',
      rly: 'ON',
      dgv: '0.9',
      temp: '33.1/30',
      humidity: '40%/70%',
      cycles: 3,
      activeCycles: 3,
      time: '1D 05:54:30',
    },
  ];

  return (
    <>
      {/* topState */}
      <section className="topState">
        <h2 className="ir">상단 기능 화면</h2>
        <div className="left">
          <ChartRunning title="장비가동률" total={chartData.total} running={chartData.running} />
          <ChartState title="장비현황" data={chartData2} />
          <ChartOperation title="장비가동현황" data={chartData3} />
        </div>
        <div className="center">
          <TopStateCenter />
        </div>
        <div className="right">
          <ChartToday title="오늘 전력량" data={chartData4} />
          <ul className="legend">
            <li className="charge">충전</li>
            <li>방전</li>
          </ul>
          <ChartMonth title="월별 전력량" data={chartData5} />
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
          <List listData={listData} />
        </div>
        <div className="innerWrapper">
          <List listData={listData} />
          <List listData={listData} />
        </div>
      </section>
    </>
  );
}

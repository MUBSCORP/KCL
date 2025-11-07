'use client';

// topState
import ChartRunning from '@/app/uiux/components/modules/topState/ChartRunning';
import ChartState from '@/app/uiux/components/modules/topState/ChartState';
import ChartOperation from '@/app/uiux/components/modules/topState/ChartOperation';
import ChartToday from '@/app/uiux/components/modules/topState/ChartToday';
import ChartMonth from '@/app/uiux/components/modules/topState/ChartMonth';
import TopStateCenter from '@/app/uiux/components/modules/topState/TopStateCenter';

// topFilter
import ColorChipType2 from '@/app/uiux/components/modules/topFilter/ColorChipType2';
import SearchArea from '@/app/uiux/components/modules/topFilter/SearchArea';
import PageTitle from '@/app/uiux/components/modules/PageTitle';
import titleIcon from '@/assets/images/icon/detail3.png';

// monitoring
import List from '@/app/uiux/components/modules/monitoring/ListType2';

export default function DashboardPack() {
  // --- Chart Data ---
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

  // --- Monitoring List Data ---
  const listData1 = [
    {
      id: 1, // idx
      title: '300A-1A', // 타이틀
      check: true, // 체크표시
      ready: false, // 업데이트 예정
      shutdown: false, // 일부종료
      operation: 'ongoing', // 상태
      temp1: '17℃', // 온도
      temp2: '25℃', // 온도 2
      ch1: 8, // 챔버1
      ch2: 0, // 챔버 2
      ch3: 0, // 챔버 3
      memo: true, // 모달
      memoText: [
        // 모달상세
        { ch: 'CH 9', status: 'ongoing', statusText: '진행중', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 10', status: 'stop', statusText: '정지', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 11', status: 'completion', statusText: '완료', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 12', status: 'available', statusText: '사용가능', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 13', status: 'ongoing', statusText: '진행중', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 14', status: 'stop', statusText: '정지', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
      ],
      memoTotal: '',
    },
  ];
  const listData2 = [
    {
      id: 1,
      title: '300A-1A',
      check: true,
      ready: false,
      shutdown: true,
      operation: 'ongoing',
      temp1: '17℃',
      temp2: '25℃',
      ch1: 8,
      ch2: 0,
      ch3: 0,
      memo: true,
      memoText: [
        { ch: 'CH 9', status: 'ongoing', statusText: '진행중', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 10', status: 'stop', statusText: '정지', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 11', status: 'completion', statusText: '완료', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 12', status: 'available', statusText: '사용가능', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 13', status: 'ongoing', statusText: '진행중', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 14', status: 'stop', statusText: '정지', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
      ],
      memoTotal: '비고: 00만 km RPT 측정 후 내구 재개 [250923-24] 칠러 냉각수 보증 시험 일시정지 _이정우',
    },
    {
      id: 2,
      title: '300A-2A',
      check: false,
      ready: false,
      shutdown: true,
      operation: 'stop',
      temp1: '17℃',
      temp2: '25℃',
      ch1: 8,
      ch2: 0,
      ch3: 0,
      memo: true,
      memoText: [
        { ch: 'CH 9', status: 'ongoing', statusText: '진행중', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 10', status: 'stop', statusText: '정지', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 11', status: 'completion', statusText: '완료', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 12', status: 'available', statusText: '사용가능', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 13', status: 'ongoing', statusText: '진행중', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 14', status: 'stop', statusText: '정지', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
      ],
      memoTotal: '2',
    },
    {
      id: 3,
      title: '300A-3A',
      check: false,
      ready: false,
      shutdown: false,
      operation: 'completion',
      temp1: '17℃',
      temp2: '25℃',
      ch1: 8,
      ch2: 0,
      ch3: 0,
      memo: true,
      memoText: [
        { ch: 'CH 9', status: 'ongoing', statusText: '진행중', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 10', status: 'stop', statusText: '정지', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 11', status: 'completion', statusText: '완료', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 12', status: 'available', statusText: '사용가능', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 13', status: 'ongoing', statusText: '진행중', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 14', status: 'stop', statusText: '정지', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
      ],
      memoTotal: '3',
    },
    {
      id: 4,
      title: '300A-4A',
      check: false,
      ready: false,
      shutdown: false,
      operation: 'available',
      temp1: '17℃',
      temp2: '25℃',
      ch1: 8,
      ch2: 0,
      ch3: 0,
      memo: true,
      memoText: [
        { ch: 'CH 9', status: 'ongoing', statusText: '진행중', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 10', status: 'stop', statusText: '정지', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 11', status: 'completion', statusText: '완료', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 12', status: 'available', statusText: '사용가능', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 13', status: 'ongoing', statusText: '진행중', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
        { ch: 'CH 14', status: 'stop', statusText: '정지', text: 'LME2-00105', text2: 'CC Cycle (45℃)' },
      ],
      memoTotal: '4',
    },
    {
      id: 5,
      title: `신규장비
      업데이트 예정`,
      check: false,
      ready: true,
      shutdown: false,
      operation: 'ongoing',
      temp1: '',
      temp2: '',
      ch1: 0,
      ch2: 0,
      ch3: 0,
      memo: false,
      memoText: [],
      memoTotal: '5',
    },
    {
      id: 6,
      title: `신규장비
      업데이트 예정`,
      check: false,
      ready: true,
      shutdown: false,
      operation: 'stop',
      temp1: '',
      temp2: '',
      ch1: 0,
      ch2: 0,
      ch3: 0,
      memo: false,
      memoText: [],
      memoTotal: '6',
    },
    {
      id: 7,
      title: `신규장비
      업데이트 예정`,
      check: false,
      ready: true,
      shutdown: false,
      operation: 'completion',
      temp1: '',
      temp2: '',
      ch1: 0,
      ch2: 0,
      ch3: 0,
      memo: false,
      memoText: [],
      memoTotal: '7',
    },
    {
      id: 8,
      title: `신규장비
      업데이트 예정`,
      check: false,
      ready: true,
      shutdown: false,
      operation: 'available',
      temp1: '',
      temp2: '',
      ch1: 0,
      ch2: 0,
      ch3: 0,
      memo: false,
      memoText: [],
      memoTotal: '8',
    },
  ];

  return (
    <>
      {/* --- topState Section --- */}
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

      {/* --- topFilter Section --- */}
      <section className="topFilter">
        <div className="left">
          <PageTitle title="장비상세" icon={titleIcon} />
          <SearchArea />
        </div>
        <div className="right">
          <ColorChipType2 />
        </div>
      </section>

      {/* --- monitoring Section --- */}
      <section className="monitoring type2">
        <h2 className="ir">모니터링 화면</h2>
        <div className="innerWrapper">
          <List listData={listData1} />
          <List listData={listData2} />
        </div>
        <div className="innerWrapper">
          <List listData={listData1} />
          <List listData={listData2} />
          <List listData={listData2} />
        </div>
      </section>
    </>
  );
}

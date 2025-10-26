'use client';

import ChartRunning from '@/app/uiux/components/modules/topState//ChartRunning';
import ChartState from '@/app/uiux/components/modules/topState//ChartState';
import ChartOperation from '@/app/uiux/components/modules/topState//ChartOperation';
import ChartToday from '@/app/uiux/components/modules/topState//ChartToday';
import ChartMonth from '@/app/uiux/components/modules/topState//ChartMonth';
import TopStateCenter from '@/app/uiux/components/modules/topState//TopStateCenter';

export default function DashboardPack() {
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

  return (
    <section className="topState">
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
  );
}

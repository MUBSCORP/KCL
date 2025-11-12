'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
  title: string;
  data: { name: string; value: number }[]; // name: 대기/진행중/일시정지/알람
}

// 도넛 색상: 카드/뱃지와 동일하게 고정
const STATUS_COLORS: Record<string, string> = {
  대기: '#22B1F5',      // blue  : var(--state-rest)
  진행중: '#45D141',    // green : var(--state-ongoing)
  일시정지: '#FFEE00',  // yellow: var(--state-stop)
  알람: '#FF2626',      // red   : var(--state-alarm)
};

export default function ChartOperation({ title, data }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    // name(대기/진행중/일시정지/알람)에 따라 색상 지정
    const seriesData = data.map((item) => ({
      ...item,
      itemStyle: {
        color: STATUS_COLORS[item.name] ?? '#AAAAAA',
      },
    }));

    const option: echarts.EChartsOption = {
      tooltip: {
        show: false, // 퍼블처럼 툴팁 숨김
        trigger: 'item',
        formatter: '{b}: {c}대 ({d}%)',
        confine: true,
        textStyle: { fontSize: 10 },
      },
      legend: {
        orient: 'vertical',
        right: 0,
        top: 'center',
        icon: 'circle',
        itemWidth: 6,
        itemHeight: 6,
        formatter: (name: string) => {
          const item = data.find((d) => d.name === name);
          const value = item?.value ?? 0;
          return `${name} ${value}대`;
        },
        textStyle: {
          fontSize: 10,
        },
        data: data.map((d) => d.name),
      },
      series: [
        {
          name: title,
          type: 'pie',
          radius: ['50%', '90%'],
          center: ['27%', '50%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'inside',
            formatter: ({ data }: any) => `${data?.value ?? 0}`,
            fontSize: 12,
            fontWeight: 'bold',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 'bold',
            },
          },
          labelLine: { show: false },
          data: seriesData,
        },
      ],
    };

    chart.setOption(option);

    const resize = () => chart.resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      chart.dispose();
    };
  }, [data, title]);

  return (
    <div className="chartCont">
      <h3 className="tit">{title}</h3>
      <div
        className="chartWrap"
        ref={chartRef}
        style={{ width: '22rem', height: '10.4rem' }}
      />
    </div>
  );
}

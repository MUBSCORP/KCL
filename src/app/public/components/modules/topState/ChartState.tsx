'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
  title: string;
  data: { name: string; value: number }[];
}

export default function ChartStatus({ title, data }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        confine: true,
        textStyle: { fontSize: 10 }, // UI/UX: 툴팁 폰트 크기
      },
      legend: {
        orient: 'vertical',
        right: 0,
        top: 'center',
        icon: 'circle',
        itemWidth: 6,
        itemHeight: 6,
        textStyle: { fontSize: 10 },
      },
      series: [
        {
          name: '장비현황',
          type: 'pie',
          radius: ['50%', '90%'],      // UI/UX: 반지름 조정
          center: ['24%', '50%'],      // UI/UX: 위치 조정
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: 'inside',
            formatter: ({ data }: any) => `${data.value}`,
            fontSize: 12,
            fontWeight: 'bold',
          },
          labelLine: { show: false },
          data,
          color: [
            '#AAAAAA',
            '#45D141',
            '#90FF8D',
            '#22B1F5',
            '#FFCC00',
            '#E93935',
          ], // UI/UX 팔레트
        },
      ],
    };

    chart.setOption(option);

    const resizeObserver = () => chart.resize();
    window.addEventListener('resize', resizeObserver);

    return () => {
      window.removeEventListener('resize', resizeObserver);
      chart.dispose();
    };
  }, [data, total]);

  return (
    <div className="chartCont">
      <h3 className="tit">{title}</h3>
      <div
        className="chartWrap"
        ref={chartRef}
        style={{ width: '22rem', height: '10.4rem' }} // UI/UX: 사이즈 반영
      />
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
  title: string;
  data: { name: string; value: number }[];
}

// 상태별 고정 색상 매핑 (디자인 기준)
const STATUS_COLORS: Record<string, string> = {
  대기: '#22B1F5',      // 파랑
  진행중: '#45D141',    // 초록
  일시정지: '#FFCC00',  // 노랑
  알람: '#E9791A',      // 주황/알람
};

// 그 외 항목이 들어올 경우를 위한 기본 팔레트
const DEFAULT_COLORS = [
  '#AAAAAA',
  '#45D141',
  '#90FF8D',
  '#22B1F5',
  '#FFCC00',
  '#E93935',
];

export default function ChartStatus({ title, data }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    // 데이터에 상태별 색상 매핑 적용
    const seriesData = data.map((item, idx) => {
      const color =
        STATUS_COLORS[item.name] ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length];

      return {
        ...item,
        itemStyle: { color },
      };
    });

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
        // 데이터 순서대로 레전드 표시 (대기/진행중/일시정지/알람)
        data: data.map((d) => d.name),
      },
      series: [
        {
          name: '장비현황',
          type: 'pie',
          radius: ['50%', '90%'], // UI/UX: 반지름 조정
          center: ['24%', '50%'], // UI/UX: 위치 조정
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: 'inside',
            formatter: ({ data }: any) => `${data.value}`,
            fontSize: 12,
            fontWeight: 'bold',
          },
          labelLine: { show: false },
          data: seriesData,
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data]);

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

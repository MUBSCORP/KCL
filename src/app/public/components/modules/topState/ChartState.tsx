'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
  title: string;
  data: { name: string; value: number }[];
}

// 상태별 고정 색상 (우선 적용)
const STATUS_COLORS: Record<string, string> = {
  대기: '#22B1F5',      // 파랑
  진행중: '#45D141',    // 초록
  일시정지: '#FFCC00',  // 노랑
  알람: '#E9791A',      // 주황/알람
};

// 퍼블 기본 팔레트 (fallback)
const PUBLISH_COLORS = [
  '#ffd1cc', '#cce5f4', '#fff5cc', '#e6ffcc', '#e6d5ed', '#76f589', '#ffdcec',
];

export default function ChartStatus({ title, data }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    // 데이터별 색상 결정: 상태 고정색 → 퍼블 팔레트 순
    const seriesData = data.map((item, idx) => {
      const color = STATUS_COLORS[item.name] ?? PUBLISH_COLORS[idx % PUBLISH_COLORS.length];
      return { ...item, itemStyle: { color } };
    });

    const option: echarts.EChartsOption = {
      tooltip: {
        show: false,                    // 퍼블: 툴팁 비표시
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
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
        textStyle: { fontSize: 10 },
        data: data.map(d => d.name),
      },
      series: [
        {
          name: '장비현황',
          type: 'pie',
          radius: ['50%', '90%'],       // 퍼블 값
          center: ['24%', '50%'],       // 퍼블 위치
          avoidLabelOverlap: false,
          label: {
            show: false,                // 퍼블: 기본 숨김
            position: 'inside',
            formatter: ({ data }: any) => `${data?.value ?? 0}`,
            fontSize: 12,
            fontWeight: 'bold',
          },
          emphasis: {
            label: {
              show: true,               // hover 시 표시
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

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [data]);

  return (
    <div className="chartCont">
      <h3 className="tit">{title}</h3>
      <div
        className="chartWrap"
        ref={chartRef}
        style={{ width: '25rem', height: '10.4rem' }} // 퍼블 사이즈
      />
    </div>
  );
}

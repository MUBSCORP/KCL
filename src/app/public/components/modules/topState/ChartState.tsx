'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
  title: string;
  data: { name: string; value: number }[];
}

// ✅ 상태별 고정 색상 (우선 적용)
const STATUS_COLORS: Record<string, string> = {
  대기: 'rgba(34, 177, 245, 1)',     // 파랑
  진행중: 'rgba(69, 209, 65, 1)',    // 초록
  일시정지: 'rgba(255, 204, 0, 1)',  // 노랑
  알람: 'rgba(233, 121, 26, 1)',     // 주황/알람
};

// ✅ 퍼블 기본 팔레트 (fallback)
const PUBLISH_COLORS = [
  '#FFD1CC',
  '#CCE5F4',
  '#FFF5CC',
  '#E6FFCC',
  '#E6D5ED',
  '#76F589',
  '#FFDCEC',
];

// 보더 컬러(퍼블용) – 없으면 본 색상 재사용
const PUBLISH_BORDER_COLORS = [
  '#FF9B91',
  '#6FB8E3',
  '#EBCE54',
  '#B8E886',
  '#DCAAF1',
  '#F6A8CC',
  '#F6A8CC',
];

export default function ChartStatus({ title, data }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // 각 데이터 항목별 실제 색상 결정
  const resolvedColors = data.map((item, idx) => {
    return STATUS_COLORS[item.name] ?? PUBLISH_COLORS[idx % PUBLISH_COLORS.length];
  });

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    // legend rich text 스타일 구성 (퍼블 방식)
    const rich: Record<string, any> = {};
    data.forEach((d, i) => {
      const bgColor = resolvedColors[i] ?? PUBLISH_COLORS[i % PUBLISH_COLORS.length];
      const borderColor = PUBLISH_BORDER_COLORS[i % PUBLISH_BORDER_COLORS.length] ?? bgColor;
      rich[`b${i}`] = {
        color: '#000',
        backgroundColor: bgColor,
        borderColor,
        borderWidth: 1,
        borderRadius: 3,
        padding: [3, 4, 1],
        align: 'right',
      };
    });

    const option: echarts.EChartsOption = {
      animation: false,
      tooltip: {
        show: false, // 퍼블/기능 둘 다 툴팁 숨김
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
        itemWidth: 0, // 퍼블: 아이콘 숨기고 칩만 사용
        itemHeight: 0,
        formatter: (name: string) => {
          const idx = data.findIndex(d => d.name === name);
          if (idx < 0) return name;
          // 예: `{b0|대기}` 형태로 이름만 칩 안에 표시
          return `{b${idx}|${name}}`;
        },
        textStyle: {
          fontSize: 10,
          rich,
        } as any,
        data: data.map(d => d.name),
      } as echarts.LegendComponentOption,
      series: [
        {
          name: '장비현황',
          type: 'pie',
          radius: ['50%', '90%'], // 퍼블 값
          center: ['20%', '50%'], // 퍼블 위치
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
              show: true, // hover 시 표시
              fontSize: 12,
              fontWeight: 'bold',
            },
          },
          labelLine: { show: false },
          data,
          // ✅ 실제 파이 색상: 상태별 고정 색상 우선, 없으면 퍼블 팔레트
          color: resolvedColors,
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
  }, [data, title, resolvedColors]);

  return (
    <div className="chartCont">
      <h3 className="tit">{title}</h3>
      <div
        className="chartWrap"
        ref={chartRef}
        style={{ width: '28rem', height: '10.4rem' }} // 퍼블 사이즈
      />
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
  title: string;
  data: { name: string; value: number }[];
}

// ✅ 상태별 고정 색상 (우선 적용)
const STATUS_COLORS: Record<string, string> = {
  대기: 'rgba(34, 177, 245, 1)',
  진행중: 'rgba(69, 209, 65, 1)',
  일시정지: 'rgba(255, 204, 0, 1)',
  알람: 'rgba(233, 121, 26, 1)',
};

// ✅ 퍼블 팔레트 (6개로 맞춤)
const PUBLISH_COLORS = ['#FFD1CC', '#CCE5F4', '#FFF5CC', '#E6FFCC', '#E6D5ED', '#FFDCEC'];
const PUBLISH_BORDER_COLORS = ['#FF9B91', '#6FB8E3', '#EBCE54', '#B8E886', '#DCAAF1', '#F6A8CC'];

export default function ChartStatus({ title, data }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // 퍼블처럼 total 계산(의존성 정리용)
  const total = useMemo(() => data.reduce((sum, item) => sum + Number(item.value || 0), 0), [data]);

  // 기능 유지: 상태별 고정색 우선, 없으면 퍼블 팔레트
  const resolvedColors = useMemo(() => {
    return data.map((item, idx) => STATUS_COLORS[item.name] ?? PUBLISH_COLORS[idx % PUBLISH_COLORS.length]);
  }, [data]);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    // ✅ 퍼블 방식: reduce로 rich 구성
    const rich = data.reduce((acc, d, i) => {
      const bgColor = resolvedColors[i] ?? PUBLISH_COLORS[i % PUBLISH_COLORS.length];
      const borderColor = PUBLISH_BORDER_COLORS[i % PUBLISH_BORDER_COLORS.length] ?? bgColor;

      acc[`b${i}`] = {
        color: '#000',
        backgroundColor: bgColor,
        borderColor,
        borderWidth: 1,
        borderRadius: 3,
        padding: [3, 4, 1],
        align: 'left',
        width: 65,
        overflow: 'truncate',
        ellipsis: '...',
        lineHeight: 16,
      };
      return acc;
    }, {} as Record<string, any>);

    const option: echarts.EChartsOption = {
      animation: false,
      tooltip: {
        show: false,
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        confine: true,
        textStyle: { fontSize: 10 },
      },
      legend: {
        orient: 'horizontal',
        right: 0,
        top: 'center',
        width: 170,
        icon: 'circle',
        itemWidth: 0,
        itemHeight: 0,
        formatter: (name: string) => {
          const maxLength = 9;
          const short = name.length > maxLength ? name.slice(0, maxLength-2) + '...' : name;

          const idx = data.findIndex(d => d.name === name);
          return idx >= 0 ? `{b${idx}|${short}}` : short;
        },
        textStyle: {
          fontSize: 10,
          rich: {
            a: { width: 50 }, // 퍼블에 있던 값 유지(필요없으면 제거 가능)
            ...rich,
          },
        } as any,
        data: data.map((d) => d.name),
      } as echarts.LegendComponentOption,
      series: [
        {
          name: '장비현황',
          type: 'pie',
          radius: ['50%', '90%'],
          center: ['18%', '50%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'inside',
            // ✅ 퍼블 formatter 스타일 + 안전 처리
            formatter: ({ data }: any) => `${data?.value ?? 0}`,
            fontSize: 12,
            fontWeight: 'bold',
          },
          emphasis: {
            // ✅ 퍼블에서 추가된 부분
            itemStyle: {
              opacity: 1,
              color: 'inherit',
            },
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 'bold',
            },
          },
          labelLine: { show: false },
          data,
          // ✅ 실제 파이 색상: 기능 유지(상태 고정 우선)
          color: resolvedColors,
        },
      ],
    };

    chart.setOption(option, true);

    const resizeObserver = () => chart.resize();
    window.addEventListener('resize', resizeObserver);

    return () => {
      window.removeEventListener('resize', resizeObserver);
      chart.dispose();
    };
  }, [data, total, resolvedColors]);

  return (
    <div className="chartCont">
      <h3 className="tit">{title}</h3>
      <div className="chartWrap" ref={chartRef} style={{ width: '29.2rem', height: '10.8rem' }} />
    </div>
  );
}

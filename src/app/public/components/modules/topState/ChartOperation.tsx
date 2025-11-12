'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
  title: string;
  data: { name: string; value: number }[];
  /** 퍼블 기본은 false. 필요 시 true로 켜서 디버깅/검증 */
  showTooltip?: boolean;
}

/**
 * 퍼블 원본 스타일을 기본값으로 유지하면서 기능 보강
 * - legend formatter 방어 처리(idx === -1)
 * - colors 부족 시 fallback 색 적용
 * - props.showTooltip(기본 false)
 */
export default function ChartOperation({ title, data, showTooltip = false }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // UI/UX 팔레트 (퍼블 기준)
  const colors = ['#45D141', '#E93935', '#22B1F5', '#AAA'];

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      tooltip: {
        show: showTooltip, // 퍼블 기본은 false
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
        formatter: (name: string) => {
          const idx = data.findIndex((d) => d.name === name);
          if (idx === -1) return name; // 방어 로직
          return `{a|${name}} {b${idx}|${data[idx].value}대}`;
        },
        textStyle: {
          fontSize: 10,
          rich: {
            a: { width: 50 },
            ...data.reduce((acc, _d, i) => {
              (acc as any)[`b${i}`] = {
                color: '#fff',
                backgroundColor: colors[i] ?? '#888',
                borderRadius: 3,
                padding: [3, 4, 1],
                width: 25,
                align: 'right',
              };
              return acc;
            }, {} as Record<string, any>),
          },
        } as any,
      } as echarts.LegendComponentOption,

      series: [
        {
          name: title,
          type: 'pie',
          radius: ['50%', '90%'], // 퍼블 값 유지
          center: ['27%', '50%'],
          avoidLabelOverlap: false,
          label: {
            show: false, // 퍼블: 기본 숨김
            position: 'inside',
            formatter: ({ data }: any) => `${data.value}`,
            fontSize: 12,
            fontWeight: 'bold',
          },
          emphasis: {
            label: {
              show: true, // hover 시 표시 (퍼블 사양)
              fontSize: 12,
              fontWeight: 'bold',
            },
          },
          labelLine: { show: false },
          data,
          color: colors,
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
  }, [data, title, showTooltip]);

  return (
    <div className="chartCont">
      <h3 className="tit">{title}</h3>
      <div className="chartWrap" ref={chartRef} style={{ width: '22rem', height: '10.4rem' }} />
    </div>
  );
}

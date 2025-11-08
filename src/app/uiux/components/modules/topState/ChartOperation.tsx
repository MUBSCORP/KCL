'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
  title: string;
  data: { name: string; value: number }[];
}

export default function ChartOperation({ title, data }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const colors = ['#45D141', '#E93935', '#22B1F5', '#AAA'];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      tooltip: {
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
          return `{a|${name}} {b${idx}|${data[idx].value}대}`;
        },
        textStyle: {
          fontSize: 10,
          rich: {
            a: { width: 50 },
            ...data.reduce(
              (acc, d, i) => {
                acc[`b${i}`] = {
                  color: '#fff',
                  backgroundColor: colors[i],
                  borderRadius: 3,
                  padding: [3, 4, 1],
                  width: 25,
                  align: 'right',
                };
                return acc;
              },
              {} as Record<string, any>,
            ),
          },
        } as any,
      } as echarts.LegendComponentOption,

      series: [
        {
          name: title,
          type: 'pie',
          radius: ['50%', '90%'],
          center: ['27%', '50%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: 'inside',
            formatter: ({ data }: any) => `${data.value}`,
            fontSize: 12,
            fontWeight: 'bold',
          },
          labelLine: { show: false },
          data: data,
          color: colors,
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
  }, [data, total, title]);

  return (
    <div className="chartCont">
      <h3 className="tit">{title}</h3>
      <div className="chartWrap" ref={chartRef} style={{ width: '22rem', height: '10.4rem' }} />
    </div>
  );
}

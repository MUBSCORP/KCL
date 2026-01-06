'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
  title: string;
  data: { name: string; value: number }[];
}

export default function ChartStatus({ title, data }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const colors = ['#FFD1CC', '#CCE5F4', '#FFF5CC', '#E6FFCC', '#E6D5ED', '#FFDCEC'];
  const colorsBorder = ['#FF9B91', '#6FB8E3', '#EBCE54', '#B8E886', '#DCAAF1', '#F6A8CC'];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      tooltip: {
        show: false,
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
        itemWidth: 0,
        itemHeight: 0,
        // formatter: (name: string) => {
        //   const idx = data.findIndex((d) => d.name === name);
        //   return `{b${idx}|${name}}`;
        // },
        formatter: (name: string) => {
          const maxLength = 10;

          const short = name.length > maxLength ? name.slice(0, maxLength) + '...' : name;

          const idx = data.findIndex((d) => d.name === name);
          return `{b${idx}|${short}}`;
        },
        textStyle: {
          fontSize: 10,
          rich: {
            a: { width: 50 },
            ...data.reduce(
              (acc, d, i) => {
                acc[`b${i}`] = {
                  color: '#000',
                  backgroundColor: colors[i],
                  borderColor: colorsBorder[i],
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
              },
              {} as Record<string, any>,
            ),
          },
        } as any,
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
            formatter: ({ data }: any) => `${data.value}`,
            fontSize: 12,
            fontWeight: 'bold',
          },
          emphasis: {
            itemStyle: {
              opacity: 1,
              color: 'inherit',
            },
            label: {
              show: true, // hover 시 표시
              fontSize: 12,
              fontWeight: 'bold',
            },
          },
          labelLine: { show: false },
          data: data,
          color: ['#FFD1CC', '#CCE5F4', '#FFF5CC', '#E6FFCC', '#E6D5ED', '#FFDCEC'],
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
      <div className="chartWrap" ref={chartRef} style={{ width: '29.2rem', height: '10.8rem' }} />
    </div>
  );
}

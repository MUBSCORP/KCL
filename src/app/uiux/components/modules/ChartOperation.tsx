'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
  title: string;
  data: { name: string; value: number }[];
}

export default function ChartOperation({ title, data }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const colors = ['#5B9BD5', '#ED7D31', '#C00000'];

  const getColor = (name: string) => {
    const index = data.findIndex((d) => d.name === name);
    return colors[index] || '#000';
  };

  // 총합 계산
  const total = data.reduce((sum, item) => sum + item.value, 0);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        confine: true,
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
          fontSize: 11,
          rich: data.reduce(
            (acc, d, i) => {
              acc[`b${i}`] = {
                fontSize: 11,
                color: '#fff',
                backgroundColor: colors[i],
                borderRadius: 3,
                padding: [2, 4],
              };
              return acc;
            },
            {} as Record<string, any>,
          ),
          a: { fontSize: 11 },
        } as any,
      } as echarts.LegendComponentOption,

      series: [
        {
          name: title,
          type: 'pie',
          radius: ['60%', '90%'],
          center: ['27%', '50%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: 'center',
            formatter: ``,
            fontSize: 18,
            fontWeight: 'bold',
          },
          emphasis: {
            label: { show: true, fontSize: 20, fontWeight: 'bold' },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
            },
          },
          labelLine: { show: false },
          data: data,
          color: colors,
        },
      ],
    };

    option.legend?.textStyle?.rich?.b &&
      data.forEach((item, idx) => {
        option.legend!.textStyle!.rich!.b.backgroundColor = colors[idx];
      });

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
      <div className="chartWrap" ref={chartRef} style={{ width: '17.5rem', height: '9.4rem' }}></div>
    </div>
  );
}

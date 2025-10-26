'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
  title: string;
  data: { name: string; value: number }[];
}

export default function ChartToday({ title, data }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: {
        left: '3%',
        right: '10px',
        top: '0',
        bottom: '0',
        containLabel: true,
      },
      xAxis: { type: 'value', show: true },
      yAxis: {
        type: 'category',
        data: data.map((d) => d.name),
        axisLabel: { show: false },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: data.map((d) => d.value),
          itemStyle: {
            color: function (params) {
              const colors = ['#5B9BD5', '#ED7D31'];
              return colors[params.dataIndex % colors.length];
            },
          },
          barWidth: '40%',
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
  }, [data]);

  return (
    <div className="chartCont">
      <h3 className="tit">{title}</h3>
      <div className="chartWrap" ref={chartRef} style={{ width: '19.4rem', height: '10rem' }}></div>
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
  title: string;
  data: { name: string; charge: number; discharge: number }[];
}

export default function ChartMonth({ title, data }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        textStyle: { fontSize: 10 }, // 🔹 UI/UX: 툴팁 폰트 크기
        formatter: (params: any) => {
          let result = `<strong style="color:#000;font-size:1.1rem;font-weight:500">${params[0].name}월</strong><br/>`;
          params.forEach((item: any) => {
            result += `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:8px;height:8px;line-height:8px;background-color:${item.color}"></span>
              ${item.seriesName}: ${item.value}대<br/>`;
          });
          return result;
        },
      },
      grid: {
        left: '5%',
        right: '0',
        top: '7',
        bottom: '0',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.map(d => d.name),
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: 'value',
        name: '(대)',
      },
      series: [
        {
          name: '충전',
          type: 'bar',
          barWidth: '35%',
          data: data.map(d => d.charge),
          itemStyle: { color: '#5B9BD5' },
        },
        {
          name: '방전',
          type: 'bar',
          barWidth: '35%',
          data: data.map(d => d.discharge),
          itemStyle: { color: '#ED7D31' },
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
      {/* 🔹 UI/UX: 높이 10.8rem */}
      <div
        className="chartWrap"
        ref={chartRef}
        style={{ width: '23.5rem', height: '10.8rem' }}
      />
    </div>
  );
}

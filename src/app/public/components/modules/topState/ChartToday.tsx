'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { PowerUnit } from '@/utils/powerUnit';

interface ChartProps {
  title: string;
  data: { name: string; value: number }[];
  unit?: PowerUnit;  // 'W' | 'kW' | 'MW'
}

export default function ChartToday({ title, data, unit }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);
    const displayUnit: PowerUnit = unit ?? 'Wh';

    const option: echarts.EChartsOption = {
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        textStyle: { fontSize: 10 },
        formatter: (params: any) => {
          const list = Array.isArray(params) ? params : [params];
          return list
            .map((p) => {
              const name = p.name ?? '';
              const value = p.value ?? 0;
              return `${name}: ${value} ${displayUnit}`;
            })
            .join('<br/>');
        },
      },
      grid: {
        left: '3%',
        right: '10px',
        top: '0',
        bottom: '0',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        show: true,
        name: displayUnit,              // 🔹 축 이름에 단위 표시
        nameLocation: 'end',
        nameGap: 10,
        nameTextStyle: {
          fontSize: 10,
        },
      },
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
            color: function (params: any) {
              const colors = ['#5B9BD5', '#ED7D31'];
              return colors[params.dataIndex % colors.length];
            },
          },
          barWidth: '40%',
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
  }, [data, unit]); // 🔹 unit 바뀌어도 다시 렌더

  return (
    <div className="chartCont">
      <h3 className="tit">
        {title}
        {unit && <span style={{ marginLeft: 4, fontSize: '0.8rem' }}>({unit})</span>}
      </h3>
      <div
        className="chartWrap"
        ref={chartRef}
        style={{ width: '19.4rem', height: '10.8rem' }}
      />
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
  title: string;
  data: { name: string; value: number }[];
}

export default function ChartStatus({ title, data }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

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
        textStyle: {
          fontSize: 10,
        },
      },
      series: [
        {
          name: '장비현황',
          type: 'pie',
          radius: ['60%', '90%'],
          center: ['21%', '50%'],
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
          color: ['#ffd1cc', '#cce5f4', '#fff5cc', '#e6ffcc', '#e6d5ed', '#76f589', '#ffdcec'],
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
      <div className="chartWrap" ref={chartRef} style={{ width: '25rem', height: '10rem' }}></div>
    </div>
  );
}

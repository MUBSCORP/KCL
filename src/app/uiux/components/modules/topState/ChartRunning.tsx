'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
  title: string;
  total: number;
  running: number;
}

export default function ChartRunning({ title, total, running }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const stopped = total - running;
  const percent = Math.round((running / total) * 100);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}대 ({d}%)',
        confine: true,
      },
      series: [
        {
          name: '장비가동률',
          type: 'pie',
          radius: ['60%', '90%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: 'inside',
            formatter: ({ data }: any) => `${data.value}대`,
            fontSize: 12,
            fontWeight: 'bold',
          },
          labelLine: { show: false },
          data: [
            { value: running, name: '가동' },
            { value: stopped, name: '정지' },
          ],
          color: ['#86A315', '#E6E6E6'],
        },
      ],
      // graphic: {
      //   type: 'text',
      //   left: 'center',
      //   top: 'center',
      //   style: {
      //     text: `${percent}%`,
      //     fontSize: 18,
      //     fontWeight: 'bold',
      //   },
      // },
    };

    chart.setOption(option);

    const resizeHandler = () => chart.resize();
    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      chart.dispose();
    };
  }, [running, total]);

  return (
    <div className="chartCont type2">
      <h3 className="tit">{title}</h3>
      <div className="innerWrap">
        <div className="chartWrap" ref={chartRef} style={{ width: '9.4rem', height: '9.4rem' }} />
        <div className="legend">
          <p>
            <strong>{percent}</strong>%
          </p>
          <div className="btnWrap">
            <span className="total">전체 {total}대</span>
            <span className="current">가동 {running}대</span>
          </div>
        </div>
      </div>
    </div>
  );
}

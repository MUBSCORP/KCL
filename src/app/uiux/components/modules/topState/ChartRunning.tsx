'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
  title: string;
  total: number;
  running: number;
}

export default function ChartRunning({ title, total, running }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  // ---- 안전 보정 ----
  const toNum = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const t = Math.max(0, toNum(total));
  const r = Math.min(Math.max(0, toNum(running)), t);
  const stopped = Math.max(0, t - r);
  const percent = t > 0 ? Math.round((r / t) * 100) : 0;

  useEffect(() => {
    if (!containerRef.current) return;

    // 차트 인스턴스 1회 생성 후 재사용
    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current);
      const resize = () => chartRef.current && chartRef.current.resize();
      window.addEventListener('resize', resize);
      // cleanup
      return () => {
        window.removeEventListener('resize', resize);
        chartRef.current?.dispose();
        chartRef.current = null;
      };
    }
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

    const option: echarts.EChartsOption = {
      tooltip: {
        show: false,
        trigger: 'item',
        formatter: '{b}: {c}대 ({d}%)',
        confine: true,
        textStyle: { fontSize: 10 },
      },
      series: [
        {
          name: '장비가동률',
          type: 'pie',
          radius: ['50%', '90%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'inside',
            formatter: ({ data }: any) => `${data?.value ?? 0}`,
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
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          labelLine: { show: false },
          data: [
            { value: r, name: '가동' },
            { value: stopped, name: '정지' },
          ],
          color: ['#7a902a', '#E6E6E6'],
        },
      ],
      // 중앙 퍼센트 텍스트를 원하면 아래 주석 해제
      // graphic: {
      //   type: 'text',
      //   left: 'center',
      //   top: 'center',
      //   style: { text: `${percent}%`, fontSize: 18, fontWeight: 'bold' },
      // },
    };

    chartRef.current.setOption(option, true);
  }, [r, stopped, percent]);

  return (
    <div className="chartCont type2">
      <h3 className="tit">{title}</h3>
      <div className="innerWrap">
        <div className="chartWrap" ref={containerRef} style={{ width: '10.4rem', height: '10.8rem' }} />
        <div className="legend">
          <p>
            <strong>{String(percent)}</strong>%
          </p>
          <div className="btnWrap">
            <span className="total">전체 {String(t)}대</span>
            <span className="current">가동 {String(r)}대</span>
          </div>
        </div>
      </div>
    </div>
  );
}

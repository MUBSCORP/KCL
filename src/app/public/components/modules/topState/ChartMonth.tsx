'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { PowerUnit } from '@/utils/powerUnit';

interface ChartProps {
  title: string;
  data: { name: string; charge: number; discharge: number }[];
  unit?: PowerUnit; // 'Wh' | 'kWh' | 'MWh'
}

export default function ChartMonth({ title, data, unit }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);
    const displayUnit: PowerUnit = unit ?? 'Wh';

    // =========================================================
    // ✅ Y축 "그리드 라인 5줄" 고정
    // - splitNumber = 5  → 내부 가로선 5줄
    // - interval = (max - min) / 5
    // =========================================================
    const maxVal = Math.max(
      0,
      ...data.flatMap((d) => [Number(d.charge) || 0, Number(d.discharge) || 0]),
    );

    // 보기 좋은 max로 올림(1/2/5 계열)
    const niceCeil = (v: number) => {
      if (v <= 0) return 0;
      const exp = Math.floor(Math.log10(v));
      const base = Math.pow(10, exp);
      const f = v / base;
      const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
      return nf * base;
    };

    const yMin = 0;

    // max가 0이면 5로 잡으면 interval=1 → 0~5
    // (splitNumber=5라 내부선 5줄)
    const rawMax = maxVal === 0 ? 5 : niceCeil(maxVal);

    // splitNumber(=5)에 딱 맞게 max를 interval*5로 맞추기 위해 max 재정의
    const splits = 5;
    const interval = rawMax === 0 ? 1 : rawMax / splits;
    const yMax = yMin + interval * splits;

    const option: echarts.EChartsOption = {
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        textStyle: { fontSize: 10 },
        formatter: (params: any) => {
          const list = Array.isArray(params) ? params : [params];
          let result = `<strong style="color:#000;font-size:1.1rem;font-weight:500">${list[0]?.name ?? ''}월</strong><br/>`;
          list.forEach((item: any) => {
            result += `
              <span style="display:inline-block;margin-right:4px;border-radius:10px;width:8px;height:8px;line-height:8px;background-color:${item.color}"></span>
              ${item.seriesName}: ${item.value} ${displayUnit}<br/>
            `;
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
        data: data.map((d) => d.name),
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: 'value',
        name: `(${displayUnit})`,
        min: yMin,
        max: yMax,
        splitNumber: splits,     // ✅ 내부 가로선 5줄
        interval: interval,      // ✅ 눈금 간격 고정
        splitLine: { show: true }, // (명시적으로 켜기)
        axisLabel: {
          showMinLabel: true,
          showMaxLabel: true,
        },
      },
      series: [
        {
          name: '충전',
          type: 'bar',
          barWidth: '35%',
          data: data.map((d) => d.charge),
          itemStyle: { color: '#5B9BD5' },
        },
        {
          name: '방전',
          type: 'bar',
          barWidth: '35%',
          data: data.map((d) => d.discharge),
          itemStyle: { color: '#ED7D31' },
        },
      ],
    };

    chart.setOption(option, true);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data, unit]);

  return (
    <div className="chartCont">
      <h3 className="tit" style={{ marginBottom: '1.7rem' }}>
        {title}
        {unit && <span style={{ marginLeft: 4, fontSize: '0.8rem' }}>({unit})</span>}
      </h3>

      <div className="chartWrap" ref={chartRef} style={{ width: '23.5rem', height: '10.8rem' }} />
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
  title: string;
  data: { name: string; value: number }[];
}

// ✅ 상태별 고정 색상(순서 바뀌어도 안전)
const STATUS_COLORS: Record<string, string> = {
  대기: '#4681e1',
  진행중: '#45a170',
  일시정지: '#f1eb96',
  알람: '#ba4335',
};

// ✅ 퍼블에서 요구한 legend 박스 글자색도 상태 기준으로 고정
const STATUS_TEXT_COLORS: Record<string, string> = {
  대기: '#fff',
  진행중: '#000',
  일시정지: '#000',
  알람: '#fff',
};

export default function ChartOperation({ title, data }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // ✅ data 기준으로 색을 생성(상태명 기준 → 안전)
  const colors = useMemo(
    () => data.map(d => STATUS_COLORS[d.name] ?? '#AAAAAA'),
    [data],
  );
  const colorsTxt = useMemo(
    () => data.map(d => STATUS_TEXT_COLORS[d.name] ?? '#000'),
    [data],
  );

  // 퍼블에 있던 total(현재 옵션에서 직접 쓰진 않지만 deps 안정용/확장 대비)
  const total = useMemo(
    () => data.reduce((sum, item) => sum + (item?.value ?? 0), 0),
    [data],
  );

  useEffect(() => {
    if (!chartRef.current) return;

    // ✅ 초기 빈 데이터 타이밍 보호(원하면 제거 가능)
    // if (!data || data.length === 0) return;

    const chart = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      animation: false,
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
        itemWidth: 6,
        itemHeight: 6,

        // ✅ legend가 참조할 name을 data와 동일하게 고정(안전)
        data: data.map(d => d.name),

        // ✅ 여기서 터지던 에러 완전 차단
        formatter: (name: string) => {
          const idx = data.findIndex(d => d.name === name);
          if (idx < 0 || !data[idx]) return name;

          const value = data[idx]?.value ?? 0;
          return `{a|${name}} {b${idx}|${value}대}`;
        },

        textStyle: {
          fontSize: 10,
          rich: {
            a: { width: 50 },
            ...data.reduce((acc, _d, i) => {
              acc[`b${i}`] = {
                color: colorsTxt[i],
                backgroundColor: colors[i],
                borderRadius: 3,
                padding: [3, 4, 1],
                width: 35, // ✅ 퍼블 반영(30 → 25)
                align: 'right',
              };
              return acc;
            }, {} as Record<string, any>),
          },
        } as any,
      } as echarts.LegendComponentOption,

      series: [
        {
          name: title,
          type: 'pie',
          radius: ['50%', '90%'],
          center: ['23%', '50%'], // ✅ 퍼블 반영(기존 27% → 23%)
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
              show: true,
              fontSize: 12,
              fontWeight: 'bold',
            },
          },
          labelLine: { show: false },
          data,
          color: colors, // ✅ 상태명 기반 색 유지(순서 안전)
        },
      ],
    };

    chart.setOption(option);

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [data, title, colors, colorsTxt, total]);

  return (
    <div className="chartCont">
      <h3 className="tit">{title}</h3>
      <div
        className="chartWrap"
        ref={chartRef}
        style={{ width: '23rem', height: '10.8rem' }} // ✅ 퍼블 반영(22 → 23)
      />
    </div>
  );
}

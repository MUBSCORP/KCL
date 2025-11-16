'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
  title: string;
  data: { name: string; value: number }[]; // name: 대기/진행중/일시정지/알람
}

// ✅ 상태별 고정 색상 (카드/뱃지와 동일하게)
const STATUS_COLORS: Record<string, string> = {
  대기: '#008CFF',      // rest
  진행중: '#45D141',    // ongoing
  일시정지: '#FFEE00',  // stop
  알람: '#FF2626',      // alarm
};

export default function ChartOperation({ title, data }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // 데이터 순서에 맞는 색 배열 생성 (fallback은 회색)
  const colors = data.map(d => STATUS_COLORS[d.name] ?? '#AAAAAA');

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    // legend rich text용 스타일 (퍼블 방식)
    const rich: Record<string, any> = {
      a: { width: 50 }, // 상태 텍스트 칼럼
    };
    data.forEach((d, i) => {
      rich[`b${i}`] = {
        color: '#000',
        backgroundColor: colors[i],
        borderRadius: 3,
        padding: [3, 4, 1],
        width: 30,
        align: 'right',
      };
    });

    const option: echarts.EChartsOption = {
      tooltip: {
        show: false, // 기능 버전/퍼블 둘 다 툴팁 숨김
        trigger: 'item',
        formatter: '{b}: {c}대 ({d}%)',
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
        formatter: (name: string) => {
          const idx = data.findIndex(d => d.name === name);
          if (idx < 0) return name;
          const value = data[idx].value ?? 0;
          // 예: "진행중 3대" → [{a|진행중} {b0|3대}] 형태로 칼라 박스 표시
          return `{a|${name}} {b${idx}|${value}대}`;
        },
        textStyle: {
          fontSize: 10,
          rich,
        } as any,
        data: data.map(d => d.name),
      } as echarts.LegendComponentOption,
      series: [
        {
          name: title,
          type: 'pie',
          radius: ['50%', '90%'],
          center: ['27%', '50%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'inside',
            formatter: ({ data }: any) => `${data?.value ?? 0}`,
            fontSize: 12,
            fontWeight: 'bold',
          },
          emphasis: {
            label: {
              show: true, // hover 시만 값 표시
              fontSize: 12,
              fontWeight: 'bold',
            },
          },
          labelLine: { show: false },
          data,
          color: colors, // ✅ 상태별 고정 색상 적용
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
  }, [data, title, colors]);

  return (
    <div className="chartCont">
      <h3 className="tit">{title}</h3>
      <div
        className="chartWrap"
        ref={chartRef}
        style={{ width: '22rem', height: '10.4rem' }}
      />
    </div>
  );
}

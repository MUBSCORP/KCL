'use client';
import dynamic from 'next/dynamic';
import type { CSSProperties } from 'react';
import type { EChartsOption } from 'echarts';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

export default function ECharts({
                                    option, style, onEvents, renderer = 'canvas',
                                }: {
    option: EChartsOption;
    style?: CSSProperties;
    onEvents?: Record<string, (params: any) => void>;
    renderer?: 'canvas' | 'svg';
}) {
    return (
        <ReactECharts
            option={option}
            notMerge
            lazyUpdate
            style={{ width: '100%', height: 300, ...style }}
            onEvents={onEvents}
            opts={{ renderer }}
        />
    );
}

import type { EChartsOption } from 'echarts';

export const voltageCurrentOption = (labels: string[], volt: number[], curr: number[]): EChartsOption => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['Voltage(V)', 'Current(A)'] },
    grid: { left: 40, right: 24, top: 40, bottom: 40 },
    xAxis: { type: 'category', data: labels, boundaryGap: false },
    yAxis: [{ type: 'value', name: 'V' }, { type: 'value', name: 'A' }],
    series: [
        { name: 'Voltage(V)', type: 'line', smooth: true, yAxisIndex: 0, data: volt },
        { name: 'Current(A)', type: 'line', smooth: true, yAxisIndex: 1, data: curr },
    ],
});

import type { EChartsOption } from 'echarts';
export const socGaugeOption = (soc: number): EChartsOption => ({
    series: [{
        type: 'gauge',
        min: 0, max: 100,
        detail: { formatter: '{value}%', fontSize: 18 },
        data: [{ value: soc, name: 'SOC' }],
    }],
});

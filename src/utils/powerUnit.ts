export type PowerUnit = 'Wh' | 'kWh' | 'MWh';

// 데이터 전체를 보고 단위 결정
export function detectPowerUnit(values: number[]): PowerUnit {
  const absMax = Math.max(...values.map((v) => Math.abs(v)), 0);

  if (absMax >= 1_000_000) return 'MWh'; // 1,000,000 이상
  if (absMax >= 1_000) return 'kWh';     // 1,000 이상
  return 'Wh';
}

// 단위에 맞게 스케일링
export function scaleByUnit(value: number, unit: PowerUnit): number {
  switch (unit) {
    case 'MWh':
      return Number((value / 1_000_000).toFixed(1));
    case 'kWh':
      return Number((value / 1_000).toFixed(1));
    case 'Wh':
    default:
      return Number(value.toFixed(1));
  }
}

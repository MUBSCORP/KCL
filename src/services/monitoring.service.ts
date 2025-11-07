import { api  } from '@/services/apiClient';

export type MonitoringItem = {
  id: number;
  title: string;
  check: boolean;
  schedule: string;
  memo: boolean;
  memoText: string;
  operation: string;
  status: string;
  statusLabel: string;
  voltage: string;
  current: string;
  power: string;
  step: string;
  cycle: string;
  rly: string;
  dgv: string;
  temp: string;
  humidity: string;
  cycles: number;
  activeCycles: number;
  time: string;
};
export async function fetchMonitoringList(type: 'PACK' | 'CYCLER'): Promise<MonitoringItem[]> {
  return api<MonitoringItem[]>(`/api/monitoring/${type}/list`);
}
// app/protected/_hooks/useMonitoringList.ts
'use client';
// @ts-ignore
import useSWR from 'swr';
import { fetchMonitoringList, MonitoringItem } from '@/services/monitoring.service';

export function useMonitoringList(type: 'PACK'|'CELL', refreshMs = 3000) {
  const key = `/api/monitoring/${type}/list`;
  const { data, error } = useSWR<MonitoringItem[]>(key, () => fetchMonitoringList(type), {
    refreshInterval: refreshMs,
  });
  return { data, loading: !data && !error, error };
}

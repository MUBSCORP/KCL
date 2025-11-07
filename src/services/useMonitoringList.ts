'use client';

import { useEffect, useState } from 'react';
import { fetchMonitoringList, MonitoringItem } from './telemetry.service';

export function useMonitoringList(type: 'PACK' | 'CYCLER') {
  const [data, setData] = useState<MonitoringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchMonitoringList(type)
      .then((res) => {
        if (!alive) return;
        setData(Array.isArray(res) ? res : []);
        setError(null);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e);
        setData([]);
        // 디버깅에 도움: 네트워크/토큰/URL 문제면 여기서 잡힘
        console.error('[monitoring] fetch error:', e);
      })
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, [type]);

  return { data, loading, error };
}

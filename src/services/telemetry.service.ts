// 'use client';  <- 서비스 파일엔 없어도 됨
import { api } from './apiClient';

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
    chiller?: string | null;
    lastEventTs?: string | null;
};

export async function fetchMonitoringList(type: 'PACK' | 'CELL') {
    return api<MonitoringItem[]>(`/api/monitoring/${type}/list`);
}

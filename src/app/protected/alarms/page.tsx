'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/apiClient';
// @ts-ignore
import Grid from '@mui/material/Grid';
import DashboardCard from '@/components/DashboardCard';
import { DataGrid, GridColDef } from '@mui/x-data-grid'; // 설치 필요: @mui/x-data-grid
// npm i @mui/x-data-grid

type Alarm = {
    id: number;
    eqpId: string;
    channelIndex?: number;
    occurTime: string;
    level?: string;
    type?: string;
    code?: number;
    description?: string;
};

const columns: GridColDef[] = [
    { field: 'occurTime', headerName: 'Time', flex: 1 },
    { field: 'eqpId', headerName: 'EQP', width: 120 },
    { field: 'channelIndex', headerName: 'CH', width: 80 },
    { field: 'level', headerName: 'Level', width: 100 },
    { field: 'type', headerName: 'Type', flex: 1 },
    { field: 'code', headerName: 'Code', width: 90 },
    { field: 'description', headerName: 'Description', flex: 2 },
];

export default function AlarmsPage() {
    const [rows, setRows] = useState<Alarm[]>([]);

    useEffect(() => {
        api<Alarm[]>('/api/telemetry/alarms?limit=200').then(setRows).catch(()=>setRows([]));
    }, []);

    return (
        <Grid container>
            <Grid xs={12}>
                <DashboardCard title="알람 목록">
                    <div style={{ height: 520, width: '100%' }}>
                        <DataGrid rows={rows} columns={columns} getRowId={(r)=>r.id} />
                    </div>
                </DashboardCard>
            </Grid>
        </Grid>
    );
}

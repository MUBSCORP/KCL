'use client';
import { useState } from 'react';
// @ts-ignore
import Grid from '@mui/material/Grid';

import DashboardCard from '@/components/DashboardCard';
import { Button, Stack, TextField, Typography } from '@mui/material';

export default function SettingsPage() {
    const [topic, setTopic] = useState('device-status');
    const [persistMode, setPersistMode] = useState('buffer');

    const onSave = () => {
        // TODO: API 호출해서 서버 설정 반영 (예: /api/admin/config)
        alert(`saved: topic=${topic}, persistMode=${persistMode}`);
    };

    return (
        <Grid container spacing={2}>
            <Grid xs={12} md={6}>
                <DashboardCard title="수집 설정">
                    <Stack spacing={2}>
                        <TextField label="Consumer Topic" size="small" value={topic} onChange={e=>setTopic(e.target.value)} />
                        <TextField label="Persist Mode (buffer|immediate)" size="small" value={persistMode} onChange={e=>setPersistMode(e.target.value)} />
                        <Button variant="contained" onClick={onSave}>저장</Button>
                        <Typography variant="body2" color="text.secondary">※ 실제 API 연결은 백엔드 구성에 맞춰 반영</Typography>
                    </Stack>
                </DashboardCard>
            </Grid>
        </Grid>
    );
}

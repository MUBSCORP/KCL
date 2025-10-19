'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/apiClient';
// @ts-ignore
import Grid from '@mui/material/Grid';

import DashboardCard from '@/components/DashboardCard';
import { List, ListItem, ListItemText, Chip, Stack } from '@mui/material';

type Device = { eqpId: string; isOnline?: boolean; suiteVersion?: string };

export default function DevicesPage() {
    const [rows, setRows] = useState<Device[]>([]);

    useEffect(() => {
        api<Device[]>('/api/devices').then(setRows).catch(()=>setRows([]));
    }, []);

    return (
        <Grid container>
            <Grid xs={12}>
                <DashboardCard title="장비 목록">
                    <List>
                        {rows.map(d => (
                            <ListItem key={d.eqpId} divider>
                                <ListItemText primary={d.eqpId} secondary={d.suiteVersion} />
                                <Stack direction="row" spacing={1}>
                                    <Chip color={d.isOnline ? 'success' : 'default'} label={d.isOnline ? 'Online' : 'Offline'} />
                                </Stack>
                            </ListItem>
                        ))}
                    </List>
                </DashboardCard>
            </Grid>
        </Grid>
    );
}

'use client';
import { Card, CardContent, CardHeader, Divider } from '@mui/material';
import type { ReactNode } from 'react';

export default function DashboardCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode; }) {
    return (
        <Card elevation={2} sx={{ height: '100%' }}>
            <CardHeader title={title} action={action} />
            <Divider />
            <CardContent sx={{ pt: 2 }}>{children}</CardContent>
        </Card>
    );
}

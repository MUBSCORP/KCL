// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { login } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [username, setUser] = useState('');
    const [password, setPass] = useState('');
    const [err, setErr] = useState<string|null>(null);
    const setAuth = useAuthStore((s) => s.setAuth);
    const router = useRouter();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr(null);
        try {
            const res = await login({ username, password });
            const user = { username: res.username, dept: res.dept, displayName: res.displayName };
            setAuth(res.accessToken, user);
            router.replace('/protected/dashboard'); // 로그인 후 대시보드
        } catch {
            setErr('로그인 실패: 아이디/비밀번호 확인');
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
            <Card sx={{ width: 380 }}>
                <CardContent>
                    <Typography variant="h6" mb={2}>KDASH 로그인</Typography>
                    <form onSubmit={onSubmit}>
                        <Stack spacing={2}>
                            <TextField label="아이디" size="small" value={username} onChange={e=>setUser(e.target.value)} />
                            <TextField label="비밀번호" type="password" size="small" value={password} onChange={e=>setPass(e.target.value)} />
                            {err && <Typography color="error" variant="body2">{err}</Typography>}
                            <Button type="submit" variant="contained">로그인</Button>
                        </Stack>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
}

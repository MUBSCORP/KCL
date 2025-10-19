'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

export function useHydrateAuth() {
    const setAuth = useAuthStore((s) => s.setAuth);
    const token = useAuthStore((s) => s.token);

    useEffect(() => {
        if (!token) {
            const t = localStorage.getItem('accessToken');
            const u = localStorage.getItem('userInfo');
            if (t && u) setAuth(t, JSON.parse(u));
        }
    }, [token, setAuth]);
}

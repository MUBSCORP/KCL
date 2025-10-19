'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useHydrateAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';

const BYPASS = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const token = useAuthStore((s) => s.token);
    const [ready, setReady] = useState(false);

    useHydrateAuth();

    useEffect(() => {
        // 개발 중: 인증 우회
        if (BYPASS) {
            setReady(true);
            return;
        }

        // 운영/스테이징: 기존 체크 유지
        const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
        if (!t) {
            router.replace(process.env.NEXT_PUBLIC_LOGIN_PATH || '/login');
            setReady(false);
            return;
        }
        setReady(true);
    }, [token, router]);

    // SSR/CSR 미스매치 방지
    if (!ready) return null;

    return <AppShell>{children}</AppShell>;
}

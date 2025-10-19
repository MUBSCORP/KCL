'use client';
import { create } from 'zustand';

type User = { username: string; dept?: string; displayName?: string } | null;

type AuthState = {
    token: string | null;
    user: User;
    setAuth: (token: string, user: User) => void;
    clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    setAuth: (token, user) => {
        localStorage.setItem('accessToken', token);
        localStorage.setItem('userInfo', JSON.stringify(user || {}));
        set({ token, user });
    },
    clear: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userInfo');
        set({ token: null, user: null });
    },
}));

'use client';
import { create } from 'zustand';

// 🔹 서버 응답 구조에 맞춘 User 타입
//    username: 로그인 ID
//    memId   : 명시적인 아이디 필드 (백엔드에서 따로 내려줌)
//    dept    : 소속
//    displayName: 이름
export type User = {
  username: string;
  memId?: string;
  dept?: string;
  displayName?: string;
  mgtIdx?: number;
} | null;

type AuthState = {
  token: string | null;
  user: User;
  setAuth: (token: string, user: NonNullable<User>) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  // ✅ 로그인 성공 시 호출
  setAuth: (token, user) => {
    // localStorage 저장
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userInfo', JSON.stringify(user || {}));

    set({ token, user });
  },

  // ✅ 로그아웃 시 호출
  clear: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userInfo');
    set({ token: null, user: null });
  },
}));

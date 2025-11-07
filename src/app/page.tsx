// src/app/page.tsx (서버 컴포넌트)
import { redirect } from 'next/navigation';

export default function Home() {
    redirect('/public/dashboard-pack');   // 루트 접근 시 로그인 페이지로
}

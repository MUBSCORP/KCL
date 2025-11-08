import { redirect } from 'next/navigation';

export default function Home() {
    const raw = (process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD || 'PACK').trim().toUpperCase();
    const type = raw === 'CELL' ? 'CELL' : 'PACK';

    redirect(type === 'CELL' ? '/public/dashboard-cell' : '/public/dashboard-pack');
}
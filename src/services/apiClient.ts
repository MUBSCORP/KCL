export const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

function authHeader() {
    const t = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const r = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...authHeader(),
            ...(init?.headers || {}),
        },
        cache: 'no-store',
        credentials: 'include',
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<T>;
}

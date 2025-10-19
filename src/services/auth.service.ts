import { API_BASE } from './apiClient';

type LoginReq = { username: string; password: string };
type LoginRes = { accessToken: string; username: string; dept?: string; displayName?: string };

export async function login(req: LoginReq): Promise<LoginRes> {
    const r = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
    });
    if (!r.ok) throw new Error('Login failed');
    return r.json();
}

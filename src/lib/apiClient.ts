import { LoginReq, LoginRes } from "@/types/auth";
const BASE = process.env.NEXT_PUBLIC_API_BASE!;
async function json<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const m = await res.text().catch(() => "");
        throw new Error(m || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
}

export async function loginRequest(body: LoginReq): Promise<LoginRes> {
    const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    return json<LoginRes>(res);
}
export async function apiGet<T>(path: string, token?: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
    });
    return json<T>(res);
}

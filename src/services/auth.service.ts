import { API_BASE } from './apiClient';

type LoginReq = { username: string; password: string };

export type LoginRes = {
  accessToken: string;
  username: string;   // 로그인 ID
  memId: string;
  dept?: string;
  displayName?: string;
};

type ErrorRes = {
  code: string;
  message: string;
};

// ❗ 더 이상 Error를 throw 하지 않고, 성공/실패를 나눠서 리턴
export async function login(
  req: LoginReq,
): Promise<{ ok: true; data: LoginRes } | { ok: false; message: string }> {
  const r = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  let body: any = null;
  try {
    body = await r.json();
  } catch {
    // body 없는 경우도 있으니 무시
  }

  if (!r.ok) {
    const errBody = body as Partial<ErrorRes> | null;
    const message = errBody?.message || '로그인에 실패했습니다.';
    return { ok: false, message };
  }

  return { ok: true, data: body as LoginRes };
}

// Thin fetch wrapper. Token lives in localStorage for V1;
// move to httpOnly cookie + refresh rotation when hardening.

const BASE = '/api';

export function getToken(): string | null {
  return localStorage.getItem('token');
}
export function setToken(t: string | null) {
  if (t) localStorage.setItem('token', t);
  else localStorage.removeItem('token');
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      msg = Array.isArray(body.message) ? body.message.join(', ') : body.message || msg;
    } catch {
      /* keep statusText */
    }
    throw new ApiError(res.status, msg);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const get = <T,>(p: string) => api<T>(p);
export const post = <T,>(p: string, body: unknown) =>
  api<T>(p, { method: 'POST', body: JSON.stringify(body) });
export const patch = <T,>(p: string, body: unknown) =>
  api<T>(p, { method: 'PATCH', body: JSON.stringify(body) });

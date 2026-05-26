import { getApiUrl } from "./config";

export { getApiUrl } from "./config";

export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const base = getApiUrl().replace(/\/$/, "");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}${path.startsWith("/") ? path : `/${path}`}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

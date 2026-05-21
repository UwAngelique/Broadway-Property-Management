import Constants from "expo-constants";

export function getApiUrl() {
  return (
    (Constants.expoConfig?.extra as { apiUrl?: string })?.apiUrl ??
    process.env.EXPO_PUBLIC_API_URL ??
    "http://localhost:3000"
  );
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${getApiUrl()}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

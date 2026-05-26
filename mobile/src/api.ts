import * as SecureStore from "expo-secure-store";
import { parseApiError } from "./api-errors";
import { getApiUrl } from "./config";
import { clearSession } from "./session";

export { getApiUrl } from "./config";

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await SecureStore.getItemAsync("refresh");
  if (!refresh) return null;

  if (!refreshPromise) {
    const base = getApiUrl().replace(/\/$/, "");
    refreshPromise = fetch(`${base}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    })
      .then(async (res) => {
        if (!res.ok) {
          await clearSession();
          return null;
        }
        const data = (await res.json()) as {
          accessToken: string;
          refreshToken: string;
          user: unknown;
        };
        await SecureStore.setItemAsync("access", data.accessToken);
        await SecureStore.setItemAsync("refresh", data.refreshToken);
        await SecureStore.setItemAsync("user", JSON.stringify(data.user));
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const base = getApiUrl().replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  let accessToken = token ?? (await SecureStore.getItemAsync("access")) ?? undefined;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, headers });
      accessToken = newToken;
    } else {
      throw new Error(parseApiError("", 401));
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseApiError(text, res.status));
  }
  return res.json() as Promise<T>;
}

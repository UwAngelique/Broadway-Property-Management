import { parseApiError } from "./api-errors";
import { clearSession } from "./auth";
import { refreshAccessToken } from "./token-refresh";

/** Use /api proxy in browser (tunnel-friendly); direct URL for server or explicit env */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (typeof window !== "undefined" ? "/api" : "http://localhost:3000");

async function fetchWithAuth(path: string, options: RequestInit, accessToken?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401 && accessToken && typeof window !== "undefined") {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    } else {
      clearSession();
      window.location.href = "/login";
    }
  }

  return response;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const response = await fetchWithAuth(path, options, accessToken);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(parseApiError(text, response.status));
  }
  return response.json() as Promise<T>;
}

/** Download a binary (e.g. PDF) with Bearer auth; triggers browser save. */
export async function apiDownload(path: string, accessToken: string, filename: string): Promise<void> {
  let response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status === 401 && typeof window !== "undefined") {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await fetch(`${API_BASE_URL}${path}`, {
        headers: { Authorization: `Bearer ${newToken}` },
      });
    } else {
      clearSession();
      window.location.href = "/login";
      return;
    }
  }
  if (!response.ok) {
    const text = await response.text();
    throw new Error(parseApiError(text, response.status));
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  accessToken: string,
): Promise<T> {
  let response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  if (response.status === 401 && typeof window !== "undefined") {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${newToken}` },
        body: formData,
      });
    } else {
      clearSession();
      window.location.href = "/login";
      throw new Error(parseApiError("", 401));
    }
  }
  if (!response.ok) {
    const text = await response.text();
    throw new Error(parseApiError(text, response.status));
  }
  return response.json() as Promise<T>;
}

"use client";

import { API_BASE_URL } from "./api";
import { clearSession } from "./auth";

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const refresh = localStorage.getItem("pm_refresh_token");
  if (!refresh) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    })
      .then(async (res) => {
        if (!res.ok) {
          clearSession();
          return null;
        }
        const data = (await res.json()) as {
          accessToken: string;
          refreshToken: string;
          user: unknown;
        };
        localStorage.setItem("pm_access_token", data.accessToken);
        localStorage.setItem("pm_refresh_token", data.refreshToken);
        localStorage.setItem("pm_user", JSON.stringify(data.user));
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

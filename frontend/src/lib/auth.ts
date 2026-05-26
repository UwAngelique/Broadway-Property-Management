"use client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (typeof window !== "undefined" ? "/api" : "http://localhost:3000");

export type SessionUser = {
  id: number;
  email: string;
  role: string;
  accountId: number;
  isActive?: boolean;
  accountKind?: string;
  accountActivationStatus?: string;
  parentAccountId?: number | null;
};

export function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("pm_access_token") ?? "";
}

export function getUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("pm_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function requireAuth(): { token: string; user: SessionUser } | null {
  const token = getToken();
  const user = getUser();
  if (!token || !user) return null;
  return { token, user };
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("pm_access_token");
  localStorage.removeItem("pm_refresh_token");
  localStorage.removeItem("pm_user");
  localStorage.removeItem("pm_sync_revision");
}

export async function logout() {
  const token = getToken();
  try {
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch {
    /* still clear local session */
  }
  clearSession();
  window.location.href = "/login";
}

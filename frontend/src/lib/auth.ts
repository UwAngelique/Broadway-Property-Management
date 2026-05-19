"use client";

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

export function logout() {
  localStorage.removeItem("pm_access_token");
  localStorage.removeItem("pm_refresh_token");
  localStorage.removeItem("pm_user");
  window.location.href = "/";
}

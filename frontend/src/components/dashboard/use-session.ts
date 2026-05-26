"use client";

import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";
import { getToken, getUser, type SessionUser } from "@/lib/auth";

export type SessionState = {
  token: string;
  user: SessionUser | null;
  ready: boolean;
};

const SessionContext = createContext<SessionState | null>(null);

/** Read session synchronously so route guards never fire before user is hydrated. */
function readSession(): SessionState {
  if (typeof window === "undefined") {
    return { token: "", user: null, ready: false };
  }
  const token = getToken();
  const user = getUser();
  if (!token || !user) {
    return { token: "", user: null, ready: false };
  }
  return { token, user, ready: true };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>(readSession);

  useEffect(() => {
    const next = readSession();
    if (!next.ready) {
      window.location.href = "/";
      return;
    }
    setSession(next);
  }, []);

  return createElement(SessionContext.Provider, { value: session }, children);
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (ctx) return ctx;
  // Fallback when used outside dashboard layout (should be rare).
  const [session] = useState(readSession);
  return session;
}

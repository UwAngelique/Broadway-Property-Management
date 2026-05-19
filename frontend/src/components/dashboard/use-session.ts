"use client";

import { useEffect, useState } from "react";
import { getToken, getUser, type SessionUser } from "@/lib/auth";

export function useSession() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = getToken();
    const u = getUser();
    if (!t || !u) {
      window.location.href = "/";
      return;
    }
    setToken(t);
    setUser(u);
    setReady(true);
  }, []);

  return { token, user, ready };
}

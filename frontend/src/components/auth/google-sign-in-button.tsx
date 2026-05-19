"use client";

import { useEffect, useRef } from "react";
import { apiRequest } from "@/lib/api";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    role: string;
    accountId: number;
    isActive?: boolean;
    accountKind?: string;
    accountActivationStatus?: string;
    parentAccountId?: number | null;
    subscriptionPlanId?: string | null;
  };
};

type Props = {
  onSuccess: (result: AuthResult) => void;
  onError: (msg: string) => void;
};

export function GoogleSignInButton({ onSuccess, onError }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clientId || !ref.current) return;

    const handleCredential = async (response: { credential: string }) => {
      try {
        const result = await apiRequest<AuthResult>("/auth/google", {
          method: "POST",
          body: JSON.stringify({ idToken: response.credential }),
        });
        onSuccess(result);
      } catch (e) {
        onError(e instanceof Error ? e.message : "Google sign-in failed");
      }
    };

    const init = () => {
      const g = (window as unknown as { google?: { accounts: { id: { initialize: (c: unknown) => void; renderButton: (el: HTMLElement, o: unknown) => void } } } }).google;
      if (!g?.accounts?.id || !ref.current) return;
      g.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
      });
      g.accounts.id.renderButton(ref.current, { theme: "outline", size: "large", width: 320 });
    };

    if ((window as unknown as { google?: unknown }).google) {
      init();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = init;
    document.body.appendChild(script);
  }, [onSuccess, onError]);

  if (!clientId) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 text-center">Sign in with Google (requires GOOGLE_CLIENT_ID in env)</p>
      <div ref={ref} className="flex justify-center" />
    </div>
  );
}

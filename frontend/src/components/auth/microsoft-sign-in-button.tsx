"use client";

import { useCallback, useMemo, useState } from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import { apiRequest } from "@/lib/api";

const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;

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

export function MicrosoftSignInButton({ onSuccess, onError }: Props) {
  const [busy, setBusy] = useState(false);

  const pca = useMemo(() => {
    if (!clientId || typeof window === "undefined") return null;
    return new PublicClientApplication({
      auth: {
        clientId,
        authority: "https://login.microsoftonline.com/common",
        redirectUri: `${window.location.origin}/login`,
      },
      cache: { cacheLocation: "sessionStorage" },
    });
  }, []);

  const signIn = useCallback(async () => {
    if (!pca) return;
    setBusy(true);
    try {
      await pca.initialize();
      const result = await pca.loginPopup({
        scopes: ["openid", "profile", "email"],
      });
      if (!result.idToken) {
        throw new Error("Microsoft did not return an ID token");
      }
      const auth = await apiRequest<AuthResult>("/auth/microsoft", {
        method: "POST",
        body: JSON.stringify({ idToken: result.idToken }),
      });
      onSuccess(auth);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Microsoft sign-in failed");
    } finally {
      setBusy(false);
    }
  }, [pca, onSuccess, onError]);

  if (!clientId) return null;

  return (
    <button
      type="button"
      disabled={busy}
      onClick={signIn}
      className="w-full rounded border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-60"
    >
      {busy ? "Opening Microsoft…" : "Sign in with Microsoft"}
    </button>
  );
}

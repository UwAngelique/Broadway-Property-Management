"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import Image from "next/image";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { FALLBACK_PLANS_RESPONSE } from "@/lib/fallback-plans";

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

type Mode = "signin" | "signup" | "forgot" | "reset";

type SubscriptionPlan = {
  id: string;
  name: string;
  tagline: string;
  priceRwfMonthly: number | null;
  priceLabel: string;
  billingNote: string;
  idealFor: string;
  features: string[];
  limits: { label: string; value: string }[];
  highlighted?: boolean;
};

type BillingPlansResponse = {
  currency: string;
  disclaimer: string;
  plans: SubscriptionPlan[];
};

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountName, setAccountName] = useState("");
  const [googleToken, setGoogleToken] = useState("");
  const [microsoftToken, setMicrosoftToken] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [plansPayload, setPlansPayload] = useState<BillingPlansResponse | null>(null);
  const [plansOffline, setPlansOffline] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("professional");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (mode !== "signup") return;
    setPlansPayload(FALLBACK_PLANS_RESPONSE);
    setPlansOffline(true);
    apiRequest<BillingPlansResponse>("/billing/plans")
      .then((data) => {
        setPlansPayload(data.plans?.length ? data : FALLBACK_PLANS_RESPONSE);
        setPlansOffline(false);
        const plans = data.plans?.length ? data.plans : FALLBACK_PLANS_RESPONSE.plans;
        setSelectedPlanId((current) => {
          if (plans.some((p) => p.id === current)) return current;
          return (plans.find((p) => p.highlighted) ?? plans[0]).id;
        });
      })
      .catch(() => {
        setPlansPayload(FALLBACK_PLANS_RESPONSE);
        setPlansOffline(true);
      });
  }, [mode]);

  const saveSession = (result: AuthResult) => {
    localStorage.setItem("pm_access_token", result.accessToken);
    localStorage.setItem("pm_refresh_token", result.refreshToken);
    localStorage.setItem("pm_user", JSON.stringify(result.user));
    window.location.href = "/dashboard";
  };

  const submitSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const result = await apiRequest<AuthResult>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      saveSession(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const submitSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const result = await apiRequest<AuthResult>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          accountName: accountName || undefined,
          selectedPlanId,
        }),
      });
      saveSession(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const submitForgot = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const result = await apiRequest<{ success: boolean; resetToken?: string; expiresAt?: string; note?: string }>(
        "/auth/forgot-password",
        { method: "POST", body: JSON.stringify({ email }) },
      );
      if (result.resetToken) {
        setMessage(`Reset token: ${result.resetToken} (expires ${result.expiresAt})`);
        setMode("reset");
      } else {
        setMessage("If your email exists, a reset process has been started.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Forgot password failed");
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await apiRequest<{ success: boolean }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      setMessage("Password reset successful. You can now sign in.");
      setMode("signin");
      setPassword("");
      setNewPassword("");
      setResetToken("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset password failed");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogleToken = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const result = await apiRequest<AuthResult>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken: googleToken }),
      });
      saveSession(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const requestPhoneOtp = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const r = await apiRequest<{ success: boolean; devCode?: string }>("/auth/phone/request-otp", {
        method: "POST",
        body: JSON.stringify({ phone, purpose: mode === "signup" ? "SIGNUP" : "LOGIN" }),
      });
      setOtpSent(true);
      setMessage(
        r.devCode ? `Dev OTP: ${r.devCode}` : "Verification code sent via SMS (MTN/Airtel).",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneOtp = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await apiRequest<AuthResult>("/auth/phone/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          phone,
          code: otpCode,
          accountName: accountName || undefined,
          selectedPlanId: mode === "signup" ? selectedPlanId : undefined,
        }),
      });
      saveSession(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const signInWithMicrosoftToken = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const result = await apiRequest<AuthResult>("/auth/microsoft", {
        method: "POST",
        body: JSON.stringify({ idToken: microsoftToken }),
      });
      saveSession(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Microsoft sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const containerClass =
    mode === "signup"
      ? "w-full max-w-5xl rounded-lg border border-gray-300 p-6 space-y-4 bg-white text-gray-900 shadow-sm"
      : "w-full max-w-md rounded-lg border border-gray-300 p-6 space-y-4 bg-white text-gray-900 shadow-sm";

  return (
    <div className={containerClass}>
      <div className="flex justify-center">
        <Image
          src="/broadway-logo.png"
          alt="Broadway Creation logo"
          width={220}
          height={120}
          priority
          className="h-auto w-[220px]"
        />
      </div>
      <h1 className="text-2xl font-semibold text-gray-900">Broadway Property Management</h1>
      <div className="flex gap-3 text-sm text-gray-800 flex-wrap">
        <button className="underline hover:text-black" onClick={() => setMode("signin")} type="button">
          Sign In
        </button>
        <button className="underline hover:text-black" onClick={() => setMode("signup")} type="button">
          Sign Up
        </button>
        <button className="underline hover:text-black" onClick={() => setMode("forgot")} type="button">
          Forgot Password
        </button>
      </div>

      {mode === "signin" && (
        <div className="space-y-4">
          <GoogleSignInButton onSuccess={saveSession} onError={setError} />
        <form onSubmit={submitSignIn} className="space-y-3">
          <input
            className="w-full rounded border border-gray-300 p-2 text-gray-900 placeholder:text-gray-500"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full rounded border border-gray-300 p-2 text-gray-900 placeholder:text-gray-500"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="w-full rounded bg-gray-900 text-white py-2 hover:bg-black" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
          <div className="border-t pt-4 space-y-2">
            <p className="text-sm font-medium text-gray-800">MTN / Airtel phone (Rwanda)</p>
            <input
              className="w-full rounded border border-gray-300 p-2"
              placeholder="0781234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {!otpSent ? (
              <button type="button" className="w-full rounded border py-2 text-sm" disabled={loading} onClick={requestPhoneOtp}>
                Send SMS code
              </button>
            ) : (
              <form onSubmit={verifyPhoneOtp} className="space-y-2">
                <input
                  className="w-full rounded border border-gray-300 p-2"
                  placeholder="6-digit code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                />
                <button className="w-full rounded bg-gray-900 text-white py-2 text-sm" disabled={loading}>
                  Verify & sign in
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {mode === "signup" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-1">Choose your plan</h2>
            <p className="text-sm text-gray-600 mb-3">
              All features are listed per tier. Final billing, VAT, and contracts are confirmed at onboarding. Enterprise &amp; platform
              partner pricing is agreed separately.
            </p>
            {plansPayload?.disclaimer ? <p className="text-xs text-gray-500 mb-3">{plansPayload.disclaimer}</p> : null}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {(plansPayload?.plans ?? []).map((plan) => (
                <label
                  key={plan.id}
                  className={`cursor-pointer rounded-lg border p-3 flex flex-col gap-2 text-left ${
                    selectedPlanId === plan.id ? "border-gray-900 ring-2 ring-gray-900 bg-gray-50" : "border-gray-200"
                  } ${plan.highlighted ? "border-blue-800/40" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="plan"
                      checked={selectedPlanId === plan.id}
                      onChange={() => setSelectedPlanId(plan.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{plan.name}</p>
                      <p className="text-xs text-gray-600">{plan.tagline}</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{plan.priceLabel}</p>
                      <p className="text-xs text-gray-500">{plan.billingNote}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">{plan.idealFor}</p>
                  <ul className="text-xs text-gray-800 list-disc pl-4 space-y-0.5 max-h-40 overflow-y-auto">
                    {plan.features.slice(0, 6).map((f, i) => (
                      <li key={`${plan.id}-${i}`}>{f}</li>
                    ))}
                    {plan.features.length > 6 ? <li>â€¦and more in this tier</li> : null}
                  </ul>
                  <div className="text-[11px] text-gray-500 border-t pt-2 mt-auto">
                    {plan.limits.map((l) => (
                      <span key={l.label} className="mr-2">
                        {l.label}: {l.value}
                      </span>
                    ))}
                  </div>
                </label>
              ))}
            </div>
            {plansOffline ? (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
                Showing offline plan list (API unreachable). Start the backend on port 3000 for live pricing; signup still works with these plan IDs.
              </p>
            ) : null}
          </div>

          <form onSubmit={submitSignUp} className="space-y-3 border-t pt-4">
            <h2 className="text-lg font-medium text-gray-900">Create your workspace</h2>
            <input
              className="w-full rounded border border-gray-300 p-2 text-gray-900 placeholder:text-gray-500"
              placeholder="Workspace / Business Name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
            <input
              className="w-full rounded border border-gray-300 p-2 text-gray-900 placeholder:text-gray-500"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="w-full rounded border border-gray-300 p-2 text-gray-900 placeholder:text-gray-500"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-gray-600">
              Selected plan: <span className="font-medium text-gray-900">{selectedPlanId}</span> â€” stored on your account for billing
              follow-up.
            </p>
            <button className="w-full rounded bg-gray-900 text-white py-2 hover:bg-black" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>
        </div>
      )}

      {mode === "forgot" && (
        <form onSubmit={submitForgot} className="space-y-3">
          <input
            className="w-full rounded border border-gray-300 p-2 text-gray-900 placeholder:text-gray-500"
            placeholder="Your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="w-full rounded bg-gray-900 text-white py-2 hover:bg-black" disabled={loading}>
            {loading ? "Submitting..." : "Request Password Reset"}
          </button>
        </form>
      )}

      {mode === "reset" && (
        <form onSubmit={submitReset} className="space-y-3">
          <input
            className="w-full rounded border border-gray-300 p-2 text-gray-900 placeholder:text-gray-500"
            placeholder="Reset token"
            value={resetToken}
            onChange={(e) => setResetToken(e.target.value)}
            required
          />
          <input
            className="w-full rounded border border-gray-300 p-2 text-gray-900 placeholder:text-gray-500"
            placeholder="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button className="w-full rounded bg-gray-900 text-white py-2 hover:bg-black" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}

      <details className="rounded border border-gray-300 p-3 bg-gray-50">
        <summary className="cursor-pointer text-sm font-medium text-gray-900">Sign in with Google / Microsoft (Pilot Token Mode)</summary>
        <div className="mt-3 space-y-2">
          <input
            className="w-full rounded border border-gray-300 p-2 text-sm text-gray-900 placeholder:text-gray-500"
            placeholder="Google idToken"
            value={googleToken}
            onChange={(e) => setGoogleToken(e.target.value)}
          />
          <button
            className="w-full rounded border border-gray-400 py-2 text-sm text-gray-900 hover:bg-white"
            type="button"
            onClick={signInWithGoogleToken}
          >
            Sign in with Google token
          </button>
          <input
            className="w-full rounded border border-gray-300 p-2 text-sm text-gray-900 placeholder:text-gray-500"
            placeholder="Microsoft idToken"
            value={microsoftToken}
            onChange={(e) => setMicrosoftToken(e.target.value)}
          />
          <button
            className="w-full rounded border border-gray-400 py-2 text-sm text-gray-900 hover:bg-white"
            type="button"
            onClick={signInWithMicrosoftToken}
          >
            Sign in with Microsoft token
          </button>
        </div>
      </details>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-blue-700">{message}</p> : null}
      <p className="text-xs text-gray-500">Note: username recovery is email-based; use &quot;Forgot Password&quot; with your email.</p>
    </div>
  );
}


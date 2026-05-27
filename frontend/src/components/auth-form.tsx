"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import Image from "next/image";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { MicrosoftSignInButton } from "@/components/auth/microsoft-sign-in-button";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { FALLBACK_PLANS_RESPONSE } from "@/lib/fallback-plans";
import { useLanguage } from "@/components/i18n/language-provider";

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
  const { t, apiLanguage } = useLanguage();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountName, setAccountName] = useState("");
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = new URLSearchParams(window.location.search).get("reset");
    if (!token) return;
    setResetToken(token);
    setMode("reset");
    setMessage(t("auth.chooseNewPassword"));
    window.history.replaceState({}, "", "/login");
  }, [t]);

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
          language: apiLanguage,
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
        setMessage(t("auth.resetStarted"));
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
      setMessage(t("auth.passwordResetSuccess"));
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
        r.devCode ? `Dev OTP: ${r.devCode}` : t("auth.smsSent"),
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
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>
      <h1 className="text-2xl font-semibold text-gray-900">Broadway Property Management</h1>
      <div className="flex gap-3 text-sm text-gray-800 flex-wrap">
        <button className="underline hover:text-black" onClick={() => setMode("signin")} type="button">
          {t("auth.signIn")}
        </button>
        <button className="underline hover:text-black" onClick={() => setMode("signup")} type="button">
          {t("auth.signUp")}
        </button>
        <button className="underline hover:text-black" onClick={() => setMode("forgot")} type="button">
          {t("auth.forgotPassword")}
        </button>
      </div>

      {mode === "signin" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <GoogleSignInButton onSuccess={saveSession} onError={setError} />
            <MicrosoftSignInButton onSuccess={saveSession} onError={setError} />
          </div>
          <p className="text-center text-xs text-gray-500">{t("auth.signInWithEmail")}</p>
        <form onSubmit={submitSignIn} className="space-y-3">
          <input
            className="w-full rounded border border-gray-300 p-2 text-gray-900 placeholder:text-gray-500"
            placeholder={t("auth.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            className="w-full rounded border border-gray-300 p-2 text-gray-900 placeholder:text-gray-500"
            placeholder={t("auth.password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button className="w-full rounded bg-gray-900 text-white py-2 hover:bg-black" disabled={loading}>
            {loading ? t("auth.signingIn") : t("auth.signIn")}
          </button>
        </form>
          <div className="border-t pt-4 space-y-2">
            <p className="text-sm font-medium text-gray-800">{t("auth.phoneRwanda")}</p>
            <input
              className="w-full rounded border border-gray-300 p-2"
              placeholder={t("auth.phonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {!otpSent ? (
              <button type="button" className="w-full rounded border py-2 text-sm" disabled={loading} onClick={requestPhoneOtp}>
                {t("auth.sendSmsCode")}
              </button>
            ) : (
              <form onSubmit={verifyPhoneOtp} className="space-y-2">
                <input
                  className="w-full rounded border border-gray-300 p-2"
                  placeholder={t("auth.otpPlaceholder")}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                />
                <button className="w-full rounded bg-gray-900 text-white py-2 text-sm" disabled={loading}>
                  {t("auth.verifyAndSignIn")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {mode === "signup" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-1">{t("auth.choosePlan")}</h2>
            <p className="text-sm text-gray-600 mb-3">{t("auth.planIntro")}</p>
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
                    {plan.features.length > 6 ? <li>{t("auth.andMore")}</li> : null}
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
                {t("auth.offlinePlans")}
              </p>
            ) : null}
          </div>

          <form onSubmit={submitSignUp} className="space-y-3 border-t pt-4">
            <h2 className="text-lg font-medium text-gray-900">{t("auth.createWorkspace")}</h2>
            <input
              className="w-full rounded border border-gray-300 p-2 text-gray-900 placeholder:text-gray-500"
              placeholder={t("auth.workspaceName")}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
            <input
              className="w-full rounded border border-gray-300 p-2 text-gray-900 placeholder:text-gray-500"
              placeholder={t("auth.email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="w-full rounded border border-gray-300 p-2 text-gray-900 placeholder:text-gray-500"
              placeholder={t("auth.password")}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
            <p className="text-xs text-gray-600">{t("auth.passwordHint")}</p>
            <p className="text-xs text-gray-600">
              {t("auth.selectedPlan")} <span className="font-medium text-gray-900">{selectedPlanId}</span>
            </p>
            <button className="w-full rounded bg-gray-900 text-white py-2 hover:bg-black" disabled={loading}>
              {loading ? t("auth.creatingAccount") : t("auth.signUp")}
            </button>
          </form>
        </div>
      )}

      {mode === "forgot" && (
        <form onSubmit={submitForgot} className="space-y-3">
          <input
            className="w-full rounded border border-gray-300 p-2 text-gray-900 placeholder:text-gray-500"
            placeholder={t("auth.yourEmail")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="w-full rounded bg-gray-900 text-white py-2 hover:bg-black" disabled={loading}>
            {loading ? t("auth.submitting") : t("auth.requestPasswordReset")}
          </button>
        </form>
      )}

      {mode === "reset" && (
        <form onSubmit={submitReset} className="space-y-3">
          <input
            className="w-full rounded border border-gray-300 p-2 text-gray-900 placeholder:text-gray-500"
            placeholder={t("auth.resetToken")}
            value={resetToken}
            onChange={(e) => setResetToken(e.target.value)}
            required
          />
          <input
            className="w-full rounded border border-gray-300 p-2 text-gray-900 placeholder:text-gray-500"
            placeholder={t("auth.newPassword")}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button className="w-full rounded bg-gray-900 text-white py-2 hover:bg-black" disabled={loading}>
            {loading ? t("auth.resetting") : t("auth.resetPasswordBtn")}
          </button>
        </form>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-blue-700">{message}</p> : null}
      <p className="text-xs text-gray-500">{t("auth.usernameNote")}</p>
    </div>
  );
}


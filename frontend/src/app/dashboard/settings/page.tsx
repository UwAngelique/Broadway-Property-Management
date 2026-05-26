"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { useSession } from "@/components/dashboard/use-session";
import { StatusBanner } from "@/components/dashboard/status-banner";

type PaymentSettings = {
  enableBankTransferProof: boolean;
  enableMtnMomo: boolean;
  enableAirtelMoney: boolean;
};

export default function SettingsPage() {
  const { token, user } = useSession();
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canEditPayments = user?.role === "OWNER";

  useEffect(() => {
    if (!token || !user) return;
    if (user.role === "TENANT") {
      window.location.href = "/dashboard";
      return;
    }
    if (user.role === "PLATFORM_OWNER") {
      setSettings(null);
      return;
    }
    apiRequest<PaymentSettings>("/payments/settings", {}, token)
      .then(setSettings)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load settings"));
  }, [token, user]);

  const save = async () => {
    if (!token || !settings || !canEditPayments) return;
    try {
      await apiRequest("/payments/settings", { method: "PATCH", body: JSON.stringify(settings) }, token);
      setMessage("Payment settings saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  if (!user) return null;

  return (
    <DashboardPage title="Settings">
      <StatusBanner message={message} error={error} />

      {user.role === "PLATFORM_OWNER" ? (
        <section className="bg-white rounded-xl border p-4 mb-4 space-y-2 text-sm">
          <h2 className="font-semibold">Platform operator</h2>
          <p className="text-gray-600">
            Manage landlord clients from the <Link href="/dashboard/clients" className="text-blue-700 underline">Clients</Link> page.
            Payment method toggles are configured per landlord workspace.
          </p>
        </section>
      ) : (
      <section className="bg-white rounded-xl border p-4 mb-4 space-y-3">
        <h2 className="font-semibold">Manual payment methods (pilot)</h2>
        <p className="text-sm text-gray-600">
          {canEditPayments
            ? "Enable how tenants can submit proof while bank/MoMo APIs are pending."
            : "View-only for your role. Ask the workspace owner to change payment methods."}
        </p>
        {settings ? (
          <div className="space-y-2 text-sm">
            {(
              [
                ["enableBankTransferProof", "Bank transfer proof"],
                ["enableMtnMomo", "MTN MoMo (manual)"],
                ["enableAirtelMoney", "Airtel Money (manual)"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings[key]}
                  disabled={!canEditPayments}
                  onChange={(e) => setSettings((s) => (s ? { ...s, [key]: e.target.checked } : s))}
                />
                {label}
              </label>
            ))}
            {canEditPayments ? (
              <button type="button" className="rounded bg-gray-900 text-white px-4 py-2 text-sm mt-2" onClick={save}>
                Save
              </button>
            ) : null}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Loading…</p>
        )}
      </section>
      )}

      {user.role !== "PLATFORM_OWNER" ? (
      <section className="bg-white rounded-xl border p-4 mb-4 space-y-2 text-sm">
        <h2 className="font-semibold">Team & workspace</h2>
        {user.role === "OWNER" ? (
          <p>
            <Link href="/dashboard/team" className="text-blue-700 underline">
              Manage team (owner, accountant, lawyer)
            </Link>
          </p>
        ) : (
          <p className="text-gray-600">Team invites are managed by the workspace owner.</p>
        )}
        <p>
          <Link href="/dashboard/onboarding" className="text-blue-700 underline">
            Setup guide
          </Link>
        </p>
      </section>
      ) : null}

      {user.role === "OWNER" ? (
        <section className="bg-white rounded-xl border p-4 mb-4 space-y-3 text-sm">
          <h2 className="font-semibold">Broadway subscription billing</h2>
          <p className="text-gray-600">
            Pay your SaaS plan via Stripe (cards). Configure STRIPE_PRICE_* on the API server first.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded bg-gray-900 text-white px-4 py-2"
              onClick={async () => {
                if (!token) return;
                const r = await apiRequest<{ checkoutUrl: string }>(
                  "/billing/checkout",
                  { method: "POST", body: JSON.stringify({ planId: "professional" }) },
                  token,
                );
                if (r.checkoutUrl) window.location.href = r.checkoutUrl;
              }}
            >
              Subscribe (Professional)
            </button>
            <button
              type="button"
              className="rounded border px-4 py-2"
              onClick={async () => {
                if (!token) return;
                const r = await apiRequest<{ url: string }>("/billing/portal", { method: "POST" }, token);
                if (r.url) window.location.href = r.url;
              }}
            >
              Manage billing
            </button>
          </div>
        </section>
      ) : null}

      <section className="bg-white rounded-xl border p-4 space-y-2 text-sm">
        <h2 className="font-semibold">Legal & support</h2>
        <p>
          <Link href="/legal/terms" className="text-blue-700 underline">
            Terms of service
          </Link>
          {" · "}
          <Link href="/legal/privacy" className="text-blue-700 underline">
            Privacy (Rwanda)
          </Link>
          {" · "}
          <Link href="/contact" className="text-blue-700 underline">
            Contact support
          </Link>
        </p>
      </section>
    </DashboardPage>
  );
}

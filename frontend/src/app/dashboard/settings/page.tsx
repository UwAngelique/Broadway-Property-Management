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
    if (user.role === "TENANT" || user.role === "PLATFORM_OWNER") {
      window.location.href = "/dashboard";
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

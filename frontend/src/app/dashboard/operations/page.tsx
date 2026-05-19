"use client";

import { useEffect, useState } from "react";
import { apiRequest, API_BASE_URL } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useSession } from "@/components/dashboard/use-session";
import { StatusBanner } from "@/components/dashboard/status-banner";

type Trend = { month: string; amountRwf: number };

export default function OperationsPage() {
  const { token, user } = useSession();
  const [trend, setTrend] = useState<Trend[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user || user.role === "TENANT") {
      window.location.href = "/dashboard";
      return;
    }
    if (token && user.role !== "PLATFORM_OWNER") {
      apiRequest<Trend[]>("/analytics/revenue-trend", {}, token).then(setTrend).catch(() => null);
    }
  }, [token, user]);

  const runReminders = async () => {
    if (!token) return;
    const r = await apiRequest<{ createdCount: number }>("/payments/rent-reminders/run", { method: "POST" }, token);
    setMessage(`Reminder batch: ${r.createdCount} invoices created.`);
  };

  const runReconciliation = async () => {
    if (!token) return;
    const r = await apiRequest<{ scanned: number }>("/payments/reconciliation/run", { method: "POST" }, token);
    setMessage(`Reconciliation scanned ${r.scanned} pending payments.`);
  };

  if (!user) return null;
  const trendMax = Math.max(1, ...trend.map((t) => t.amountRwf));

  return (
    <DashboardShell user={user} title="Operations">
      <StatusBanner message={message} />

      {user.role !== "PLATFORM_OWNER" ? (
        <>
          <section className="bg-white rounded-xl border p-4 mb-6 flex flex-wrap gap-2">
            <button type="button" className="rounded bg-gray-900 text-white px-4 py-2 text-sm" onClick={runReminders}>
              Run rent reminder batch
            </button>
            <button type="button" className="rounded border px-4 py-2 text-sm" onClick={runReconciliation}>
              Run payment reconciliation
            </button>
            <a className="rounded border px-4 py-2 text-sm" href={`${API_BASE_URL}/payments/rent-reminders/upcoming`} target="_blank" rel="noreferrer">
              Upcoming reminders
            </a>
            <a className="rounded border px-4 py-2 text-sm" href={`${API_BASE_URL}/analytics/building-performance`} target="_blank" rel="noreferrer">
              Building report
            </a>
          </section>

          <section className="bg-white rounded-xl border p-4">
            <h2 className="font-semibold mb-3">Revenue trend (12 months)</h2>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2 items-end h-40">
              {trend.map((item) => (
                <div key={item.month} className="flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-gray-900"
                    style={{ height: `${Math.max(8, (item.amountRwf / trendMax) * 120)}px` }}
                  />
                  <p className="text-[10px] text-gray-600">{item.month.slice(5)}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <p className="text-sm text-gray-600">Use the Clients department to provision and activate landlord workspaces.</p>
      )}
    </DashboardShell>
  );
}


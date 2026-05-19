"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useSession } from "@/components/dashboard/use-session";
import { StatusBanner } from "@/components/dashboard/status-banner";
import { fmtRwf } from "@/lib/format";

type PlatformClientRow = {
  accountId: number;
  name: string;
  activationStatus: string;
  userCount: number;
  activeUsers: number;
  openTaxItems: number;
  overview: { collectedThisMonthRwf: number };
};

type PlatformOverview = {
  clientCount: number;
  clients: PlatformClientRow[];
};

export default function ClientsPage() {
  const { token, user } = useSession();
  const [data, setData] = useState<PlatformOverview | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    workspaceName: "",
    ownerEmail: "",
    ownerPassword: "",
    initialActivationStatus: "PENDING" as "PENDING" | "ACTIVE",
  });

  const load = () => {
    if (!token) return;
    apiRequest<PlatformOverview>("/platform/overview", {}, token).then(setData).catch((e) => setError(e.message));
  };

  useEffect(() => {
    if (!user || user.role !== "PLATFORM_OWNER") {
      window.location.href = "/dashboard";
      return;
    }
    load();
  }, [token, user]);

  const provision = async () => {
    if (!token) return;
    setMessage("");
    setError("");
    try {
      await apiRequest("/platform/clients/workspace", { method: "POST", body: JSON.stringify(form) }, token);
      setMessage("Client workspace created.");
      setForm({ workspaceName: "", ownerEmail: "", ownerPassword: "", initialActivationStatus: "PENDING" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  const setStatus = async (accountId: number, status: "PENDING" | "ACTIVE" | "SUSPENDED") => {
    if (!token) return;
    await apiRequest(`/platform/clients/${accountId}/activation`, { method: "PATCH", body: JSON.stringify({ status }) }, token);
    setMessage(`Client #${accountId} â†’ ${status}`);
    load();
  };

  if (!user) return null;

  return (
    <DashboardShell user={user} title={`Clients (${data?.clientCount ?? 0})`}>
      <StatusBanner message={message} error={error} />

      <section className="bg-white rounded-xl border p-4 mb-6 space-y-3">
        <h2 className="font-semibold text-gray-900">Provision landlord client</h2>
        <div className="grid md:grid-cols-2 gap-2">
          <input className="border rounded px-3 py-2 text-sm" placeholder="Company name" value={form.workspaceName} onChange={(e) => setForm((s) => ({ ...s, workspaceName: e.target.value }))} />
          <input className="border rounded px-3 py-2 text-sm" placeholder="Owner email" value={form.ownerEmail} onChange={(e) => setForm((s) => ({ ...s, ownerEmail: e.target.value }))} />
          <input className="border rounded px-3 py-2 text-sm" placeholder="Password" type="password" value={form.ownerPassword} onChange={(e) => setForm((s) => ({ ...s, ownerPassword: e.target.value }))} />
          <select className="border rounded px-3 py-2 text-sm" value={form.initialActivationStatus} onChange={(e) => setForm((s) => ({ ...s, initialActivationStatus: e.target.value as "PENDING" | "ACTIVE" }))}>
            <option value="PENDING">PENDING</option>
            <option value="ACTIVE">ACTIVE</option>
          </select>
        </div>
        <button type="button" className="rounded bg-gray-900 text-white px-4 py-2 text-sm" onClick={provision}>
          Create client
        </button>
      </section>

      <section className="bg-white rounded-xl border overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr className="text-gray-600">
              <th className="p-3">Client</th>
              <th className="p-3">Status</th>
              <th className="p-3">Users</th>
              <th className="p-3">Open tax</th>
              <th className="p-3">Collected</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.clients.map((c) => (
              <tr key={c.accountId} className="border-b">
                <td className="p-3 font-medium text-gray-900">{c.name}</td>
                <td className="p-3">{c.activationStatus}</td>
                <td className="p-3">{c.activeUsers}/{c.userCount}</td>
                <td className="p-3">{c.openTaxItems}</td>
                <td className="p-3">{fmtRwf(c.overview.collectedThisMonthRwf)}</td>
                <td className="p-3 flex gap-1 flex-wrap">
                  <button type="button" className="text-xs border rounded px-2 py-1" onClick={() => setStatus(c.accountId, "ACTIVE")}>Activate</button>
                  <button type="button" className="text-xs border rounded px-2 py-1" onClick={() => setStatus(c.accountId, "SUSPENDED")}>Suspend</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.clients.length ? <p className="p-4 text-gray-500">No clients yet.</p> : null}
      </section>
    </DashboardShell>
  );
}


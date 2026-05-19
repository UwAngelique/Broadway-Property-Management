"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { useSession } from "@/components/dashboard/use-session";
import { StatusBanner } from "@/components/dashboard/status-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading-page";

type Building = { id: number; name: string };
type Unit = { id: number; unitName: string; floor?: string; buildingId: number };

export default function UnitsPage() {
  const { token, user } = useSession();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ buildingId: "", unitName: "", floor: "" });

  const load = async () => {
    if (!token) return;
    const [b, u] = await Promise.all([
      apiRequest<Building[]>("/buildings", {}, token),
      apiRequest<Unit[]>("/units", {}, token),
    ]);
    setBuildings(b);
    setUnits(u);
    setLoading(false);
  };

  useEffect(() => {
    if (!user || user.role === "TENANT" || user.role === "PLATFORM_OWNER") {
      window.location.href = "/dashboard";
      return;
    }
    load().catch((e) => {
      setError(e.message);
      setLoading(false);
    });
  }, [token, user]);

  const save = async () => {
    if (!token || !form.buildingId) return;
    await apiRequest("/units", { method: "POST", body: JSON.stringify({ buildingId: Number(form.buildingId), unitName: form.unitName, floor: form.floor || undefined }) }, token);
    setMessage("Unit added.");
    setForm({ buildingId: "", unitName: "", floor: "" });
    load();
  };

  if (loading) {
    return (
      <DashboardPage title="Units">
        <LoadingPage />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage title={`Units (${units.length})`}>
      <StatusBanner message={message} error={error} />
      <p className="text-sm text-gray-600 mb-4">All amounts on invoices are in RWF. Link each unit to a property (building) with UPI on the property record.</p>

      {user?.role === "OWNER" || user?.role === "LAWYER" ? (
        <section className="bg-white rounded-xl border p-4 mb-6 grid md:grid-cols-4 gap-2">
          <select className="border rounded px-3 py-2 text-sm" value={form.buildingId} onChange={(e) => setForm((s) => ({ ...s, buildingId: e.target.value }))}>
            <option value="">Property</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <input className="border rounded px-3 py-2 text-sm" placeholder="Unit name" value={form.unitName} onChange={(e) => setForm((s) => ({ ...s, unitName: e.target.value }))} />
          <input className="border rounded px-3 py-2 text-sm" placeholder="Floor" value={form.floor} onChange={(e) => setForm((s) => ({ ...s, floor: e.target.value }))} />
          <button type="button" className="rounded bg-gray-900 text-white px-4 py-2 text-sm" onClick={save}>
            Add unit
          </button>
        </section>
      ) : null}

      <section className="bg-white rounded-xl border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 text-left">Unit</th>
              <th className="p-3 text-left">Floor</th>
              <th className="p-3 text-left">Property</th>
            </tr>
          </thead>
          <tbody>
            {units.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="p-3 font-medium">{u.unitName}</td>
                <td className="p-3">{u.floor ?? "â€”"}</td>
                <td className="p-3">{buildings.find((b) => b.id === u.buildingId)?.name ?? `#${u.buildingId}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!units.length ? <EmptyState title="No units yet" description="Add a property first, then register units here." /> : null}
      </section>
    </DashboardPage>
  );
}


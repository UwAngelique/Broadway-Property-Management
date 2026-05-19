"use client";

import { useEffect, useState } from "react";
import { apiRequest, apiUpload, apiDownload } from "@/lib/api";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { useSession } from "@/components/dashboard/use-session";
import { StatusBanner } from "@/components/dashboard/status-banner";

type TenantProfile = {
  id: number;
  fullName?: string;
  companyName?: string;
  phone?: string;
  userId: number;
};

type AccountUser = { id: number; email: string; role: string; isActive: boolean };
type Unit = { id: number; unitName: string; buildingId: number };

export default function CustomersPage() {
  const { token, user } = useSession();
  const [tenants, setTenants] = useState<TenantProfile[]>([]);
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [invite, setInvite] = useState({
    email: "",
    password: "",
    unitId: "",
    fullName: "",
    companyName: "",
    phone: "",
    businessSector: "Retail",
    tinNumber: "",
  });

  const load = async () => {
    if (!token) return;
    const [t, u, un] = await Promise.all([
      apiRequest<TenantProfile[]>("/tenants", {}, token),
      apiRequest<AccountUser[]>("/accounts/users", {}, token),
      apiRequest<Unit[]>("/units", {}, token).catch(() => []),
    ]);
    setTenants(t);
    setUsers(u.filter((x) => x.role === "TENANT"));
    setUnits(un);
  };

  useEffect(() => {
    if (!user || user.role === "TENANT" || user.role === "PLATFORM_OWNER") {
      if (user?.role === "PLATFORM_OWNER") window.location.href = "/dashboard/clients";
      else if (user?.role === "TENANT") window.location.href = "/dashboard/portal";
      return;
    }
    load().catch((e) => setError(e.message));
  }, [token, user]);

  const inviteTenant = async () => {
    if (!token || !invite.unitId) return;
    try {
      await apiRequest("/tenants/signup", {
        method: "POST",
        body: JSON.stringify({
          email: invite.email,
          password: invite.password,
          unitId: Number(invite.unitId),
          fullName: invite.fullName || invite.companyName || "Tenant",
          companyName: invite.companyName || invite.fullName || "Tenant Co",
          businessSector: invite.businessSector || "General",
          tinNumber: invite.tinNumber || "000000000",
          phone: invite.phone || "+250000000000",
        }),
      }, token);
      setMessage("Tenant profile and login created.");
      setInvite({
        email: "",
        password: "",
        unitId: "",
        fullName: "",
        companyName: "",
        phone: "",
        businessSector: "Retail",
        tinNumber: "",
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  const uploadRdb = async (tenantId: number, file: File) => {
    if (!token) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      await apiUpload(`/tenants/${tenantId}/rdb-certificate`, fd, token);
      setMessage("RDB certificate uploaded.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const downloadRdb = async (tenantId: number) => {
    if (!token) return;
    try {
      await apiDownload(`/tenants/${tenantId}/rdb-certificate/download`, token, `rdb-tenant-${tenantId}.pdf`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    }
  };

  const toggleActive = async (userId: number, isActive: boolean) => {
    if (!token) return;
    await apiRequest(`/accounts/users/${userId}/activation`, { method: "PATCH", body: JSON.stringify({ isActive }) }, token);
    load();
  };

  if (!user) return null;
  const count = tenants.length || users.length;

  return (
    <DashboardPage title={`Tenants (${count})`}>
      <StatusBanner message={message} error={error} />

      {user.role === "OWNER" ? (
        <section className="bg-white rounded-xl border p-4 mb-6 space-y-2">
          <h2 className="font-semibold text-gray-900">Add tenant (profile + login)</h2>
          <p className="text-sm text-gray-600">Assign a unit so the tenant can use the portal, leases, and payments.</p>
          <div className="grid md:grid-cols-2 gap-2">
            <select className="border rounded px-3 py-2 text-sm md:col-span-2" value={invite.unitId} onChange={(e) => setInvite((s) => ({ ...s, unitId: e.target.value }))}>
              <option value="">Select unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unitName} (#{u.id})
                </option>
              ))}
            </select>
            <input className="border rounded px-3 py-2 text-sm" placeholder="Email" value={invite.email} onChange={(e) => setInvite((s) => ({ ...s, email: e.target.value }))} />
            <input className="border rounded px-3 py-2 text-sm" type="password" placeholder="Temp password" value={invite.password} onChange={(e) => setInvite((s) => ({ ...s, password: e.target.value }))} />
            <input className="border rounded px-3 py-2 text-sm" placeholder="Full name" value={invite.fullName} onChange={(e) => setInvite((s) => ({ ...s, fullName: e.target.value }))} />
            <input className="border rounded px-3 py-2 text-sm" placeholder="Company" value={invite.companyName} onChange={(e) => setInvite((s) => ({ ...s, companyName: e.target.value }))} />
            <input className="border rounded px-3 py-2 text-sm" placeholder="Phone" value={invite.phone} onChange={(e) => setInvite((s) => ({ ...s, phone: e.target.value }))} />
            <input className="border rounded px-3 py-2 text-sm" placeholder="TIN" value={invite.tinNumber} onChange={(e) => setInvite((s) => ({ ...s, tinNumber: e.target.value }))} />
          </div>
          <button type="button" className="rounded bg-gray-900 text-white px-4 py-2 text-sm mt-2" onClick={inviteTenant}>
            Create tenant
          </button>
        </section>
      ) : null}

      <section className="bg-white rounded-xl border divide-y">
        {tenants.map((t) => {
          const login = users.find((u) => u.id === t.userId);
          return (
            <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:justify-between gap-2">
              <div>
                <p className="font-medium text-gray-900">{t.fullName || t.companyName || `Tenant #${t.id}`}</p>
                <p className="text-sm text-gray-600">
                  {login?.email ?? `User #${t.userId}`} · {t.phone ?? "—"}
                </p>
              </div>
              <div className="flex flex-col gap-2 items-start">
                {["OWNER", "LAWYER"].includes(user.role) ? (
                  <label className="text-xs border rounded px-3 py-1 cursor-pointer">
                    Upload RDB
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadRdb(t.id, f);
                      }}
                    />
                  </label>
                ) : null}
                <button type="button" className="text-xs underline text-blue-700" onClick={() => downloadRdb(t.id)}>
                  Download RDB
                </button>
                {login && user.role === "OWNER" ? (
                  <button type="button" className="text-xs border rounded px-3 py-1" onClick={() => toggleActive(login.id, !login.isActive)}>
                    {login.isActive ? "Deactivate" : "Activate"}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
        {!tenants.length ? <p className="p-4 text-gray-500">No customers yet.</p> : null}
      </section>
    </DashboardPage>
  );
}


"use client";

import { useEffect, useState } from "react";
import { apiRequest, apiUpload, apiDownload } from "@/lib/api";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { useSession } from "@/components/dashboard/use-session";
import { StatusBanner } from "@/components/dashboard/status-banner";

type Contract = {
  id: number;
  tenantId: number;
  status: string;
  isApproved: boolean;
  currentVersionNumber?: number;
  currentVersionId?: number;
};
type TenantProfile = { id: number; fullName?: string; companyName?: string };

export default function SalesPage() {
  const { token, user } = useSession();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [tenants, setTenants] = useState<TenantProfile[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    tenantId: "",
    startDate: "",
    endDate: "",
    rentAmountRwf: "",
    dueDayOfMonth: "5",
    paymentFrequency: "MONTHLY",
  });

  const load = async () => {
    if (!token) return;
    const [c, t] = await Promise.all([
      apiRequest<Contract[]>("/contracts", {}, token),
      user?.role === "TENANT" ? Promise.resolve([]) : apiRequest<TenantProfile[]>("/tenants", {}, token).catch(() => []),
    ]);
    setContracts(c);
    setTenants(t);
  };

  useEffect(() => {
    if (!user) return;
    load().catch((e) => setError(e.message));
  }, [token, user]);

  const uploadContract = async () => {
    if (!token || !file || !form.tenantId) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("tenantId", form.tenantId);
    fd.append("uploadedByRole", user?.role === "LAWYER" ? "LAWYER" : "OWNER");
    fd.append("startDate", form.startDate);
    fd.append("endDate", form.endDate);
    fd.append("rentAmountRwf", form.rentAmountRwf);
    fd.append("paymentFrequency", form.paymentFrequency);
    fd.append("dueDayOfMonth", form.dueDayOfMonth);
    try {
      await apiUpload("/contracts", fd, token);
      setMessage("Lease uploaded.");
      setFile(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const downloadLease = async (c: Contract) => {
    if (!token) return;
    const versionNumber = c.currentVersionNumber ?? 1;
    const versionKey = c.currentVersionId ?? versionNumber;
    const path = c.currentVersionId
      ? `/contracts/${c.id}/versions/${versionKey}/download`
      : `/contracts/${c.id}/versions/by-number/${versionNumber}/download`;
    try {
      await apiDownload(path, token, `lease-${c.id}-v${versionNumber}.pdf`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    }
  };

  const approve = async (contractId: number) => {
    if (!token) return;
    await apiRequest(`/contracts/${contractId}/approve`, { method: "PATCH" }, token);
    setMessage("Contract approved.");
    load();
  };

  if (!user) return null;

  return (
    <DashboardPage title={`Leases (${contracts.length})`}>
      <StatusBanner message={message} error={error} />

      {["OWNER", "LAWYER"].includes(user.role) ? (
        <section className="bg-white rounded-xl border p-4 mb-6 space-y-2">
          <h2 className="font-semibold">New lease (upload PDF)</h2>
          <div className="grid md:grid-cols-2 gap-2">
            <select className="border rounded px-3 py-2 text-sm" value={form.tenantId} onChange={(e) => setForm((s) => ({ ...s, tenantId: e.target.value }))}>
              <option value="">Tenant</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName || t.companyName || `#${t.id}`}
                </option>
              ))}
            </select>
            <input className="border rounded px-3 py-2 text-sm" type="number" placeholder="Rent RWF" value={form.rentAmountRwf} onChange={(e) => setForm((s) => ({ ...s, rentAmountRwf: e.target.value }))} />
            <input className="border rounded px-3 py-2 text-sm" type="date" value={form.startDate} onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))} />
            <input className="border rounded px-3 py-2 text-sm" type="date" value={form.endDate} onChange={(e) => setForm((s) => ({ ...s, endDate: e.target.value }))} />
            <input className="border rounded px-3 py-2 text-sm md:col-span-2" type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <button type="button" className="rounded bg-gray-900 text-white px-4 py-2 text-sm" onClick={uploadContract}>
            Upload lease
          </button>
        </section>
      ) : null}

      <section className="space-y-2">
        {contracts.map((c) => (
          <article key={c.id} className="bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:justify-between gap-2">
            <div>
              <p className="font-medium text-gray-900">Contract #{c.id}</p>
              <p className="text-sm text-gray-600">
                Tenant profile #{c.tenantId} · {c.status} · v{c.currentVersionNumber ?? 1}
                {c.isApproved ? " · approved" : " · pending approval"}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="text-sm underline text-blue-700" onClick={() => downloadLease(c)}>
                Download
              </button>
              {!c.isApproved && ["OWNER", "LAWYER"].includes(user.role) ? (
                <button type="button" className="text-sm border rounded px-3 py-1" onClick={() => approve(c.id)}>
                  Approve
                </button>
              ) : null}
            </div>
          </article>
        ))}
        {!contracts.length ? <p className="text-gray-500">No leases yet.</p> : null}
      </section>
    </DashboardPage>
  );
}


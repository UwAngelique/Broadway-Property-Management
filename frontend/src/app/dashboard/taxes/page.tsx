"use client";

import { useEffect, useState } from "react";
import { apiRequest, apiDownload } from "@/lib/api";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { TrustBanner } from "@/components/ui/trust-banner";
import { useSession } from "@/components/dashboard/use-session";
import { StatusBanner } from "@/components/dashboard/status-banner";
import { MetricCard } from "@/components/dashboard/metric-card";
import { fmtRwf } from "@/lib/format";

type ComplianceSummary = { obligationCount: number; openObligationCount: number; totalTrackedDueRwf: number };
type TaxProfile = { incomeTaxRegime: string; tin?: string; vatRegistered: boolean; notes?: string };
type TaxObligation = {
  id: number;
  taxType: string;
  title: string;
  periodKey?: string;
  dueDate?: string;
  amountDueRwf?: string;
  status: string;
  clientName?: string;
};

export default function TaxesPage() {
  const { token, user } = useSession();
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [obligations, setObligations] = useState<TaxObligation[]>([]);
  const [profileForm, setProfileForm] = useState({ incomeTaxRegime: "UNKNOWN", tin: "", vatRegistered: true, notes: "" });
  const [obligationForm, setObligationForm] = useState({
    taxType: "VAT",
    title: "",
    periodKey: "",
    dueDate: "",
    amountDueRwf: "",
    status: "PLANNED",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canEdit = user && ["OWNER", "ACCOUNTANT"].includes(user.role);

  const isPlatform = user?.role === "PLATFORM_OWNER";

  const load = async () => {
    if (!token || !user) return;
    if (isPlatform) {
      const rollup = await apiRequest<{
        summary: ComplianceSummary;
        obligations: TaxObligation[];
        clientCount: number;
      }>("/platform/tax", {}, token);
      setSummary(rollup.summary);
      setObligations(rollup.obligations);
      return;
    }
    const [s, p, o] = await Promise.all([
      apiRequest<ComplianceSummary>("/compliance/summary", {}, token),
      apiRequest<TaxProfile>("/compliance/profile", {}, token),
      apiRequest<TaxObligation[]>("/compliance/obligations", {}, token),
    ]);
    setSummary(s);
    setObligations(o);
    setProfileForm({ incomeTaxRegime: p.incomeTaxRegime, tin: p.tin ?? "", vatRegistered: p.vatRegistered, notes: p.notes ?? "" });
  };

  useEffect(() => {
    if (!user || user.role === "TENANT") {
      window.location.href = "/dashboard";
      return;
    }
    load().catch((e) => setError(e.message));
  }, [token, user]);

  const saveProfile = async () => {
    if (!token || !canEdit) return;
    await apiRequest("/compliance/profile", { method: "PATCH", body: JSON.stringify(profileForm) }, token);
    setMessage("Tax profile saved.");
    load();
  };

  const addObligation = async () => {
    if (!token || !canEdit || !obligationForm.title.trim()) return;
    await apiRequest("/compliance/obligations", { method: "POST", body: JSON.stringify(obligationForm) }, token);
    setMessage("Obligation added.");
    load();
  };

  const downloadPdf = async () => {
    if (!token) return;
    await apiDownload("/compliance/obligations/export.pdf", token, "broadway-tax-obligations.pdf");
    setMessage("PDF downloaded.");
  };

  if (!user) return null;
  const open = summary?.openObligationCount ?? obligations.filter((o) => o.status !== "PAID").length;

  return (
    <DashboardPage title={`Tax · ${open} open`}>
      {isPlatform ? (
        <p className="text-sm text-gray-600 mb-4">Combined tax obligations across all landlord clients (read-only).</p>
      ) : (
        <TrustBanner />
      )}
      <StatusBanner message={message} error={error} />

      {summary ? (
        <section className="grid sm:grid-cols-3 gap-3 mb-6">
          <MetricCard title="Tracked" value={String(summary.obligationCount)} />
          <MetricCard title="Open" value={String(summary.openObligationCount)} />
          <MetricCard title="Amounts flagged" value={fmtRwf(summary.totalTrackedDueRwf)} />
        </section>
      ) : null}

      {canEdit ? (
        <section className="bg-white rounded-xl border p-4 mb-6 space-y-3">
          <h2 className="font-semibold">Tax profile</h2>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            <select className="border rounded px-3 py-2" value={profileForm.incomeTaxRegime} onChange={(e) => setProfileForm((s) => ({ ...s, incomeTaxRegime: e.target.value }))}>
              <option value="UNKNOWN">Unknown</option>
              <option value="PIT">PIT</option>
              <option value="CIT">CIT</option>
            </select>
            <input className="border rounded px-3 py-2" placeholder="TIN" value={profileForm.tin} onChange={(e) => setProfileForm((s) => ({ ...s, tin: e.target.value }))} />
          </div>
          <button type="button" className="rounded border px-4 py-2 text-sm" onClick={saveProfile}>
            Save profile
          </button>
        </section>
      ) : null}

      {canEdit ? (
        <section className="bg-white rounded-xl border p-4 mb-6 space-y-2">
          <h2 className="font-semibold">Add obligation</h2>
          <div className="grid md:grid-cols-3 gap-2">
            <input className="border rounded px-3 py-2 text-sm" placeholder="Title" value={obligationForm.title} onChange={(e) => setObligationForm((s) => ({ ...s, title: e.target.value }))} />
            <input className="border rounded px-3 py-2 text-sm" placeholder="Amount RWF" value={obligationForm.amountDueRwf} onChange={(e) => setObligationForm((s) => ({ ...s, amountDueRwf: e.target.value }))} />
            <button type="button" className="rounded bg-gray-900 text-white px-4 py-2 text-sm" onClick={addObligation}>
              Add
            </button>
          </div>
        </section>
      ) : null}

      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-gray-900">Obligations ({obligations.length})</h2>
        {!isPlatform ? (
          <button type="button" className="text-sm rounded bg-gray-900 text-white px-3 py-1.5" onClick={downloadPdf}>
            Export PDF
          </button>
        ) : null}
      </div>

      <section className="bg-white rounded-xl border overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              {isPlatform ? <th className="p-3">Client</th> : null}
              <th className="p-3">Type</th>
              <th className="p-3">Title</th>
              <th className="p-3">Due</th>
              <th className="p-3">RWF</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {obligations.map((o) => (
              <tr key={`${o.id}-${o.clientName ?? ""}`} className="border-b">
                {isPlatform ? <td className="p-3">{o.clientName ?? "—"}</td> : null}
                <td className="p-3">{o.taxType}</td>
                <td className="p-3">{o.title}</td>
                <td className="p-3">{o.dueDate ?? "—"}</td>
                <td className="p-3">{o.amountDueRwf ?? "—"}</td>
                <td className="p-3">{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DashboardPage>
  );
}


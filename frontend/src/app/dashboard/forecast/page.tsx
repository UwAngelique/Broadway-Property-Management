"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { useSession } from "@/components/dashboard/use-session";
import { StatusBanner } from "@/components/dashboard/status-banner";
import { MetricCard } from "@/components/dashboard/metric-card";
import { fmtRwf } from "@/lib/format";

type Forecast = {
  year: number;
  disclaimer: string;
  incomeTaxRegime: string;
  vatRatePercent: number;
  incomeTaxRatePercent: number;
  contractLines: Array<{
    source: "CONTRACT";
    contractId: number;
    tenantName: string;
    monthlyRentRwf: number;
    monthsInYear: number;
    grossRwf: number;
  }>;
  manualLines: Array<{
    source: "MANUAL";
    manualLineId: number;
    label: string;
    monthlyRentRwf: number;
    monthsInYear: number;
    grossRwf: number;
  }>;
  summary: {
    grossAnnualRwf: number;
    vatRwf: number;
    afterVatRwf: number;
    incomeTaxLabel: string;
    incomeTaxRwf: number;
    netAfterTaxRwf: number;
  };
};

export default function ForecastPage() {
  const { token, user } = useSession();
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<Forecast | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [manual, setManual] = useState({ label: "", monthlyRentRwf: "" });
  const [rentEdits, setRentEdits] = useState<Record<number, string>>({});

  const load = async () => {
    if (!token) return;
    const res = await apiRequest<Forecast>(`/analytics/annual-forecast?year=${year}`, {}, token);
    setData(res);
  };

  useEffect(() => {
    if (!user) return;
    if (user.role === "TENANT" || user.role === "PLATFORM_OWNER") {
      window.location.href = "/dashboard";
      return;
    }
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load forecast"));
  }, [token, user, year]);

  const addManual = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !manual.label || !manual.monthlyRentRwf) return;
    try {
      await apiRequest("/analytics/annual-forecast/manual-lines", {
        method: "POST",
        body: JSON.stringify({
          year,
          label: manual.label,
          monthlyRentRwf: Number(manual.monthlyRentRwf),
        }),
      }, token);
      setManual({ label: "", monthlyRentRwf: "" });
      setMessage("Manual rent line added.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add line");
    }
  };

  const removeManual = async (id: number) => {
    if (!token) return;
    await apiRequest(`/analytics/annual-forecast/manual-lines/${id}`, { method: "DELETE" }, token);
    setMessage("Manual line removed.");
    load();
  };

  const saveContractRent = async (contractId: number) => {
    if (!token) return;
    const value = rentEdits[contractId];
    if (!value) return;
    await apiRequest(`/contracts/${contractId}/rent`, {
      method: "PATCH",
      body: JSON.stringify({ rentAmountRwf: Number(value) }),
    }, token);
    setMessage(`Contract #${contractId} monthly rent updated.`);
    load();
  };

  if (!user) return null;

  const canEdit = ["OWNER", "ACCOUNTANT"].includes(user.role);

  return (
    <DashboardPage title={`Annual forecast · ${year}`}>
      <StatusBanner message={message} error={error} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="text-sm text-gray-700">
          Year{" "}
          <input
            type="number"
            className="border rounded px-2 py-1 w-24 ml-1"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </label>
        <Link href="/dashboard/leases" className="text-sm text-blue-700 underline">
          Upload or edit leases
        </Link>
        <Link href="/dashboard/tax" className="text-sm text-blue-700 underline">
          Set PIT / CIT regime
        </Link>
      </div>

      {data ? (
        <>
          <p className="text-xs text-gray-500 mb-4">{data.disclaimer}</p>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <MetricCard title="Gross rent (Jan–Dec)" value={fmtRwf(data.summary.grossAnnualRwf)} />
            <MetricCard title={`VAT (${data.vatRatePercent}%)`} value={fmtRwf(data.summary.vatRwf)} />
            <MetricCard title={data.summary.incomeTaxLabel} value={fmtRwf(data.summary.incomeTaxRwf)} />
            <MetricCard title="Net after tax (est.)" value={fmtRwf(data.summary.netAfterTaxRwf)} />
          </section>

          <section className="bg-white rounded-xl border p-4 mb-6">
            <h2 className="font-semibold mb-2">From active leases</h2>
            <p className="text-sm text-gray-600 mb-3">
              Rent amounts come from the lease form when you upload a PDF (enter monthly rent on upload). Adjust here if the contract amount changes.
            </p>
            <div className="divide-y text-sm">
              {data.contractLines.map((line) => (
                <div key={line.contractId} className="py-3 flex flex-col sm:flex-row sm:justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{line.tenantName}</p>
                    <p className="text-gray-600">
                      Contract #{line.contractId} · {line.monthsInYear} months · gross {fmtRwf(line.grossRwf)}
                    </p>
                  </div>
                  {canEdit ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        className="border rounded px-2 py-1 w-32"
                        placeholder={String(line.monthlyRentRwf)}
                        value={rentEdits[line.contractId] ?? ""}
                        onChange={(e) => setRentEdits((s) => ({ ...s, [line.contractId]: e.target.value }))}
                      />
                      <span className="text-gray-500">RWF / mo</span>
                      <button
                        type="button"
                        className="text-xs border rounded px-2 py-1"
                        onClick={() => saveContractRent(line.contractId)}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-700">{fmtRwf(line.monthlyRentRwf)} / month</p>
                  )}
                </div>
              ))}
              {!data.contractLines.length ? (
                <p className="py-3 text-gray-500">No approved active leases in this year. Add leases or use manual lines below.</p>
              ) : null}
            </div>
          </section>

          <section className="bg-white rounded-xl border p-4 mb-6">
            <h2 className="font-semibold mb-2">Manual rent lines</h2>
            <p className="text-sm text-gray-600 mb-3">
              Use when a tenant is not on a digital lease yet, or to model extra income (parking, commercial unit, etc.).
            </p>
            {canEdit ? (
              <form onSubmit={addManual} className="flex flex-wrap gap-2 mb-4">
                <input
                  className="border rounded px-3 py-2 text-sm flex-1 min-w-[160px]"
                  placeholder="Label (e.g. Shop B)"
                  value={manual.label}
                  onChange={(e) => setManual((s) => ({ ...s, label: e.target.value }))}
                  required
                />
                <input
                  className="border rounded px-3 py-2 text-sm w-36"
                  type="number"
                  placeholder="Monthly RWF"
                  value={manual.monthlyRentRwf}
                  onChange={(e) => setManual((s) => ({ ...s, monthlyRentRwf: e.target.value }))}
                  required
                />
                <button type="submit" className="rounded bg-gray-900 text-white px-4 py-2 text-sm">
                  Add line
                </button>
              </form>
            ) : null}
            <div className="divide-y text-sm">
              {data.manualLines.map((line) => (
                <div key={line.manualLineId} className="py-3 flex justify-between gap-2">
                  <div>
                    <p className="font-medium">{line.label}</p>
                    <p className="text-gray-600">
                      {fmtRwf(line.monthlyRentRwf)} / mo × 12 = {fmtRwf(line.grossRwf)}
                    </p>
                  </div>
                  {canEdit ? (
                    <button type="button" className="text-xs text-red-700 underline" onClick={() => removeManual(line.manualLineId)}>
                      Remove
                    </button>
                  ) : null}
                </div>
              ))}
              {!data.manualLines.length ? <p className="text-gray-500 py-2">No manual lines.</p> : null}
            </div>
          </section>
        </>
      ) : (
        <p className="text-sm text-gray-500">Loading forecast…</p>
      )}
    </DashboardPage>
  );
}

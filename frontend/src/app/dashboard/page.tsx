"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { DepartmentTile, type DepartmentTileProps } from "@/components/dashboard/department-tile";
import { useSession } from "@/components/dashboard/use-session";
import { MetricCard } from "@/components/dashboard/metric-card";
import { fmtRwf } from "@/lib/format";

type HubResponse = {
  headline?: string;
  tiles: DepartmentTileProps[];
};

type Overview = {
  expectedMonthlyRentRwf: number;
  collectedThisMonthRwf: number;
  outstandingThisMonthRwf: number;
  occupancyRate: number;
};

type ForecastSummary = {
  year: number;
  summary: {
    grossAnnualRwf: number;
    vatRwf: number;
    incomeTaxRwf: number;
    netAfterTaxRwf: number;
    incomeTaxLabel: string;
  };
};

type RoleCounts = {
  owners: number;
  accountants: number;
  lawyers: number;
  tenants: number;
};

export default function DashboardHubPage() {
  const { token, user } = useSession();
  const [hub, setHub] = useState<HubResponse | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [forecast, setForecast] = useState<ForecastSummary | null>(null);
  const [roles, setRoles] = useState<RoleCounts | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !user) return;
    apiRequest<HubResponse>("/dashboard/hub", {}, token)
      .then(setHub)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load dashboard"));
    if (user.role !== "PLATFORM_OWNER" && user.role !== "TENANT") {
      apiRequest<Overview>("/analytics/overview", {}, token)
        .then(setOverview)
        .catch(() => null);
      const year = new Date().getFullYear();
      apiRequest<ForecastSummary>(`/analytics/annual-forecast?year=${year}`, {}, token)
        .then(setForecast)
        .catch(() => null);
      if (user.role === "OWNER") {
        apiRequest<RoleCounts>("/analytics/team-roles", {}, token)
          .then(setRoles)
          .catch(() => null);
      }
    }
  }, [token, user]);

  if (!user) return null;

  const showLandlordIntel = user.role !== "PLATFORM_OWNER" && user.role !== "TENANT";

  return (
    <DashboardPage title={hub?.headline ?? "Dashboard"}>
      {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}

      {overview ? (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <MetricCard title="Collected this month" value={fmtRwf(overview.collectedThisMonthRwf)} />
          <MetricCard title="Outstanding" value={fmtRwf(overview.outstandingThisMonthRwf)} />
          <MetricCard title="Expected rent" value={fmtRwf(overview.expectedMonthlyRentRwf)} />
          <MetricCard title="Occupancy" value={`${overview.occupancyRate}%`} />
        </section>
      ) : null}

      {showLandlordIntel && forecast ? (
        <section className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div>
              <h2 className="font-semibold text-gray-900">Annual forecast ({forecast.year})</h2>
              <p className="text-sm text-gray-600">Jan 1 – Dec 31 · from leases + manual rent lines</p>
            </div>
            <Link href="/dashboard/forecast" className="text-sm font-medium text-emerald-900 underline">
              Open full forecast
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard title="Gross rent" value={fmtRwf(forecast.summary.grossAnnualRwf)} />
            <MetricCard title="VAT (est.)" value={fmtRwf(forecast.summary.vatRwf)} />
            <MetricCard title={forecast.summary.incomeTaxLabel} value={fmtRwf(forecast.summary.incomeTaxRwf)} />
            <MetricCard title="Net (est.)" value={fmtRwf(forecast.summary.netAfterTaxRwf)} />
          </div>
        </section>
      ) : null}

      {roles ? (
        <section className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-2">Your team</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/dashboard/team" className="rounded-xl border bg-white p-3 hover:border-gray-400">
              <p className="text-xs text-gray-600">Owner / manager</p>
              <p className="text-2xl font-bold">{roles.owners}</p>
            </Link>
            <Link href="/dashboard/team" className="rounded-xl border bg-white p-3 hover:border-gray-400">
              <p className="text-xs text-gray-600">Accountant</p>
              <p className="text-2xl font-bold">{roles.accountants}</p>
            </Link>
            <Link href="/dashboard/team" className="rounded-xl border bg-white p-3 hover:border-gray-400">
              <p className="text-xs text-gray-600">Lawyer</p>
              <p className="text-2xl font-bold">{roles.lawyers}</p>
            </Link>
            <Link href="/dashboard/tenants" className="rounded-xl border bg-white p-3 hover:border-gray-400">
              <p className="text-xs text-gray-600">Tenants</p>
              <p className="text-2xl font-bold">{roles.tenants}</p>
            </Link>
          </div>
        </section>
      ) : null}

      <p className="text-sm text-gray-600 mb-4">
        Select a department to view full details. Counts on each tile reflect live data in your workspace.
      </p>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(hub?.tiles ?? []).map((tile) => (
          <DepartmentTile key={tile.id} {...tile} />
        ))}
      </section>

      {!hub?.tiles?.length && !error ? <p className="text-sm text-gray-500 mt-4">Loading departments…</p> : null}
    </DashboardPage>
  );
}

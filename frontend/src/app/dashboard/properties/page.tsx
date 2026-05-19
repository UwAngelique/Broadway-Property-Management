"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { useSession } from "@/components/dashboard/use-session";
import { StatusBanner } from "@/components/dashboard/status-banner";

type Building = {
  id: number;
  name: string;
  upi?: string | null;
  propertyKind: string;
  usageType: string;
  address?: string | null;
  landSizeSqm?: number | null;
};

type Unit = { id: number; unitName: string; floor?: string; buildingId: number };

export default function PropertiesPage() {
  const { token, user } = useSession();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [propertyForm, setPropertyForm] = useState({
    name: "",
    upi: "",
    propertyKind: "BUILDING" as "BUILDING" | "LAND_PARCEL",
    usageType: "COMMERCIAL" as "COMMERCIAL" | "RESIDENTIAL" | "MIXED" | "LAND_ONLY",
    address: "",
    landSizeSqm: "",
  });
  const [unitForm, setUnitForm] = useState({ buildingId: "", unitName: "", floor: "" });

  const load = async () => {
    if (!token) return;
    const [b, u] = await Promise.all([
      apiRequest<Building[]>("/buildings", {}, token),
      apiRequest<Unit[]>("/units", {}, token).catch(() => []),
    ]);
    setBuildings(b);
    setUnits(u);
  };

  useEffect(() => {
    if (!user || user.role === "TENANT" || user.role === "PLATFORM_OWNER") {
      window.location.href = "/dashboard";
      return;
    }
    load().catch((e) => setError(e.message));
  }, [token, user]);

  const saveProperty = async () => {
    if (!token) return;
    try {
      await apiRequest("/buildings", {
        method: "POST",
        body: JSON.stringify({
          name: propertyForm.name,
          upi: propertyForm.upi || undefined,
          propertyKind: propertyForm.propertyKind,
          usageType: propertyForm.usageType,
          address: propertyForm.address || undefined,
          landSizeSqm: propertyForm.landSizeSqm ? Number(propertyForm.landSizeSqm) : undefined,
        }),
      }, token);
      setMessage("Property saved.");
      setPropertyForm({ name: "", upi: "", propertyKind: "BUILDING", usageType: "COMMERCIAL", address: "", landSizeSqm: "" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  const saveUnit = async () => {
    if (!token || !unitForm.buildingId) return;
    try {
      await apiRequest("/units", {
        method: "POST",
        body: JSON.stringify({
          buildingId: Number(unitForm.buildingId),
          unitName: unitForm.unitName,
          floor: unitForm.floor || undefined,
        }),
      }, token);
      setMessage("Unit added.");
      setUnitForm({ buildingId: "", unitName: "", floor: "" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  if (!user) return null;

  return (
    <DashboardPage title={`Properties (${buildings.length})`}>
      <StatusBanner message={message} error={error} />

      {user.role === "OWNER" ? (
        <>
          <section className="bg-white rounded-xl border p-4 mb-6 space-y-2">
            <h2 className="font-semibold text-gray-900">Add property / land (UPI)</h2>
            <div className="grid md:grid-cols-2 gap-2">
              <input className="border rounded px-3 py-2 text-sm" placeholder="Name" value={propertyForm.name} onChange={(e) => setPropertyForm((s) => ({ ...s, name: e.target.value }))} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="UPI" value={propertyForm.upi} onChange={(e) => setPropertyForm((s) => ({ ...s, upi: e.target.value }))} />
              <select className="border rounded px-3 py-2 text-sm" value={propertyForm.propertyKind} onChange={(e) => setPropertyForm((s) => ({ ...s, propertyKind: e.target.value as "BUILDING" | "LAND_PARCEL" }))}>
                <option value="BUILDING">Building</option>
                <option value="LAND_PARCEL">Land parcel</option>
              </select>
              <select className="border rounded px-3 py-2 text-sm" value={propertyForm.usageType} onChange={(e) => setPropertyForm((s) => ({ ...s, usageType: e.target.value as typeof propertyForm.usageType }))}>
                <option value="COMMERCIAL">Commercial</option>
                <option value="RESIDENTIAL">Residential</option>
                <option value="MIXED">Mixed</option>
                <option value="LAND_ONLY">Land only</option>
              </select>
              <input className="border rounded px-3 py-2 text-sm md:col-span-2" placeholder="Address" value={propertyForm.address} onChange={(e) => setPropertyForm((s) => ({ ...s, address: e.target.value }))} />
            </div>
            <button type="button" className="rounded bg-gray-900 text-white px-4 py-2 text-sm" onClick={saveProperty}>
              Save property
            </button>
          </section>

          <section className="bg-white rounded-xl border p-4 mb-6 space-y-2">
            <h2 className="font-semibold text-gray-900">Add unit</h2>
            <div className="grid md:grid-cols-3 gap-2">
              <select className="border rounded px-3 py-2 text-sm" value={unitForm.buildingId} onChange={(e) => setUnitForm((s) => ({ ...s, buildingId: e.target.value }))}>
                <option value="">Select building</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <input className="border rounded px-3 py-2 text-sm" placeholder="Unit name" value={unitForm.unitName} onChange={(e) => setUnitForm((s) => ({ ...s, unitName: e.target.value }))} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="Floor" value={unitForm.floor} onChange={(e) => setUnitForm((s) => ({ ...s, floor: e.target.value }))} />
            </div>
            <button type="button" className="rounded border px-4 py-2 text-sm" onClick={saveUnit}>
              Add unit
            </button>
          </section>
        </>
      ) : null}

      <section className="space-y-4">
        {buildings.map((b) => (
          <article key={b.id} className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-gray-900">{b.name}</h3>
            <p className="text-sm text-gray-600">
              {b.propertyKind} Â· {b.usageType}
              {b.upi ? ` Â· UPI ${b.upi}` : ""}
            </p>
            <ul className="mt-3 text-sm space-y-1">
              {units
                .filter((u) => u.buildingId === b.id)
                .map((u) => (
                  <li key={u.id} className="border rounded px-2 py-1">
                    {u.unitName}
                    {u.floor ? ` (${u.floor})` : ""}
                  </li>
                ))}
            </ul>
          </article>
        ))}
        {!buildings.length ? <p className="text-gray-500">No properties yet.</p> : null}
      </section>
    </DashboardPage>
  );
}


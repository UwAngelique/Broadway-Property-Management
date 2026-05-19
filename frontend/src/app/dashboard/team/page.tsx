"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { useSession } from "@/components/dashboard/use-session";
import { StatusBanner } from "@/components/dashboard/status-banner";
import { MetricCard } from "@/components/dashboard/metric-card";

type AccountUser = { id: number; email: string; role: string; isActive: boolean };

type RoleCounts = {
  total: number;
  owners: number;
  accountants: number;
  lawyers: number;
  tenants: number;
};

export default function TeamPage() {
  const { token, user } = useSession();
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [counts, setCounts] = useState<RoleCounts | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [invite, setInvite] = useState({
    email: "",
    password: "",
    role: "ACCOUNTANT" as "ACCOUNTANT" | "LAWYER" | "OWNER",
  });

  const load = async () => {
    if (!token) return;
    const [u, c] = await Promise.all([
      apiRequest<AccountUser[]>("/accounts/users", {}, token),
      apiRequest<RoleCounts>("/analytics/team-roles", {}, token),
    ]);
    setUsers(u.filter((x) => x.role !== "TENANT"));
    setCounts(c);
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== "OWNER") {
      window.location.href = "/dashboard";
      return;
    }
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load team"));
  }, [token, user]);

  const inviteUser = async () => {
    if (!token) return;
    try {
      await apiRequest(
        "/accounts/users",
        {
          method: "POST",
          body: JSON.stringify({
            email: invite.email,
            password: invite.password,
            role: invite.role,
          }),
        },
        token,
      );
      setMessage(`${invite.role} invited.`);
      setInvite({ email: "", password: "", role: "ACCOUNTANT" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invite failed");
    }
  };

  if (!user) return null;

  return (
    <DashboardPage title="Team & roles">
      <StatusBanner message={message} error={error} />

      {counts ? (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <MetricCard title="Owner / property manager" value={String(counts.owners)} />
          <MetricCard title="Accountant" value={String(counts.accountants)} />
          <MetricCard title="Lawyer" value={String(counts.lawyers)} />
          <MetricCard title="Tenant logins" value={String(counts.tenants)} />
        </section>
      ) : null}

      <section className="bg-white rounded-xl border p-4 mb-6 space-y-2">
        <h2 className="font-semibold">Invite team member</h2>
        <p className="text-sm text-gray-600">
          Property managers use the owner account. Invite accountants and lawyers for tax and lease workflows.
        </p>
        <div className="flex flex-wrap gap-2">
          <select
            className="border rounded px-3 py-2 text-sm"
            value={invite.role}
            onChange={(e) => setInvite((s) => ({ ...s, role: e.target.value as typeof invite.role }))}
          >
            <option value="ACCOUNTANT">Accountant</option>
            <option value="LAWYER">Lawyer</option>
            <option value="OWNER">Owner (co-manager)</option>
          </select>
          <input
            className="border rounded px-3 py-2 text-sm flex-1 min-w-[180px]"
            placeholder="Email"
            value={invite.email}
            onChange={(e) => setInvite((s) => ({ ...s, email: e.target.value }))}
          />
          <input
            className="border rounded px-3 py-2 text-sm flex-1 min-w-[180px]"
            type="password"
            placeholder="Temporary password"
            value={invite.password}
            onChange={(e) => setInvite((s) => ({ ...s, password: e.target.value }))}
          />
          <button type="button" className="rounded bg-gray-900 text-white px-4 py-2 text-sm" onClick={inviteUser}>
            Create login
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Tenant logins are created from{" "}
          <Link href="/dashboard/tenants" className="underline text-blue-700">
            Tenants
          </Link>
          .
        </p>
      </section>

      <section className="bg-white rounded-xl border divide-y">
        {users.map((u) => (
          <div key={u.id} className="p-4 flex justify-between text-sm">
            <span className="text-gray-900">{u.email}</span>
            <span className="text-gray-600">
              {u.role} · {u.isActive ? "active" : "inactive"}
            </span>
          </div>
        ))}
        {!users.length ? <p className="p-4 text-gray-500">No team members yet.</p> : null}
      </section>
    </DashboardPage>
  );
}

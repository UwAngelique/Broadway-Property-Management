"use client";

import { useEffect, useState } from "react";
import { apiRequest, apiUpload } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useSession } from "@/components/dashboard/use-session";
import { StatusBanner } from "@/components/dashboard/status-banner";
import { MetricCard } from "@/components/dashboard/metric-card";
import { fmtRwf } from "@/lib/format";

type Expense = { id: number; category: string; description: string; amountRwf: number; expenseDate: string };
type Summary = { totalExpensesRwf: number; totalIncomeRwf: number; netCashflowRwf: number };

export default function ExpensesPage() {
  const { token, user } = useSession();
  const [items, setItems] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ category: "", description: "", amountRwf: "", expenseDate: "" });

  const load = async () => {
    if (!token) return;
    const [list, sum] = await Promise.all([
      apiRequest<Expense[]>("/expenses", {}, token),
      apiRequest<Summary>("/expenses/summary", {}, token),
    ]);
    setItems(list);
    setSummary(sum);
  };

  useEffect(() => {
    if (!user || !["OWNER", "ACCOUNTANT"].includes(user.role)) {
      window.location.href = "/dashboard";
      return;
    }
    load().catch((e) => setError(e.message));
  }, [token, user]);

  const create = async () => {
    if (!token) return;
    const fd = new FormData();
    fd.append("category", form.category);
    fd.append("description", form.description);
    fd.append("amountRwf", form.amountRwf);
    fd.append("expenseDate", form.expenseDate);
    try {
      await apiUpload("/expenses", fd, token);
      setMessage("Expense recorded.");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  if (!user) return null;

  return (
    <DashboardShell user={user} title={`Expenses (${items.length})`}>
      <StatusBanner message={message} error={error} />
      {summary ? (
        <section className="grid sm:grid-cols-3 gap-3 mb-6">
          <MetricCard title="Income" value={fmtRwf(summary.totalIncomeRwf)} />
          <MetricCard title="Expenses" value={fmtRwf(summary.totalExpensesRwf)} />
          <MetricCard title="Net cashflow" value={fmtRwf(summary.netCashflowRwf)} />
        </section>
      ) : null}

      <section className="bg-white rounded-xl border p-4 mb-6 grid md:grid-cols-2 gap-2">
        <input className="border rounded px-3 py-2 text-sm" placeholder="Category" value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} />
        <input className="border rounded px-3 py-2 text-sm" placeholder="Amount RWF" value={form.amountRwf} onChange={(e) => setForm((s) => ({ ...s, amountRwf: e.target.value }))} />
        <input className="border rounded px-3 py-2 text-sm md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
        <input className="border rounded px-3 py-2 text-sm" type="date" value={form.expenseDate} onChange={(e) => setForm((s) => ({ ...s, expenseDate: e.target.value }))} />
        <button type="button" className="rounded bg-gray-900 text-white px-4 py-2 text-sm" onClick={create}>
          Add expense
        </button>
      </section>

      <section className="bg-white rounded-xl border divide-y">
        {items.map((e) => (
          <div key={e.id} className="p-4 flex justify-between text-sm">
            <span>
              {e.category} — {e.description}
            </span>
            <span>{fmtRwf(Number(e.amountRwf))}</span>
          </div>
        ))}
      </section>
    </DashboardShell>
  );
}


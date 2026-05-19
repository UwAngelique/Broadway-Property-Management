"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest, API_BASE_URL } from "@/lib/api";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { useSession } from "@/components/dashboard/use-session";
import { fmtRwf } from "@/lib/format";
import { LoadingPage } from "@/components/ui/loading-page";
import { MetricCard } from "@/components/dashboard/metric-card";

type Invoice = { id: number; billingMonth: string; totalAmountRwf: number; dueDate: string; status?: string };
type Payment = { id: number; status: string; amountRwf: number };
type Contract = { id: number; status: string; isApproved: boolean };

export default function TenantPortalPage() {
  const { token, user } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "TENANT") {
      window.location.href = "/dashboard";
      return;
    }
    if (!token) return;
    Promise.all([
      apiRequest<Invoice[]>("/payments/invoices", {}, token),
      apiRequest<Payment[]>("/payments", {}, token),
      apiRequest<Contract[]>("/contracts", {}, token),
    ])
      .then(([i, p, c]) => {
        setInvoices(i);
        setPayments(p);
        setContracts(c.filter((x) => x.isApproved));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, user]);

  const outstanding = invoices.filter((i) => i.status !== "PAID").reduce((s, i) => s + Number(i.totalAmountRwf), 0);
  const pendingProofs = payments.filter((p) => !["APPROVED", "REJECTED", "RECEIPT_ISSUED"].includes(p.status)).length;

  if (loading) {
    return (
      <DashboardPage title="My portal">
        <LoadingPage />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage title="My portal">
      <section className="grid sm:grid-cols-3 gap-3 mb-6">
        <MetricCard title="Balance due (RWF)" value={fmtRwf(outstanding)} />
        <MetricCard title="Open invoices" value={String(invoices.filter((i) => i.status !== "PAID").length)} />
        <MetricCard title="Payments in review" value={String(pendingProofs)} />
      </section>

      <div className="flex flex-wrap gap-3 mb-6">
        <Link href="/dashboard/portal/pay" className="rounded-lg bg-gray-900 text-white px-5 py-3 text-sm font-medium">
          Pay rent / upload MoMo proof
        </Link>
        <Link href="/dashboard/leases" className="rounded-lg border px-5 py-3 text-sm">
          View lease
        </Link>
      </div>

      <section className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold mb-2">Recent invoices (RWF)</h2>
        {invoices.slice(0, 6).map((inv) => (
          <div key={inv.id} className="flex justify-between text-sm border-b py-2 last:border-0">
            <span>{inv.billingMonth}</span>
            <span>
              {fmtRwf(Number(inv.totalAmountRwf))}{" "}
              <a className="underline text-blue-600" href={`${API_BASE_URL}/payments/invoices/${inv.id}/download`} target="_blank" rel="noreferrer">
                PDF
              </a>
            </span>
          </div>
        ))}
        {!invoices.length ? <p className="text-sm text-gray-500">No invoices yet.</p> : null}
      </section>
    </DashboardPage>
  );
}

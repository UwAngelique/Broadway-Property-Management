"use client";

import { useEffect, useState } from "react";
import { apiRequest, API_BASE_URL } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useSession } from "@/components/dashboard/use-session";
import { StatusBanner } from "@/components/dashboard/status-banner";
import { fmtRwf } from "@/lib/format";

type Invoice = { id: number; billingMonth: string; totalAmountRwf: number; dueDate: string; status?: string };
type Payment = {
  id: number;
  method: string;
  amountRwf: number;
  status: string;
  createdAt: string;
  bankReference?: string;
  tenantId: number;
};

export default function FinancePage() {
  const { token, user } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    if (!token) return;
    const [inv, pay] = await Promise.all([
      apiRequest<Invoice[]>("/payments/invoices", {}, token),
      apiRequest<Payment[]>("/payments", {}, token),
    ]);
    setInvoices(inv);
    setPayments(pay);
  };

  useEffect(() => {
    if (!user) return;
    if (user.role === "TENANT") {
      window.location.href = "/dashboard/rent";
      return;
    }
    load().catch((e) => setError(e.message));
  }, [token, user]);

  const review = async (paymentId: number, approve: boolean) => {
    if (!token) return;
    try {
      await apiRequest(`/payments/${paymentId}/review`, { method: "PATCH", body: JSON.stringify({ approve }) }, token);
      setMessage(approve ? "Payment approved." : "Payment rejected.");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
    }
  };

  const pending = payments.filter((p) => ["SUBMITTED", "UNDER_REVIEW", "RECEIPT_REQUESTED"].includes(p.status));

  if (!user) return null;

  return (
    <DashboardShell user={user} title={`Finance Â· ${pending.length} pending review`}>
      <StatusBanner message={message} error={error} />

      <p className="text-sm text-gray-600 mb-4 bg-amber-50 border border-amber-100 rounded-lg p-3">
        Bank &amp; MoMo API integrations are pending partner approval. Tenants can pay manually and upload proof or paste MoMo SMS in{" "}
        <strong>My rent</strong>. You approve submissions here.
      </p>

      <section className="bg-white rounded-xl border p-4 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Payments awaiting review ({pending.length})</h2>
        <div className="space-y-2">
          {pending.map((p) => (
            <div key={p.id} className="border rounded-lg p-3 flex flex-col sm:flex-row sm:justify-between gap-2 text-sm">
              <div>
                <p className="font-medium text-gray-900">
                  #{p.id} Â· {p.method} Â· {fmtRwf(Number(p.amountRwf))}
                </p>
                <p className="text-gray-600">Tenant #{p.tenantId} Â· {new Date(p.createdAt).toLocaleString()}</p>
                {p.bankReference ? <p className="text-gray-700 mt-1">Ref: {p.bankReference}</p> : null}
              </div>
              {["OWNER", "ACCOUNTANT", "LAWYER"].includes(user.role) ? (
                <div className="flex gap-2">
                  <button type="button" className="text-xs rounded bg-emerald-700 text-white px-3 py-1" onClick={() => review(p.id, true)}>
                    Approve
                  </button>
                  <button type="button" className="text-xs rounded border px-3 py-1" onClick={() => review(p.id, false)}>
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          ))}
          {!pending.length ? <p className="text-gray-500">No pending proofs.</p> : null}
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <article className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold mb-3">Invoices ({invoices.length})</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex justify-between border rounded p-2 text-sm">
                <span>
                  {inv.billingMonth} Â· due {inv.dueDate}
                </span>
                <span>
                  {fmtRwf(Number(inv.totalAmountRwf))}{" "}
                  <a className="text-blue-600 underline ml-1" href={`${API_BASE_URL}/payments/invoices/${inv.id}/download`} target="_blank" rel="noreferrer">
                    PDF
                  </a>
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold mb-3">All payments ({payments.length})</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto text-sm">
            {payments.map((p) => (
              <div key={p.id} className="border rounded p-2 flex justify-between">
                <span>
                  #{p.id} {p.method}
                </span>
                <span>
                  {fmtRwf(Number(p.amountRwf))} Â· {p.status}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}


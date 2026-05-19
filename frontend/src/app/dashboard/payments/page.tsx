"use client";

import { useEffect, useState } from "react";
import { apiRequest, API_BASE_URL } from "@/lib/api";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { useSession } from "@/components/dashboard/use-session";
import { StatusBanner } from "@/components/dashboard/status-banner";
import { TrustBanner } from "@/components/ui/trust-banner";
import { fmtRwf } from "@/lib/format";
import { LoadingPage } from "@/components/ui/loading-page";

type Invoice = { id: number; billingMonth: string; totalAmountRwf: number; dueDate: string };
type Payment = { id: number; method: string; amountRwf: number; status: string; createdAt: string; bankReference?: string; tenantId: number };

export default function PaymentsPage() {
  const { token, user } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    if (user.role === "TENANT") {
      window.location.href = "/dashboard/portal/pay";
      return;
    }
    load().catch((e) => {
      setError(e.message);
      setLoading(false);
    });
  }, [token, user]);

  const review = async (paymentId: number, approve: boolean) => {
    if (!token) return;
    await apiRequest(`/payments/${paymentId}/review`, { method: "PATCH", body: JSON.stringify({ approve }) }, token);
    setMessage(approve ? "Approved" : "Rejected");
    load();
  };

  const pending = payments.filter((p) => ["SUBMITTED", "UNDER_REVIEW", "RECEIPT_REQUESTED"].includes(p.status));

  if (loading) {
    return (
      <DashboardPage title="Payments">
        <LoadingPage />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage title={`Payments Â· ${pending.length} pending`}>
      <TrustBanner variant="payment" />
      <StatusBanner message={message} error={error} />

      <section className="bg-white rounded-xl border p-4 mb-6">
        <h2 className="font-semibold mb-3">Review queue ({pending.length})</h2>
        <div className="space-y-2">
          {pending.map((p) => (
            <div key={p.id} className="border rounded-lg p-3 text-sm flex flex-col sm:flex-row sm:justify-between gap-2">
              <div>
                <p className="font-medium">
                  #{p.id} Â· {p.method} Â· {fmtRwf(Number(p.amountRwf))}
                </p>
                <p className="text-gray-600">{p.bankReference ?? "No reference text"}</p>
              </div>
              {user && ["OWNER", "ACCOUNTANT", "LAWYER"].includes(user.role) ? (
                <div className="flex gap-2">
                  <button type="button" className="text-xs rounded bg-emerald-700 text-white px-3 py-1" onClick={() => review(p.id, true)}>
                    Approve
                  </button>
                  <button type="button" className="text-xs border rounded px-3 py-1" onClick={() => review(p.id, false)}>
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          ))}
          {!pending.length ? <p className="text-gray-500 text-sm">No pending proofs.</p> : null}
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <article className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold mb-2">Invoices ({invoices.length}) â€” RWF</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto text-sm">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex justify-between border rounded p-2">
                <span>{inv.billingMonth}</span>
                <span>
                  {fmtRwf(Number(inv.totalAmountRwf))}{" "}
                  <a className="underline text-blue-600" href={`${API_BASE_URL}/payments/invoices/${inv.id}/download`} target="_blank" rel="noreferrer">
                    PDF
                  </a>
                </span>
              </div>
            ))}
          </div>
        </article>
        <article className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold mb-2">All payments</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto text-sm">
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
    </DashboardPage>
  );
}


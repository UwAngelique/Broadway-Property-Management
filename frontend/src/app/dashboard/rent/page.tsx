"use client";

import { useEffect, useState } from "react";
import { apiRequest, apiUpload, API_BASE_URL } from "@/lib/api";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { TrustBanner } from "@/components/ui/trust-banner";
import { useSession } from "@/components/dashboard/use-session";
import { StatusBanner } from "@/components/dashboard/status-banner";
import { fmtRwf } from "@/lib/format";

type Invoice = { id: number; billingMonth: string; totalAmountRwf: number; dueDate: string };
type Payment = { id: number; method: string; amountRwf: number; status: string; createdAt: string; bankReference?: string };
type Contract = { id: number; status: string; isApproved: boolean };

export default function RentPage() {
  const { token, user } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    contractId: "",
    billingMonths: "",
    method: "MTN_MOMO" as "MTN_MOMO" | "AIRTEL_MONEY" | "BANK_TRANSFER",
    proofNote: "",
  });

  const load = async () => {
    if (!token) return;
    const [inv, pay, con] = await Promise.all([
      apiRequest<Invoice[]>("/payments/invoices", {}, token),
      apiRequest<Payment[]>("/payments", {}, token),
      apiRequest<Contract[]>("/contracts", {}, token),
    ]);
    setInvoices(inv);
    setPayments(pay);
    setContracts(con.filter((c) => c.isApproved));
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== "TENANT") {
      window.location.href = "/dashboard/payments";
      return;
    }
    load().catch((e) => setError(e.message));
  }, [token, user]);

  const submitProof = async () => {
    if (!token || !user || !form.contractId || !form.billingMonths) return;
    const fd = new FormData();
    fd.append("contractId", form.contractId);
    form.billingMonths
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean)
      .forEach((m) => fd.append("billingMonths", m));
    fd.append("method", form.method);
    if (form.proofNote) fd.append("proofNote", form.proofNote);
    if (file) fd.append("file", file);
    try {
      await apiUpload("/payments/proofs", fd, token);
      setMessage("Payment proof submitted. Your landlord will review it.");
      setFile(null);
      setForm((s) => ({ ...s, proofNote: "", billingMonths: "" }));
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    }
  };

  if (!user) return null;

  return (
    <DashboardPage title="Pay rent">
      <TrustBanner variant="payment" />
      <StatusBanner message={message} error={error} />

      <section className="bg-white rounded-xl border p-4 mb-6 space-y-2">
        <h2 className="font-semibold text-gray-900">Submit manual payment proof</h2>
        <div className="grid md:grid-cols-2 gap-2">
          <select className="border rounded px-3 py-2 text-sm" value={form.contractId} onChange={(e) => setForm((s) => ({ ...s, contractId: e.target.value }))}>
            <option value="">Lease</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                Contract #{c.id}
              </option>
            ))}
          </select>
          <input className="border rounded px-3 py-2 text-sm" placeholder="Billing months (e.g. 2026-05,2026-06)" value={form.billingMonths} onChange={(e) => setForm((s) => ({ ...s, billingMonths: e.target.value }))} />
          <select className="border rounded px-3 py-2 text-sm" value={form.method} onChange={(e) => setForm((s) => ({ ...s, method: e.target.value as typeof form.method }))}>
            <option value="MTN_MOMO">MTN MoMo</option>
            <option value="AIRTEL_MONEY">Airtel Money</option>
            <option value="BANK_TRANSFER">Bank transfer</option>
          </select>
          <input className="border rounded px-3 py-2 text-sm" type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <textarea
            className="border rounded px-3 py-2 text-sm md:col-span-2 min-h-[80px]"
            placeholder="MoMo message or bank reference (required if no file)"
            value={form.proofNote}
            onChange={(e) => setForm((s) => ({ ...s, proofNote: e.target.value }))}
          />
        </div>
        <button type="button" className="rounded bg-gray-900 text-white px-4 py-2 text-sm" onClick={submitProof}>
          Submit proof
        </button>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <article className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold mb-2">Invoices</h2>
          {invoices.map((inv) => (
            <div key={inv.id} className="border rounded p-2 mb-2 text-sm flex justify-between">
              <span>{inv.billingMonth}</span>
              <span>
                {fmtRwf(Number(inv.totalAmountRwf))}{" "}
                <a className="underline text-blue-600" href={`${API_BASE_URL}/payments/invoices/${inv.id}/download`} target="_blank" rel="noreferrer">
                  PDF
                </a>
              </span>
            </div>
          ))}
        </article>
        <article className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold mb-2">My submissions</h2>
          {payments.map((p) => (
            <div key={p.id} className="border rounded p-2 mb-2 text-sm">
              <p>
                #{p.id} {p.method} Â· {fmtRwf(Number(p.amountRwf))}
              </p>
              <p className="text-gray-600">{p.status}</p>
              {p.bankReference ? <p className="text-gray-700">{p.bankReference}</p> : null}
            </div>
          ))}
        </article>
      </section>
    </DashboardPage>
  );
}


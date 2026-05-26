"use client";

import Link from "next/link";
import { useEffect } from "react";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { useSession } from "@/components/dashboard/use-session";

const steps = [
  { n: 1, title: "Add your first property", desc: "Capture name, UPI, and usage (commercial/residential).", href: "/dashboard/properties" },
  { n: 2, title: "Register units", desc: "Add shops, floors, or apartments under each building.", href: "/dashboard/units" },
  { n: 3, title: "Invite a tenant", desc: "Create tenant login (start inactive until lease is signed).", href: "/dashboard/tenants" },
  { n: 4, title: "Upload a lease", desc: "PDF contract with rent in RWF; approve when ready.", href: "/dashboard/leases" },
  { n: 5, title: "Run first rent reminder", desc: "Generate invoices and notify tenants.", href: "/dashboard/operations" },
];

export default function OnboardingPage() {
  const { user, ready } = useSession();

  useEffect(() => {
    if (!ready) return;
    if (!user || user.role !== "OWNER") {
      window.location.href = "/dashboard";
    }
  }, [user, ready]);

  if (!ready || !user || user.role !== "OWNER") return null;

  return (
    <DashboardPage title="Setup guide">
      <p className="text-sm text-gray-600 mb-6">
        Rwanda-first workflow: properties with UPI, leases in RWF, manual MoMo/bank proof until APIs are live, tax rows as trackers (not RRA filing).
      </p>
      <ol className="space-y-4">
        {steps.map((s) => (
          <li key={s.n} className="bg-white rounded-xl border p-4 flex gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white font-semibold">{s.n}</span>
            <div>
              <p className="font-semibold text-gray-900">{s.title}</p>
              <p className="text-sm text-gray-600 mt-1">{s.desc}</p>
              <Link href={s.href} className="text-sm text-blue-700 underline mt-2 inline-block">
                Go →
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </DashboardPage>
  );
}

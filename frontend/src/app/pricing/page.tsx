"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

type Plan = { id: string; name: string; priceLabel: string; tagline: string; features: string[] };

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  useEffect(() => {
    apiRequest<{ plans: Plan[] }>("/billing/plans").then((d) => setPlans(d.plans)).catch(() => null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-4xl mx-auto">
      <Link href="/" className="text-sm underline">
        Home
      </Link>
      <h1 className="text-2xl font-bold mt-4">Pricing (RWF / month)</h1>
      <p className="text-sm text-gray-600 mt-2">VAT and contracts confirmed at onboarding. Enterprise pricing on request.</p>
      <div className="grid md:grid-cols-3 gap-4 mt-8">
        {plans.map((p) => (
          <article key={p.id} className="bg-white border rounded-xl p-4">
            <h2 className="font-semibold">{p.name}</h2>
            <p className="text-lg font-medium mt-1">{p.priceLabel}</p>
            <p className="text-xs text-gray-600">{p.tagline}</p>
            <ul className="text-xs mt-3 list-disc pl-4 space-y-1">
              {p.features.slice(0, 5).map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <Link href="/login" className="inline-block mt-8 rounded-lg bg-gray-900 text-white px-6 py-2 text-sm">
        Sign up
      </Link>
    </div>
  );
}

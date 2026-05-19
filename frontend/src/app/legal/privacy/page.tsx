import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-2xl mx-auto text-sm">
      <Link href="/">Home</Link>
      <h1 className="text-xl font-bold mt-4">Privacy (Rwanda — draft)</h1>
      <p className="mt-4 text-gray-700">
        We process account data, property records (including UPI), leases, payment proofs, and tax obligation notes to operate the service. Data is hosted per your deployment region. You may request export or deletion subject to law and active contracts.
      </p>
      <p className="mt-2 text-gray-600">Align with Law N° 058/2021 and RDB guidance before production launch.</p>
    </div>
  );
}

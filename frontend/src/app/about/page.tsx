import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-2xl mx-auto prose prose-sm">
      <Link href="/">Home</Link>
      <h1>About Broadway Property Management</h1>
      <p>
        We help landlords and property managers in Rwanda run portfolios with UPI-aware property records, leases in RWF, manual MoMo/bank rent collection with proof review, and internal tax obligation tracking aligned with RRA guidance.
      </p>
      <p>Live bank, MoMo, and RRA filing integrations are added as partner approvals complete.</p>
    </div>
  );
}

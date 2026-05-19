import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-2xl mx-auto text-sm">
      <Link href="/">Home</Link>
      <h1 className="text-xl font-bold mt-4">Terms of service (draft)</h1>
      <p className="mt-4 text-gray-700">
        Broadway Property Management is provided as software for record-keeping and workflow. Tax figures are trackers only; filing is your responsibility via RRA. Payment proof review does not guarantee funds cleared until you verify with your bank or MoMo statement.
      </p>
      <p className="mt-2 text-gray-600">Have legal counsel review before charging customers.</p>
    </div>
  );
}

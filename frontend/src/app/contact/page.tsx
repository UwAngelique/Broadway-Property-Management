import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-lg mx-auto">
      <Link href="/" className="text-sm underline">
        Home
      </Link>
      <h1 className="text-2xl font-bold mt-4">Contact</h1>
      <p className="text-sm text-gray-600 mt-2">Support for landlords, accountants, and platform partners.</p>
      <ul className="mt-6 text-sm space-y-2">
        <li>
          Email: <a href="mailto:support@broadwaycreation.rw">support@broadwaycreation.rw</a>
        </li>
        <li>Phone: +250 788 000 000 (update before launch)</li>
        <li>Kigali, Rwanda</li>
      </ul>
    </div>
  );
}

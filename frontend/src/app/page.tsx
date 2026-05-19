import Link from "next/link";
import Image from "next/image";

export default function MarketingHome() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Image src="/broadway-logo.png" alt="Broadway" width={120} height={60} />
          <nav className="flex gap-4 text-sm">
            <Link href="/pricing">Pricing</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/login" className="font-medium text-gray-900">
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Property management built for Rwanda</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          UPI on every property, rent in RWF, manual MoMo/bank proof today, and tax obligation tracking with clear RRA disclaimers — not filing.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/login" className="rounded-lg bg-gray-900 text-white px-6 py-3 text-sm font-medium">
            Start free trial
          </Link>
          <Link href="/pricing" className="rounded-lg border px-6 py-3 text-sm">
            View pricing (RWF)
          </Link>
        </div>
      </main>
    </div>
  );
}

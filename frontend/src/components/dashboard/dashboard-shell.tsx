"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout, type SessionUser } from "@/lib/auth";

export function DashboardShell({
  user,
  title,
  children,
  backHref = "/dashboard",
}: {
  user: SessionUser;
  title: string;
  children: React.ReactNode;
  backHref?: string;
}) {
  const pathname = usePathname();
  const onHub = pathname === "/dashboard";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Image src="/broadway-logo.png" alt="Broadway" width={96} height={48} className="h-10 w-auto" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
              <p className="text-xs text-gray-600">
                {user.email} · {user.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!onHub ? (
              <Link href={backHref} className="text-sm rounded-lg border px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-900">
                ← All departments
              </Link>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="text-sm rounded-lg border px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}


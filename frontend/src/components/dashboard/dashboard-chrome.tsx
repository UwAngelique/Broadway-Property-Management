"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout, type SessionUser } from "@/lib/auth";
import { navItemsFor } from "@/lib/navigation";

export function DashboardChrome({
  user,
  title,
  children,
}: {
  user: SessionUser;
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const nav = navItemsFor(user);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="md:w-56 lg:w-64 bg-white border-b md:border-b-0 md:border-r shrink-0">
        <div className="p-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/broadway-logo.png" alt="Broadway" width={80} height={40} className="h-8 w-auto" />
          </Link>
          <p className="text-[11px] text-gray-500 mt-2 truncate">{user.email}</p>
        </div>
        <nav className="p-2 flex md:flex-col gap-1 overflow-x-auto">
          {nav.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 mt-auto hidden md:block">
          <button type="button" onClick={logout} className="w-full text-sm rounded-lg border py-2 hover:bg-gray-50">
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between md:hidden">
          <h1 className="font-semibold text-gray-900 text-sm">{title}</h1>
          <button type="button" onClick={logout} className="text-xs border rounded px-2 py-1">
            Logout
          </button>
        </header>
        <main className="flex-1 p-4 md:p-6 max-w-5xl w-full">
          <h1 className="hidden md:block text-xl font-semibold text-gray-900 mb-4">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}


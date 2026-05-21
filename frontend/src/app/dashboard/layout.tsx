"use client";

import { useSession } from "@/components/dashboard/use-session";
import { RealtimeProvider } from "@/components/realtime-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useSession();
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        Loading workspace…
      </div>
    );
  }
  return <RealtimeProvider>{children}</RealtimeProvider>;
}


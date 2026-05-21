"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRealtimeSocket, disconnectRealtime } from "@/lib/realtime";

/** Subscribes to account events and refreshes the current route on payment/invoice updates. */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const s = getRealtimeSocket();
    if (!s) return;

    const refresh = () => router.refresh();

    s.on("payment:updated", refresh);
    s.on("invoice:updated", refresh);

    return () => {
      s.off("payment:updated", refresh);
      s.off("invoice:updated", refresh);
      disconnectRealtime();
    };
  }, [router]);

  return <>{children}</>;
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { getRealtimeSocket } from "@/lib/realtime";
import { notifyLanguageFromSync } from "@/components/i18n/language-provider";
import { useLanguage } from "@/components/i18n/language-provider";

const REVISION_KEY = "pm_sync_revision";

type SyncPullResponse = {
  unchanged: boolean;
  revision: string;
  serverTime: string;
  syncIntervalMs: number;
  language?: string;
};

type SyncContextValue = {
  revision: string | null;
  lastSyncedAt: string | null;
  syncing: boolean;
  pullNow: () => Promise<void>;
};

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [revision, setRevision] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pullingRef = useRef(false);

  const pullNow = useCallback(async () => {
    const token = getToken();
    if (!token || pullingRef.current) return;
    pullingRef.current = true;
    setSyncing(true);
    try {
      const stored =
        revision ?? (typeof window !== "undefined" ? localStorage.getItem(REVISION_KEY) : null);
      const qs = stored ? `?revision=${encodeURIComponent(stored)}` : "";
      const data = await apiRequest<SyncPullResponse>(`/sync/pull${qs}`);
      setRevision(data.revision);
      localStorage.setItem(REVISION_KEY, data.revision);
      setLastSyncedAt(data.serverTime);
      if (data.language) notifyLanguageFromSync(data.language);
      if (!data.unchanged) {
        router.refresh();
        window.dispatchEvent(new CustomEvent("pm:sync", { detail: data }));
      }
    } finally {
      setSyncing(false);
      pullingRef.current = false;
    }
  }, [revision, router]);

  useEffect(() => {
    const stored = localStorage.getItem(REVISION_KEY);
    if (stored) setRevision(stored);
    void pullNow();

    intervalRef.current = setInterval(() => {
      void pullNow();
    }, 60_000);

    const socket = getRealtimeSocket();
    const onRefresh = () => void pullNow();
    socket?.on("sync:refresh", onRefresh);
    socket?.on("payment:updated", onRefresh);
    socket?.on("invoice:updated", onRefresh);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      socket?.off("sync:refresh", onRefresh);
      socket?.off("payment:updated", onRefresh);
      socket?.off("invoice:updated", onRefresh);
    };
  }, [pullNow]);

  const value = useMemo(
    () => ({ revision, lastSyncedAt, syncing, pullNow }),
    [revision, lastSyncedAt, syncing, pullNow],
  );

  return (
    <SyncContext.Provider value={value}>
      <div className="sr-only" aria-live="polite">
        {syncing ? t("sync.syncing") : lastSyncedAt ? t("sync.upToDate") : ""}
      </div>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
}

export function SyncStatusBadge({ className = "" }: { className?: string }) {
  const { lastSyncedAt, syncing } = useSync();
  const { t } = useLanguage();
  if (!lastSyncedAt && !syncing) return null;
  const label = syncing
    ? t("sync.syncing")
    : `${t("sync.lastSynced")}: ${new Date(lastSyncedAt!).toLocaleTimeString()}`;
  return (
    <span className={`text-[11px] text-gray-500 ${className}`} title={label}>
      {label}
    </span>
  );
}

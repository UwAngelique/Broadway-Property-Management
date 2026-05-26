"use client";

import { SessionProvider, useSession } from "@/components/dashboard/use-session";
import { useLanguage } from "@/components/i18n/language-provider";
import { SyncProvider } from "@/components/sync/sync-provider";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { ready } = useSession();
  const { t } = useLanguage();
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        {t("common.loading")}
      </div>
    );
  }
  return <SyncProvider>{children}</SyncProvider>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </SessionProvider>
  );
}
